import { describe, expect, it } from 'vitest';
import { clientMessageSchema } from './client-messages.js';
import { serverMessageSchema } from './server-messages.js';

const matchId = '0198c1a0-1234-7abc-8def-1234567890ab';
const userId = '0198c1a0-5678-7abc-8def-1234567890ab';

describe('clientMessageSchema', () => {
  it('acepta match.join', () => {
    const r = clientMessageSchema.safeParse({ type: 'match.join', payload: { matchId } });
    expect(r.success).toBe(true);
  });

  it('acepta match.resume sin lastSeq', () => {
    const r = clientMessageSchema.safeParse({ type: 'match.resume', payload: { matchId } });
    expect(r.success).toBe(true);
  });

  it('acepta match.resume con lastSeq', () => {
    const r = clientMessageSchema.safeParse({
      type: 'match.resume',
      payload: { matchId, lastSeq: 4 },
    });
    expect(r.success).toBe(true);
  });

  it('acepta match.move con move arbitrario', () => {
    const r = clientMessageSchema.safeParse({
      type: 'match.move',
      payload: { matchId, move: { cell: 4 } },
    });
    expect(r.success).toBe(true);
  });

  it('acepta chat.send', () => {
    const r = clientMessageSchema.safeParse({
      type: 'chat.send',
      payload: { matchId, body: 'hola' },
    });
    expect(r.success).toBe(true);
  });

  it('rechaza chat.send con body vacío', () => {
    const r = clientMessageSchema.safeParse({
      type: 'chat.send',
      payload: { matchId, body: '' },
    });
    expect(r.success).toBe(false);
  });

  it('rechaza matchId que no es uuid', () => {
    const r = clientMessageSchema.safeParse({
      type: 'match.join',
      payload: { matchId: 'no-es-un-uuid' },
    });
    expect(r.success).toBe(false);
  });

  it('rechaza un type desconocido', () => {
    const r = clientMessageSchema.safeParse({ type: 'match.teleport', payload: {} });
    expect(r.success).toBe(false);
  });
});

describe('serverMessageSchema', () => {
  it('acepta match.lobby', () => {
    const r = serverMessageSchema.safeParse({
      type: 'match.lobby',
      payload: {
        matchId,
        state: 'waiting',
        maxPlayers: 2,
        seats: [{ seat: 0, userId, username: 'ramiku', avatarInitial: 'R', avatarColor: '#2f6fe0', ready: false, connected: true }],
        startsAt: null,
      },
    });
    expect(r.success).toBe(true);
  });

  it('acepta match.state con view arbitraria', () => {
    const r = serverMessageSchema.safeParse({
      type: 'match.state',
      payload: {
        matchId,
        seq: 3,
        view: { board: Array(9).fill(null), turn: 0, winner: null },
        turnDeadlineAt: new Date().toISOString(),
        activePlayers: [0],
        players: [{ seat: 0, userId, username: 'ramiku', connected: true }],
      },
    });
    expect(r.success).toBe(true);
  });

  it('acepta match.ended casual (sin rating)', () => {
    const r = serverMessageSchema.safeParse({
      type: 'match.ended',
      payload: {
        matchId,
        reason: 'completed',
        ranking: [
          { seat: 0, placement: 1, result: 'win' },
          { seat: 1, placement: 2, result: 'lose' },
        ],
        ratingDeltas: null,
      },
    });
    expect(r.success).toBe(true);
  });

  it('acepta match.ended rated (con deltas de rating)', () => {
    const r = serverMessageSchema.safeParse({
      type: 'match.ended',
      payload: {
        matchId,
        reason: 'completed',
        ranking: [
          { seat: 0, placement: 1, result: 'win' },
          { seat: 1, placement: 2, result: 'lose' },
        ],
        ratingDeltas: [
          { seat: 0, ratingBefore: 1500, ratingAfter: 1516 },
          { seat: 1, ratingBefore: 1500, ratingAfter: 1484 },
        ],
      },
    });
    expect(r.success).toBe(true);
  });

  it('acepta chat.message', () => {
    const r = serverMessageSchema.safeParse({
      type: 'chat.message',
      payload: {
        matchId,
        id: userId,
        userId,
        username: 'ramiku',
        body: 'hola',
        createdAt: new Date().toISOString(),
      },
    });
    expect(r.success).toBe(true);
  });

  it('rechaza reason fuera del enum en match.ended', () => {
    const r = serverMessageSchema.safeParse({
      type: 'match.ended',
      payload: { matchId, reason: 'timeout', ranking: [] },
    });
    expect(r.success).toBe(false);
  });
});
