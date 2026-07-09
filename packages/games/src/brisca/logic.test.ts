import { createRng } from '@tableria/engine';
import { describe, expect, it } from 'vitest';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import type { BriscaCard, BriscaState } from './types.js';

function setupState(numPlayers = 2, variant?: string): BriscaState {
  return setup({ numPlayers, rng: createRng('brisca-test-seed'), options: variant ? { variant } : undefined });
}

function ctx(seat: number) {
  return { seat, now: new Date() };
}

function card(suit: BriscaCard['suit'], rank: BriscaCard['rank']): BriscaCard {
  return { suit, rank };
}

function play(cardIndex: number) {
  return { type: 'play' as const, cardIndex };
}

const CONTINUE = { type: 'continue' as const };

describe('setup', () => {
  it('reparte 3 cartas a cada jugador y dispone el resto del mazo (menos las repartidas)', () => {
    const state = setupState(2);
    expect(state.hands).toHaveLength(2);
    for (const hand of state.hands) expect(hand).toHaveLength(3);
    expect(state.deck).toHaveLength(40 - 3 * 2);
  });

  it('la carta de triunfo destapada coincide con el palo de triunfo y vuelve al fondo del mazo', () => {
    const state = setupState(2);
    expect(state.trumpCard.suit).toBe(state.trumpSuit);
    expect(state.deck[0]).toEqual(state.trumpCard);
  });

  it('arranca con el asiento 0 abriendo la primera baza, ronda 1 y 0 puntos para todos', () => {
    const state = setupState(3);
    expect(state.turn).toBe(0);
    expect(state.leadSeat).toBe(0);
    expect(state.points).toEqual([0, 0, 0]);
    expect(state.matchPoints).toEqual([0, 0, 0]);
    expect(state.roundNumber).toBe(1);
    expect(state.currentTrick).toEqual([null, null, null]);
    expect(state.phase).toBe('playing');
    expect(state.pendingConfirm).toEqual([]);
    expect(state.lastRoundSummary).toBeNull();
  });

  it('soporta de 2 a 4 jugadores repartiendo siempre 3 cartas', () => {
    for (const n of [2, 3, 4]) {
      const state = setupState(n);
      expect(state.hands).toHaveLength(n);
      expect(state.deck).toHaveLength(40 - 3 * n);
    }
  });

  it('usa 1 ronda por defecto si no se elige variante', () => {
    expect(setupState(2).roundsToWin).toBe(1);
  });

  it('respeta el número de rondas elegido en el lobby (1, 3 o 5)', () => {
    expect(setupState(2, '3').roundsToWin).toBe(3);
    expect(setupState(2, '5').roundsToWin).toBe(5);
  });

  it('ignora una variante inválida y usa el valor por defecto', () => {
    expect(setupState(2, 'nope').roundsToWin).toBe(1);
  });
});

describe('validateMove', () => {
  it('rechaza mover fuera de turno', () => {
    const state = setupState(2);
    expect(validateMove(state, play(0), ctx(1))).toEqual({ ok: false, code: 'NOT_YOUR_TURN' });
  });

  it('rechaza un índice de carta fuera de la mano', () => {
    const state = setupState(2);
    expect(validateMove(state, play(3), ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('acepta jugar cualquier carta de la mano (sin obligación de asistir al palo)', () => {
    const state = setupState(2);
    expect(validateMove(state, play(0), ctx(0))).toEqual({ ok: true });
    expect(validateMove(state, play(2), ctx(0))).toEqual({ ok: true });
  });

  it('rechaza jugar una carta mientras se espera confirmación de fin de ronda', () => {
    const state: BriscaState = { ...setupState(2), phase: 'roundEnd', pendingConfirm: [0, 1] };
    expect(validateMove(state, play(0), ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('rechaza continuar fuera de la pausa de fin de ronda', () => {
    const state = setupState(2);
    expect(validateMove(state, CONTINUE, ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('rechaza continuar de un asiento que ya no está pendiente', () => {
    const state: BriscaState = { ...setupState(2), phase: 'roundEnd', pendingConfirm: [1] };
    expect(validateMove(state, CONTINUE, ctx(0))).toEqual({ ok: false, code: 'NOT_YOUR_TURN' });
  });
});

describe('resolución de baza', () => {
  it('con triunfo en juego, gana el triunfo más alto aunque el otro palo tenga más rango nominal', () => {
    const state: BriscaState = {
      ...setupState(2),
      deck: [card('bastos', 4), card('copas', 5)],
      trumpSuit: 'oros',
      trumpCard: card('oros', 7),
      hands: [[card('copas', 12)], [card('oros', 2)]],
      currentTrick: [null, null],
      leadSeat: 0,
      turn: 0,
      points: [0, 0],
    };
    let next = applyMove(state, play(0), ctx(0)); // seat0 juega rey de copas
    expect(next.turn).toBe(1);
    next = applyMove(next, play(0), ctx(1)); // seat1 juega el 2 de triunfo (oros)
    // El 2 de triunfo (fuerza 1) gana a un rey no-triunfo (fuerza 8): cualquier triunfo bate a cualquier no-triunfo.
    expect(next.leadSeat).toBe(1);
    expect(next.turn).toBe(1);
    expect(next.points[1]).toBe(4); // puntos del rey de copas capturado
    expect(next.currentTrick).toEqual([null, null]);
  });

  it('sin triunfo en juego, gana la carta más alta del palo que abrió; un tercer palo nunca gana', () => {
    const state: BriscaState = {
      ...setupState(2),
      deck: [card('bastos', 4), card('copas', 5)],
      trumpSuit: 'oros',
      trumpCard: card('oros', 7),
      hands: [[card('espadas', 7)], [card('bastos', 12)]],
      currentTrick: [null, null],
      leadSeat: 0,
      turn: 0,
      points: [0, 0],
    };
    let next = applyMove(state, play(0), ctx(0)); // seat0 abre con espadas (palo de la mano)
    next = applyMove(next, play(0), ctx(1)); // seat1 juega rey de bastos (ni triunfo ni palo de la mano)
    // El rey de bastos (fuerza 8) no puede ganar: no es ni triunfo ni el palo que abrió la mano.
    expect(next.leadSeat).toBe(0);
    expect(next.points[0]).toBe(4); // puntos del rey de bastos capturado por quien abrió
  });

  it('tras resolver la baza, el ganador roba primero y todos vuelven a tener 3 cartas si queda mazo', () => {
    const state: BriscaState = {
      ...setupState(2),
      deck: [card('bastos', 4), card('copas', 5)], // copas5 es la próxima a robar (final del array)
      trumpSuit: 'oros',
      trumpCard: card('oros', 7),
      hands: [
        [card('espadas', 1), card('espadas', 2)],
        [card('bastos', 1), card('bastos', 2)],
      ],
      currentTrick: [null, null],
      leadSeat: 0,
      turn: 0,
      points: [0, 0],
    };
    let next = applyMove(state, play(0), ctx(0)); // seat0 juega as de espadas
    next = applyMove(next, play(0), ctx(1)); // seat1 juega as de bastos (no gana: ni triunfo ni espadas)
    expect(next.leadSeat).toBe(0);
    expect(next.hands[0]).toHaveLength(2); // conservaba 1 + roba 1
    expect(next.hands[1]).toHaveLength(2);
    expect(next.hands[0]![1]).toEqual(card('copas', 5)); // ganador roba primero: la carta del final del mazo
    expect(next.deck).toHaveLength(0); // el mazo tenía exactamente 2 cartas para 2 jugadores: se agota del todo
  });
});

describe('fin de ronda y pausa de confirmación', () => {
  it('si la ronda no decide la partida, se congela en roundEnd hasta que todos confirmen', () => {
    const state: BriscaState = {
      ...setupState(2, '3'), // a 3 rondas: la primera ronda ganada nunca decide la partida sola
      deck: [],
      hands: [[card('bastos', 4)], [card('copas', 5)]],
      currentTrick: [null, null],
      leadSeat: 0,
      turn: 0,
      points: [60, 0], // seat0 ya iba ganando la ronda claramente antes de esta última baza
    };
    let next = applyMove(state, play(0), ctx(0)); // bastos 4 (0 puntos)
    next = applyMove(next, play(0), ctx(1)); // copas 5 (0 puntos) — no cambia el ganador de la baza

    expect(next.matchPoints[0]).toBe(1); // seat0 se lleva la ronda
    expect(next.matchPoints[1]).toBe(0);
    expect(next.phase).toBe('roundEnd');
    expect(next.pendingConfirm).toEqual([0, 1]);
    expect(activePlayers(next)).toEqual([0, 1]);
    expect(next.lastRoundSummary!.winnerSeats).toEqual([0]);
    expect(checkEnd(next)).toBeNull();

    next = applyMove(next, CONTINUE, ctx(0));
    expect(next.phase).toBe('roundEnd'); // falta el asiento 1
    expect(next.pendingConfirm).toEqual([1]);

    next = applyMove(next, CONTINUE, ctx(1));
    // Ya confirmaron los dos: nueva ronda repartida, puntos de ronda a cero, ronda 2.
    expect(next.phase).toBe('playing');
    expect(next.pendingConfirm).toEqual([]);
    expect(next.roundNumber).toBe(2);
    expect(next.points).toEqual([0, 0]);
    expect(next.hands.every((h) => h.length === 3)).toBe(true);
    expect(next.matchPoints).toEqual([1, 0]); // las rondas ganadas se conservan entre rondas
  });

  it('un empate en el máximo de puntos de la ronda no otorga ronda ganada a nadie', () => {
    const state: BriscaState = {
      ...setupState(2, '3'),
      deck: [],
      hands: [[card('bastos', 4)], [card('copas', 5)]], // ninguna vale puntos de baza
      currentTrick: [null, null],
      leadSeat: 0,
      turn: 0,
      points: [60, 60],
    };
    let next = applyMove(state, play(0), ctx(0));
    next = applyMove(next, play(0), ctx(1));

    expect(next.matchPoints).toEqual([0, 0]);
    expect(next.lastRoundSummary!.winnerSeats).toEqual([]);
    expect(next.phase).toBe('roundEnd'); // se sigue jugando otra ronda para desempatar
  });

  it('la ronda que decide la partida no pasa por la pausa: el estado queda listo para checkEnd', () => {
    const state: BriscaState = {
      ...setupState(2), // por defecto, a 1 ronda: la primera ronda ganada decide la partida
      deck: [],
      trumpSuit: 'espadas', // ninguna de las dos cartas es triunfo: gana quien abre (mismo palo)
      trumpCard: card('espadas', 7),
      hands: [[card('oros', 1)], [card('copas', 5)]], // seat0 abre con el as de oros y se lleva la baza
      currentTrick: [null, null],
      leadSeat: 0,
      turn: 0,
      points: [0, 0],
    };
    let next = applyMove(state, play(0), ctx(0));
    next = applyMove(next, play(0), ctx(1));

    expect(next.matchPoints[0]).toBe(1);
    expect(activePlayers(next)).toEqual([]);
    const end = checkEnd(next)!;
    expect(end.ranking[0]).toEqual({ seat: 0, placement: 1, result: 'win' });
  });
});

describe('activePlayers / checkEnd', () => {
  it('devuelve el asiento en turno mientras la partida no está decidida', () => {
    expect(activePlayers(setupState(2))).toEqual([0]);
    expect(checkEnd(setupState(2))).toBeNull();
  });

  it('activePlayers y checkEnd dependen de matchPoints contra roundsToWin', () => {
    const decided: BriscaState = { ...setupState(2), matchPoints: [1, 0] }; // roundsToWin por defecto: 1
    expect(activePlayers(decided)).toEqual([]);
    expect(validateMove(decided, play(0), ctx(0))).toEqual({ ok: false, code: 'GAME_OVER' });
    expect(checkEnd(decided)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'win' },
        { seat: 1, placement: 2, result: 'lose' },
      ],
    });

    const notDecided: BriscaState = { ...setupState(2, '3'), matchPoints: [1, 0] }; // hace falta 3
    expect(activePlayers(notDecided)).toEqual([notDecided.turn]);
    expect(checkEnd(notDecided)).toBeNull();
  });

  it('empate en rondas ganadas da result "draw" a ambos con el mismo placement', () => {
    const state: BriscaState = { ...setupState(2), matchPoints: [1, 1] };
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'draw' },
        { seat: 1, placement: 1, result: 'draw' },
      ],
    });
  });

  it('con 4 jugadores reparte placements 1..4 según rondas ganadas, sin empates', () => {
    const state: BriscaState = { ...setupState(4), matchPoints: [3, 1, 4, 2] };
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 2, result: 'lose' },
        { seat: 1, placement: 4, result: 'lose' },
        { seat: 2, placement: 1, result: 'win' },
        { seat: 3, placement: 3, result: 'lose' },
      ],
    });
  });
});

describe('playerView', () => {
  it('revela la mano propia con detalle y las ajenas solo como recuento', () => {
    const state = setupState(2);
    const view0 = playerView(state, 0);
    const view1 = playerView(state, 1);

    expect(view0.hand).toEqual(state.hands[0]);
    expect(view1.hand).toEqual(state.hands[1]);
    // Cada uno ve el recuento de TODAS las manos (incluida la ajena), nunca su contenido.
    expect(view0.handCounts).toEqual([3, 3]);
  });

  it('el espectador no ve el contenido de ninguna mano', () => {
    const state = setupState(2);
    const spectatorView = playerView(state, null);
    expect(spectatorView.hand).toBeNull();
    expect(spectatorView.handCounts).toEqual([3, 3]);
  });

  it('triunfo, baza en curso, puntos, rondas y recuento de mazo son visibles para todos por igual', () => {
    const state = setupState(2, '3');
    const view0 = playerView(state, 0);
    const spectatorView = playerView(state, null);
    expect(view0.trumpSuit).toBe(spectatorView.trumpSuit);
    expect(view0.trumpCard).toEqual(spectatorView.trumpCard);
    expect(view0.currentTrick).toEqual(spectatorView.currentTrick);
    expect(view0.points).toEqual(spectatorView.points);
    expect(view0.deckCount).toBe(spectatorView.deckCount);
    expect(view0.roundsToWin).toBe(3);
    expect(view0.matchPoints).toEqual(spectatorView.matchPoints);
    expect(view0.phase).toBe('playing');
  });
});

describe('partida completa', () => {
  it('jugando siempre la primera carta de la mano, la partida termina y la última ronda suma 120', () => {
    let state = setupState(2);
    let guard = 0;
    while (checkEnd(state) === null) {
      guard++;
      if (guard > 500) throw new Error('la partida no terminó — posible bucle infinito');

      if (state.phase === 'roundEnd') {
        for (const seat of state.pendingConfirm) state = applyMove(state, CONTINUE, ctx(seat));
        continue;
      }

      const seat = state.turn;
      const validation = validateMove(state, play(0), ctx(seat));
      expect(validation.ok).toBe(true);
      state = applyMove(state, play(0), ctx(seat));
    }
    const end = checkEnd(state)!;
    // `points` es de la ronda que decidió la partida (se resetea cada ronda) — siempre suma 120,
    // sea cual sea el número de rondas jugadas hasta el desempate.
    const totalPoints = state.points.reduce((a, b) => a + b, 0);
    expect(totalPoints).toBe(120);
    expect(end.ranking).toHaveLength(2);
    expect(state.deck).toHaveLength(0);
    expect(state.hands.every((h) => h.length === 0)).toBe(true);
  });

  it('a 3 rondas, la partida no termina hasta que alguien acumule 3 rondas ganadas', () => {
    let state = setupState(2, '3');
    let guard = 0;
    while (checkEnd(state) === null) {
      guard++;
      if (guard > 2000) throw new Error('la partida no terminó — posible bucle infinito');

      if (state.phase === 'roundEnd') {
        expect(Math.max(...state.matchPoints)).toBeLessThan(3);
        for (const seat of state.pendingConfirm) state = applyMove(state, CONTINUE, ctx(seat));
        continue;
      }

      const seat = state.turn;
      state = applyMove(state, play(0), ctx(seat));
    }
    expect(Math.max(...state.matchPoints)).toBeGreaterThanOrEqual(3);
  });
});
