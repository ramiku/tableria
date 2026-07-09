import { createRng } from '@tableria/engine';
import { describe, expect, it } from 'vitest';
import { tuteDefinition } from './definition.js';
import { activePlayers, applyMove, checkEnd, groupOf, playerView, setup, validateMove } from './logic.js';
import type { TuteCard, TuteState } from './types.js';

function setupState(numPlayers = 4, variant?: string): TuteState {
  return setup({ numPlayers, rng: createRng('tute-test-seed'), options: variant ? { variant } : undefined });
}

function ctx(seat: number) {
  return { seat, now: new Date() };
}

function card(suit: TuteCard['suit'], rank: TuteCard['rank']): TuteCard {
  return { suit, rank };
}

function play(cardIndex: number, cante?: TuteCard['suit']) {
  return { type: 'play' as const, cardIndex, cante };
}

const CONTINUE = { type: 'continue' as const };

describe('groupOf', () => {
  it('con 4 jugadores empareja asientos opuestos (0+2 contra 1+3)', () => {
    expect(groupOf(0, 4)).toBe(groupOf(2, 4));
    expect(groupOf(1, 4)).toBe(groupOf(3, 4));
    expect(groupOf(0, 4)).not.toBe(groupOf(1, 4));
  });

  it('con 3 jugadores cada asiento es su propio grupo', () => {
    expect(groupOf(0, 3)).toBe(0);
    expect(groupOf(1, 3)).toBe(1);
    expect(groupOf(2, 3)).toBe(2);
  });
});

describe('setup', () => {
  it('con 4 jugadores reparte la baraja de 48 a partes iguales (12 cada uno) y crea 2 grupos', () => {
    const state = setupState(4);
    expect(state.hands).toHaveLength(4);
    for (const hand of state.hands) expect(hand).toHaveLength(12);
    expect(state.groupScores).toEqual([0, 0]);
    expect(state.matchRoundsWon).toEqual([0, 0]);
    expect(state.cantedSuits).toEqual([]);
  });

  it('con 3 jugadores reparte 16 cartas cada uno y crea 3 grupos (individual)', () => {
    const state = setupState(3);
    expect(state.hands).toHaveLength(3);
    for (const hand of state.hands) expect(hand).toHaveLength(16);
    expect(state.groupScores).toEqual([0, 0, 0]);
    expect(state.matchRoundsWon).toEqual([0, 0, 0]);
  });

  it('arranca con el asiento 0 abriendo la primera baza, ronda 1, sin pausa', () => {
    const state = setupState(4);
    expect(state.turn).toBe(0);
    expect(state.leadSeat).toBe(0);
    expect(state.currentTrick).toEqual([null, null, null, null]);
    expect(state.roundNumber).toBe(1);
    expect(state.phase).toBe('playing');
    expect(state.pendingConfirm).toEqual([]);
    expect(state.lastRoundSummary).toBeNull();
  });

  it('usa 1 ronda por defecto si no se elige variante', () => {
    expect(setupState(4).roundsToWin).toBe(1);
  });

  it('respeta el número de rondas elegido en el lobby (1, 3 o 5)', () => {
    expect(setupState(4, '3').roundsToWin).toBe(3);
    expect(setupState(4, '5').roundsToWin).toBe(5);
  });

  it('ignora una variante inválida y usa el valor por defecto', () => {
    expect(setupState(4, 'nope').roundsToWin).toBe(1);
  });
});

describe('validateMove', () => {
  it('rechaza mover fuera de turno y un índice de carta fuera de la mano', () => {
    const state = setupState(4);
    expect(validateMove(state, play(0), ctx(1))).toEqual({ ok: false, code: 'NOT_YOUR_TURN' });
    expect(validateMove(state, play(99), ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('acepta cantar rey+caballo del mismo palo al abrir baza', () => {
    const state: TuteState = { ...setupState(4), hands: [[card('oros', 12), card('oros', 11), card('copas', 2)], [], [], []] };
    expect(validateMove(state, play(2, 'oros'), ctx(0))).toEqual({ ok: true });
  });

  it('rechaza cantar sin tener rey y caballo del palo a la vez', () => {
    const state: TuteState = { ...setupState(4), hands: [[card('oros', 12), card('copas', 2)], [], [], []] };
    expect(validateMove(state, play(1, 'oros'), ctx(0))).toEqual({ ok: false, code: 'INVALID_CANTE' });
  });

  it('rechaza cantar un palo que ya se cantó esta ronda', () => {
    const state: TuteState = {
      ...setupState(4),
      hands: [[card('oros', 12), card('oros', 11), card('copas', 2)], [], [], []],
      cantedSuits: ['oros'],
    };
    expect(validateMove(state, play(2, 'oros'), ctx(0))).toEqual({ ok: false, code: 'INVALID_CANTE' });
  });

  it('rechaza cantar si no es quien abre la baza (currentTrick ya tiene cartas)', () => {
    const state: TuteState = {
      ...setupState(4),
      hands: [[card('bastos', 2)], [card('oros', 12), card('oros', 11)], [], []],
      currentTrick: [card('bastos', 4), null, null, null],
      leadSeat: 0,
      turn: 1,
    };
    expect(validateMove(state, play(0, 'oros'), ctx(1))).toEqual({ ok: false, code: 'INVALID_CANTE' });
  });

  it('rechaza jugar una carta mientras se espera confirmación de fin de ronda', () => {
    const state: TuteState = { ...setupState(4), phase: 'roundEnd', pendingConfirm: [0, 1, 2, 3] };
    expect(validateMove(state, play(0), ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('rechaza continuar fuera de la pausa de fin de ronda', () => {
    const state = setupState(4);
    expect(validateMove(state, CONTINUE, ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('rechaza continuar de un asiento que ya no está pendiente', () => {
    const state: TuteState = { ...setupState(4), phase: 'roundEnd', pendingConfirm: [1, 2, 3] };
    expect(validateMove(state, CONTINUE, ctx(0))).toEqual({ ok: false, code: 'NOT_YOUR_TURN' });
  });
});

describe('applyMove — cante', () => {
  it('cantar suma 20 al grupo del asiento y marca el palo como cantado, sin gastar un turno aparte', () => {
    const state: TuteState = {
      ...setupState(4),
      trumpSuit: 'espadas',
      hands: [[card('oros', 12), card('oros', 11)], [card('bastos', 2)], [card('bastos', 3)], [card('bastos', 4)]],
    };
    const next = applyMove(state, play(0, 'oros'), ctx(0));
    expect(next.groupScores[groupOf(0, 4)]).toBe(20);
    expect(next.cantedSuits).toEqual(['oros']);
    expect(next.turn).toBe(1); // sigue habiendo jugado una carta normal, el turno avanza igual
  });

  it('cantar el palo de triunfo vale 40 ("las cuarenta") en vez de 20', () => {
    const state: TuteState = {
      ...setupState(4),
      trumpSuit: 'oros',
      hands: [[card('oros', 12), card('oros', 11)], [card('bastos', 2)], [card('bastos', 3)], [card('bastos', 4)]],
    };
    const next = applyMove(state, play(0, 'oros'), ctx(0));
    expect(next.groupScores[groupOf(0, 4)]).toBe(40);
  });
});

describe('applyMove — resolución de baza', () => {
  it('con triunfo en juego, gana el triunfo más alto aunque el otro palo tenga más rango nominal', () => {
    // A diferencia de Brisca, aquí SIEMPRE juegan los 4 asientos en cada baza (sin activePlayers
    // dinámico) — seat2/seat3 juegan cartas de relleno que no pueden ganar, para no distraer del caso.
    // Cada mano lleva una segunda carta de relleno para que, tras resolver esta baza, ninguna
    // mano quede vacía — así no se solapa con el bonus de última baza (probado aparte).
    const state: TuteState = {
      ...setupState(4),
      trumpSuit: 'oros',
      hands: [
        [card('copas', 12), card('bastos', 5)],
        [card('oros', 2), card('bastos', 6)],
        [card('copas', 4), card('bastos', 7)],
        [card('bastos', 4), card('bastos', 2)],
      ],
      currentTrick: [null, null, null, null],
      leadSeat: 0,
      turn: 0,
      groupScores: [0, 0],
      cantedSuits: [],
    };
    let next = applyMove(state, play(0), ctx(0)); // seat0 abre con rey de copas
    next = applyMove(next, play(0), ctx(1)); // seat1 juega el 2 de triunfo (oros)
    next = applyMove(next, play(0), ctx(2)); // seat2 sigue el palo con un 4 (no gana)
    next = applyMove(next, play(0), ctx(3)); // seat3 no puede ni triunfo ni palo de la mano
    expect(next.leadSeat).toBe(1);
    // El 2 de triunfo bate a cualquier no-triunfo — el grupo de seat1 se lleva los 4 puntos del rey.
    expect(next.groupScores[groupOf(1, 4)]).toBe(4);
  });

  it('sin triunfo en juego, gana la carta más alta del palo que abrió; un tercer palo nunca gana', () => {
    const state: TuteState = {
      ...setupState(4),
      trumpSuit: 'oros',
      hands: [
        [card('espadas', 7), card('bastos', 5)],
        [card('bastos', 12), card('bastos', 6)],
        [card('espadas', 2), card('bastos', 8)],
        [card('copas', 3), card('bastos', 9)],
      ],
      currentTrick: [null, null, null, null],
      leadSeat: 0,
      turn: 0,
      groupScores: [0, 0],
      cantedSuits: [],
    };
    let next = applyMove(state, play(0), ctx(0)); // abre con espadas (7)
    next = applyMove(next, play(0), ctx(1)); // rey de bastos: ni triunfo ni palo de la mano
    next = applyMove(next, play(0), ctx(2)); // sigue el palo con un 2 (más débil que el 7)
    next = applyMove(next, play(0), ctx(3)); // 3 de copas: tampoco triunfo ni palo de la mano
    expect(next.leadSeat).toBe(0);
    // Se lleva los 4 (rey de bastos) + 10 (3 de copas) = 14 puntos de la baza.
    expect(next.groupScores[groupOf(0, 4)]).toBe(14);
  });

  it('ganar la última baza de la ronda suma el bonus de 10 puntos y decide la partida (a 1 ronda)', () => {
    const state: TuteState = {
      ...setupState(4), // por defecto, a 1 ronda
      hands: [[card('copas', 1)], [card('copas', 2)], [card('copas', 4)], [card('copas', 5)]],
      currentTrick: [null, null, null, null],
      leadSeat: 0,
      turn: 0,
      groupScores: [0, 0],
      cantedSuits: [],
    };
    let next = applyMove(state, play(0), ctx(0));
    next = applyMove(next, play(0), ctx(1));
    next = applyMove(next, play(0), ctx(2));
    next = applyMove(next, play(0), ctx(3));
    // As de copas (11 puntos) gana la baza + 10 de bonus por ser la última = 21, todo para el grupo 0.
    expect(next.groupScores[groupOf(0, 4)]).toBe(21);
    expect(next.hands.every((h) => h.length === 0)).toBe(true);
    expect(next.matchRoundsWon[groupOf(0, 4)]).toBe(1);
    expect(activePlayers(next)).toEqual([]);
    expect(checkEnd(next)).not.toBeNull();
  });
});

describe('fin de ronda y pausa de confirmación', () => {
  it('si la ronda no decide la partida, se congela en roundEnd hasta que todos confirmen', () => {
    const state: TuteState = {
      ...setupState(4, '3'), // a 3 rondas: la primera ronda ganada nunca decide la partida sola
      hands: [[card('copas', 1)], [card('copas', 2)], [card('copas', 4)], [card('copas', 5)]],
      currentTrick: [null, null, null, null],
      leadSeat: 0,
      turn: 0,
      groupScores: [0, 0],
      cantedSuits: [],
    };
    let next = applyMove(state, play(0), ctx(0));
    next = applyMove(next, play(0), ctx(1));
    next = applyMove(next, play(0), ctx(2));
    next = applyMove(next, play(0), ctx(3));

    expect(next.matchRoundsWon[groupOf(0, 4)]).toBe(1);
    expect(next.phase).toBe('roundEnd');
    expect(next.pendingConfirm).toEqual([0, 1, 2, 3]);
    expect(activePlayers(next)).toEqual([0, 1, 2, 3]);
    expect(next.lastRoundSummary!.winnerGroups).toEqual([groupOf(0, 4)]);
    expect(checkEnd(next)).toBeNull();

    for (const seat of [0, 1, 2]) {
      next = applyMove(next, CONTINUE, ctx(seat));
      expect(next.phase).toBe('roundEnd');
    }
    next = applyMove(next, CONTINUE, ctx(3));

    expect(next.phase).toBe('playing');
    expect(next.pendingConfirm).toEqual([]);
    expect(next.roundNumber).toBe(2);
    expect(next.groupScores).toEqual([0, 0]);
    expect(next.cantedSuits).toEqual([]);
    expect(next.hands.every((h) => h.length === 12)).toBe(true);
    expect(next.matchRoundsWon[groupOf(0, 4)]).toBe(1); // las rondas ganadas se conservan
  });

  it('un empate en el máximo de puntos de la ronda no otorga ronda ganada a ningún grupo', () => {
    const state: TuteState = {
      ...setupState(3, '3'), // Tute Cabrón: cada asiento es su propio grupo
      hands: [[card('bastos', 4)], [card('bastos', 5)], [card('bastos', 6)]],
      currentTrick: [null, null, null],
      leadSeat: 0,
      turn: 0,
      groupScores: [30, 30, 20],
      cantedSuits: [],
    };
    // La última baza no vale puntos de por sí (ranks sin puntuación) pero sí suma el bonus de 10 a
    // quien la gane — seat2 (grupo 2) la gana con el 6 de bastos, quedando 30/30/30: triple empate.
    let next = applyMove(state, play(0), ctx(0));
    next = applyMove(next, play(0), ctx(1));
    next = applyMove(next, play(0), ctx(2));

    expect(next.groupScores).toEqual([30, 30, 30]);
    expect(next.lastRoundSummary!.winnerGroups).toEqual([]);
    expect(next.matchRoundsWon).toEqual([0, 0, 0]);
    expect(next.phase).toBe('roundEnd'); // se sigue jugando otra ronda para desempatar
  });
});

describe('activePlayers / checkEnd', () => {
  it('hay turno activo mientras la partida no está decidida', () => {
    expect(activePlayers(setupState(4))).toEqual([0]);
    expect(checkEnd(setupState(4))).toBeNull();
  });

  it('con 4 jugadores, ambos miembros de la pareja ganadora comparten placement 1', () => {
    const state: TuteState = { ...setupState(4), matchRoundsWon: [1, 0] }; // roundsToWin por defecto: 1
    expect(activePlayers(state)).toEqual([]);
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'win' },
        { seat: 1, placement: 2, result: 'lose' },
        { seat: 2, placement: 1, result: 'win' },
        { seat: 3, placement: 2, result: 'lose' },
      ],
    });
  });

  it('con 3 jugadores (Tute Cabrón) el ranking es individual', () => {
    const state: TuteState = { ...setupState(3), matchRoundsWon: [1, 3, 0] };
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 2, result: 'lose' },
        { seat: 1, placement: 1, result: 'win' },
        { seat: 2, placement: 3, result: 'lose' },
      ],
    });
  });

  it('a 3 rondas, matchRoundsWon por debajo del umbral no termina la partida', () => {
    const state: TuteState = { ...setupState(4, '3'), matchRoundsWon: [2, 1] };
    expect(activePlayers(state)).toEqual([state.turn]);
    expect(checkEnd(state)).toBeNull();
  });
});

describe('playerView', () => {
  it('revela la mano propia y solo el recuento de las ajenas; triunfo y baza son públicos', () => {
    const state = setupState(4);
    const view0 = playerView(state, 0);
    const spectatorView = playerView(state, null);
    expect(view0.hand).toEqual(state.hands[0]);
    expect(spectatorView.hand).toBeNull();
    expect(view0.handCounts).toEqual([12, 12, 12, 12]);
    expect(view0.trumpSuit).toBe(spectatorView.trumpSuit);
    expect(view0.roundsToWin).toBe(1);
    expect(view0.matchRoundsWon).toEqual(spectatorView.matchRoundsWon);
    expect(view0.phase).toBe('playing');
  });
});

describe('onTurnTimeout', () => {
  it('auto-confirma en vez de forfeitar cuando alguien tarda en la pausa de fin de ronda', () => {
    const state: TuteState = { ...setupState(4), phase: 'roundEnd', pendingConfirm: [0, 1, 2, 3] };
    expect(tuteDefinition.onTurnTimeout!(state, 0)).toEqual({ type: 'move', move: { type: 'continue' } });
  });

  it('sigue forfeitando por timeout durante el juego normal', () => {
    const state = setupState(4);
    expect(tuteDefinition.onTurnTimeout!(state, 0)).toEqual({ type: 'forfeit' });
  });
});
