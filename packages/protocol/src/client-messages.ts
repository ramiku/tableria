import { z } from 'zod';

export const clientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('match.join'), payload: z.object({ matchId: z.uuid() }) }),
  z.object({ type: z.literal('match.watch'), payload: z.object({ matchId: z.uuid() }) }),
  z.object({
    type: z.literal('match.resume'),
    payload: z.object({ matchId: z.uuid(), lastSeq: z.number().int().nonnegative().optional() }),
  }),
  z.object({
    type: z.literal('match.move'),
    payload: z.object({ matchId: z.uuid(), move: z.unknown() }),
  }),
  z.object({
    type: z.literal('chat.send'),
    payload: z.object({ matchId: z.uuid(), body: z.string().trim().min(1).max(500) }),
  }),
  z.object({
    type: z.literal('dm.send'),
    payload: z.object({
      conversationId: z.uuid(),
      body: z.string().trim().min(1).max(2000),
      kind: z.enum(['text', 'invite']).default('text'),
      matchId: z.uuid().optional(),
    }),
  }),
  // Abandono unilateral: derrota real e inmediata para quien lo manda.
  z.object({ type: z.literal('match.forfeit'), payload: z.object({ matchId: z.uuid() }) }),
  // Abandono mutuo: propone cortar la partida sin que cuente para nadie; solo se
  // efectúa cuando todos los asientos activos lo han pedido (ver `match.abandonStatus`).
  z.object({ type: z.literal('match.abandonRequest'), payload: z.object({ matchId: z.uuid() }) }),
  z.object({ type: z.literal('match.abandonCancel'), payload: z.object({ matchId: z.uuid() }) }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;
