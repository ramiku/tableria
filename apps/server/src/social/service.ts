import { eq, users, type Db } from '@tableria/db';
import type { ServerMessage } from '@tableria/protocol';
import { sendError } from '../match/broadcast.js';
import type { AuthedSocket } from '../match/registry.js';
import { containsProfanity } from '../moderation/profanity.js';
import * as reputation from '../reputation/service.js';
import { sendToSocket } from '../ws/send.js';
import * as activity from './activity.js';
import * as conversations from './conversations.js';
import * as friends from './friends.js';
import * as notifications from './notifications.js';
import { socketsFor } from './presence.js';

export interface SocialService {
  sendFriendRequest(meId: string, targetUsername: string): Promise<friends.SendRequestResult>;
  respondFriendRequest(meId: string, otherUserId: string, accept: boolean): Promise<boolean>;
  cancelFriendRequest(meId: string, otherUserId: string): Promise<boolean>;
  removeFriend(meId: string, otherUserId: string): Promise<boolean>;
  blockUser(meId: string, otherUserId: string): Promise<void>;
  unblockUser(meId: string, otherUserId: string): Promise<boolean>;
  sendDirectMessage(
    socket: AuthedSocket,
    conversationId: string,
    body: string,
    kind: 'text' | 'invite',
    matchId?: string,
  ): Promise<void>;
}

function pushToUser(userId: string, message: ServerMessage): void {
  for (const socket of socketsFor(userId)) sendToSocket(socket, message);
}

export function createSocialService(db: Db): SocialService {
  async function notify(userId: string, type: notifications.NotificationType, payload: unknown): Promise<void> {
    const row = await notifications.create(db, userId, type, payload);
    pushToUser(userId, {
      type: 'notification.new',
      payload: { id: row.id, type: row.type, payload: row.payload, createdAt: row.createdAt.toISOString() },
    });
  }

  return {
    async sendFriendRequest(meId, targetUsername) {
      const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, targetUsername)).limit(1);
      if (!target) throw new Error('No existe ningún usuario con ese nick');
      if (target.id === meId) throw new Error('No puedes enviarte una solicitud a ti mismo');

      const result = await friends.sendFriendRequest(db, meId, target.id);
      if (result.outcome === 'sent') {
        await activity.record(db, meId, target.id, 'friend_request', {});
        await notify(target.id, 'friend_request', {});
      } else if (result.outcome === 'auto_accepted') {
        await activity.record(db, meId, target.id, 'friend_accepted', {});
        await activity.record(db, target.id, meId, 'friend_accepted', {});
        await notify(target.id, 'friend_accepted', {});
      }
      return result;
    },

    async respondFriendRequest(meId, otherUserId, accept) {
      const ok = await friends.respondFriendRequest(db, meId, otherUserId, accept);
      if (ok && accept) {
        await activity.record(db, meId, otherUserId, 'friend_accepted', {});
        await notify(otherUserId, 'friend_accepted', {});
      }
      return ok;
    },

    cancelFriendRequest: (meId, otherUserId) => friends.cancelFriendRequest(db, meId, otherUserId),
    removeFriend: (meId, otherUserId) => friends.removeFriend(db, meId, otherUserId),
    blockUser: (meId, otherUserId) => friends.blockUser(db, meId, otherUserId),
    unblockUser: (meId, otherUserId) => friends.unblockUser(db, meId, otherUserId),

    async sendDirectMessage(socket, conversationId, body, kind, matchId) {
      const member = await conversations.isMember(db, conversationId, socket.userId);
      if (!member) throw new Error('No perteneces a esta conversación');

      if (kind === 'text' && containsProfanity(body)) {
        await reputation.recordProfanityBlock(db, socket.userId);
        return sendError(socket, 'BLOCKED_LANGUAGE', 'Tu mensaje se bloqueó por lenguaje inadecuado');
      }

      const entry = await conversations.sendMessage(db, conversationId, socket.userId, body, kind, matchId);
      const message: ServerMessage = {
        type: 'dm.message',
        payload: { ...entry, conversationId, createdAt: entry.createdAt.toISOString() },
      };

      const memberIds = await conversations.getMemberIds(db, conversationId);
      for (const memberId of memberIds) pushToUser(memberId, message);

      if (kind === 'invite') {
        const payload = { matchId, code: entry.inviteMatchCode };
        for (const memberId of memberIds) {
          if (memberId === socket.userId) continue;
          await activity.record(db, socket.userId, memberId, 'invited', payload);
          await notify(memberId, 'invited', payload);
        }
      }
    },
  };
}
