import { z } from 'zod';

export const seatSchema = z.object({
  seat: z.number().int(),
  userId: z.uuid().nullable(),
  username: z.string().nullable(),
  avatarInitial: z.string().nullable(),
  avatarColor: z.string().nullable(),
  ready: z.boolean(),
  connected: z.boolean(),
});

const playerSchema = z.object({
  seat: z.number().int(),
  userId: z.uuid(),
  username: z.string(),
  connected: z.boolean(),
});

const rankingEntrySchema = z.object({
  seat: z.number().int(),
  placement: z.number().int(),
  result: z.enum(['win', 'lose', 'draw']),
});

const chatEntrySchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  username: z.string(),
  body: z.string(),
  createdAt: z.iso.datetime(),
});

const presenceValueSchema = z.enum(['online', 'away', 'in_game', 'offline']);

const dmEntrySchema = z.object({
  id: z.uuid(),
  conversationId: z.uuid(),
  userId: z.uuid().nullable(),
  username: z.string().nullable(),
  kind: z.enum(['text', 'system', 'invite']),
  body: z.string(),
  inviteMatchId: z.uuid().nullable(),
  inviteMatchCode: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const serverMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('match.lobby'),
    payload: z.object({
      matchId: z.uuid(),
      state: z.enum(['waiting', 'starting', 'cancelled']),
      maxPlayers: z.number().int(),
      seats: z.array(seatSchema),
      startsAt: z.iso.datetime().nullable(),
    }),
  }),
  z.object({
    type: z.literal('match.state'),
    payload: z.object({
      matchId: z.uuid(),
      seq: z.number().int(),
      view: z.unknown(),
      turnDeadlineAt: z.iso.datetime().nullable(),
      activePlayers: z.array(z.number().int()),
      players: z.array(playerSchema),
    }),
  }),
  z.object({
    type: z.literal('match.ended'),
    payload: z.object({
      matchId: z.uuid(),
      reason: z.enum(['completed', 'forfeit']),
      ranking: z.array(rankingEntrySchema),
      // null si la partida era casual (no rated); si no, delta de rating por asiento.
      ratingDeltas: z
        .array(z.object({ seat: z.number().int(), ratingBefore: z.number(), ratingAfter: z.number() }))
        .nullable(),
    }),
  }),
  z.object({
    type: z.literal('match.error'),
    payload: z.object({ code: z.string(), message: z.string() }),
  }),
  z.object({
    type: z.literal('chat.message'),
    payload: z.object({ matchId: z.uuid() }).extend(chatEntrySchema.shape),
  }),
  z.object({
    type: z.literal('chat.history'),
    payload: z.object({ matchId: z.uuid(), messages: z.array(chatEntrySchema) }),
  }),
  z.object({
    type: z.literal('presence.snapshot'),
    payload: z.object({
      friends: z.array(z.object({ userId: z.uuid(), presence: presenceValueSchema, lastSeenAt: z.iso.datetime().nullable() })),
    }),
  }),
  z.object({
    type: z.literal('presence.update'),
    payload: z.object({ userId: z.uuid(), presence: presenceValueSchema, lastSeenAt: z.iso.datetime().nullable() }),
  }),
  z.object({
    type: z.literal('dm.message'),
    payload: dmEntrySchema,
  }),
  z.object({
    type: z.literal('notification.new'),
    payload: z.object({
      id: z.uuid(),
      type: z.enum([
        'friend_request',
        'friend_accepted',
        'invited',
        'your_turn',
        'tournament_round_started',
        'tournament_eliminated',
      ]),
      payload: z.unknown(),
      createdAt: z.iso.datetime(),
    }),
  }),
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;
