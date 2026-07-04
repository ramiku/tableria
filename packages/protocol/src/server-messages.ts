import { z } from 'zod';

export const seatSchema = z.object({
  seat: z.number().int(),
  userId: z.uuid().nullable(),
  username: z.string().nullable(),
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
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;
