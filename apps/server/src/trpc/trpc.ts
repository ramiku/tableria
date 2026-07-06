import { initTRPC, TRPCError } from '@trpc/server';
import { getMaintenanceStatus } from '../settings/service.js';
import type { TrpcContext } from './context.js';

const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  // El modo mantenimiento bloquea todo salvo al propio admin — el catálogo público
  // (publicProcedure) no pasa por aquí y sigue disponible para pintar la pantalla previa.
  if (!ctx.user.isAdmin) {
    const maintenance = await getMaintenanceStatus(ctx.db);
    if (maintenance.enabled) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: maintenance.message ?? undefined });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user.isAdmin) throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx });
});
