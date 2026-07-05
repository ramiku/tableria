import { z } from 'zod';
import * as notifications from '../../social/notifications.js';
import { protectedProcedure, router } from '../trpc.js';

export const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await notifications.list(ctx.db, ctx.user.id);
    return rows.map((n) => ({ ...n, readAt: n.readAt ? n.readAt.toISOString() : null, createdAt: n.createdAt.toISOString() }));
  }),

  markRead: protectedProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    await notifications.markRead(ctx.db, ctx.user.id, input.id);
    return { ok: true };
  }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await notifications.markAllRead(ctx.db, ctx.user.id);
    return { ok: true };
  }),
});
