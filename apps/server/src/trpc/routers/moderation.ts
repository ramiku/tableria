import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { eq, matchPlayers } from '@tableria/db';
import * as reputation from '../../reputation/service.js';
import { protectedProcedure, router } from '../trpc.js';

export const moderationRouter = router({
  /** Reportar solo es posible tras haber compartido una partida con esa persona. */
  report: protectedProcedure
    .input(
      z.object({
        matchId: z.uuid(),
        reportedUserId: z.uuid(),
        reason: z.enum(['abusive_language', 'unsportsmanlike', 'cheating', 'other']),
        comment: z.string().trim().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.reportedUserId === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No puedes reportarte a ti mismo' });
      }

      const seated = await ctx.db
        .select({ userId: matchPlayers.userId })
        .from(matchPlayers)
        .where(eq(matchPlayers.matchId, input.matchId));
      const seatedIds = new Set(seated.map((s) => s.userId));
      if (!seatedIds.has(ctx.user.id) || !seatedIds.has(input.reportedUserId)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Solo puedes reportar a alguien con quien hayas compartido una partida',
        });
      }

      const result = await reputation.recordReport(ctx.db, {
        reporterId: ctx.user.id,
        reportedUserId: input.reportedUserId,
        matchId: input.matchId,
        reason: input.reason,
        comment: input.comment,
      });
      if (!result.ok) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Ya has reportado a este jugador por esta partida' });
      }
      return { ok: true };
    }),
});
