import * as activity from '../../social/activity.js';
import { protectedProcedure, router } from '../trpc.js';

export const activityRouter = router({
  listForMe: protectedProcedure.query(async ({ ctx }) => {
    const rows = await activity.listForUser(ctx.db, ctx.user.id);
    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  }),
});
