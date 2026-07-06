import { z } from 'zod';

// Señal WebRTC en bruto: el servidor solo la reenvía, nunca la interpreta.
export const voiceSignalSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('offer'), sdp: z.string() }),
  z.object({ kind: z.literal('answer'), sdp: z.string() }),
  z.object({ kind: z.literal('ice-candidate'), candidate: z.unknown() }),
]);

// Una sala de voz es una conversación de grupo o una partida — nunca ambas a la vez.
export const voiceRoomSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('conversation'), conversationId: z.uuid() }),
  z.object({ kind: z.literal('match'), matchId: z.uuid() }),
]);
export type VoiceRoom = z.infer<typeof voiceRoomSchema>;

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
  // Llamada de voz (conversación de grupo o partida): unirse/salir y reenvío de
  // señalización WebRTC (malla P2P).
  z.object({ type: z.literal('voice.join'), payload: z.object({ room: voiceRoomSchema }) }),
  z.object({ type: z.literal('voice.leave'), payload: z.object({ room: voiceRoomSchema }) }),
  z.object({
    type: z.literal('voice.signal'),
    payload: z.object({ room: voiceRoomSchema, targetUserId: z.uuid(), signal: voiceSignalSchema }),
  }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;
