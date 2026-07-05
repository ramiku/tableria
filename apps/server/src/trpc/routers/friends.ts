import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import * as friends from '../../social/friends.js';
import { protectedProcedure, router } from '../trpc.js';

function serializeProfile(p: friends.FriendProfile) {
  return { ...p, lastSeenAt: p.lastSeenAt ? p.lastSeenAt.toISOString() : null };
}

export const friendsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => (await friends.listFriends(ctx.db, ctx.user.id)).map(serializeProfile)),

  listPending: protectedProcedure.query(async ({ ctx }) => {
    const { incoming, outgoing } = await friends.listPending(ctx.db, ctx.user.id);
    const serialize = (r: friends.PendingRequest) => ({ profile: serializeProfile(r.profile), createdAt: r.createdAt.toISOString() });
    return { incoming: incoming.map(serialize), outgoing: outgoing.map(serialize) };
  }),

  listBlocked: protectedProcedure.query(async ({ ctx }) => (await friends.listBlocked(ctx.db, ctx.user.id)).map(serializeProfile)),

  sendRequest: protectedProcedure.input(z.object({ username: z.string().trim().min(1) })).mutation(async ({ ctx, input }) => {
    try {
      return await ctx.socialService.sendFriendRequest(ctx.user.id, input.username);
    } catch (err) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: err instanceof Error ? err.message : 'No se pudo enviar la solicitud' });
    }
  }),

  accept: protectedProcedure.input(z.object({ userId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const ok = await ctx.socialService.respondFriendRequest(ctx.user.id, input.userId, true);
    if (!ok) throw new TRPCError({ code: 'NOT_FOUND', message: 'No hay ninguna solicitud pendiente de ese usuario' });
    return { ok: true };
  }),

  reject: protectedProcedure.input(z.object({ userId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const ok = await ctx.socialService.respondFriendRequest(ctx.user.id, input.userId, false);
    if (!ok) throw new TRPCError({ code: 'NOT_FOUND', message: 'No hay ninguna solicitud pendiente de ese usuario' });
    return { ok: true };
  }),

  cancel: protectedProcedure.input(z.object({ userId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const ok = await ctx.socialService.cancelFriendRequest(ctx.user.id, input.userId);
    if (!ok) throw new TRPCError({ code: 'NOT_FOUND', message: 'No hay ninguna solicitud que cancelar' });
    return { ok: true };
  }),

  remove: protectedProcedure.input(z.object({ userId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const ok = await ctx.socialService.removeFriend(ctx.user.id, input.userId);
    if (!ok) throw new TRPCError({ code: 'NOT_FOUND', message: 'No sois amigos' });
    return { ok: true };
  }),

  block: protectedProcedure.input(z.object({ userId: z.uuid() })).mutation(async ({ ctx, input }) => {
    await ctx.socialService.blockUser(ctx.user.id, input.userId);
    return { ok: true };
  }),

  unblock: protectedProcedure.input(z.object({ userId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const ok = await ctx.socialService.unblockUser(ctx.user.id, input.userId);
    if (!ok) throw new TRPCError({ code: 'NOT_FOUND', message: 'No has bloqueado a ese usuario' });
    return { ok: true };
  }),
});
