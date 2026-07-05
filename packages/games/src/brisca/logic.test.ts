import { createRng } from '@tableria/engine';
import { describe, expect, it } from 'vitest';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import type { BriscaCard, BriscaState } from './types.js';

function setupState(numPlayers = 2): BriscaState {
  return setup({ numPlayers, rng: createRng('brisca-test-seed') });
}

function ctx(seat: number) {
  return { seat, now: new Date() };
}

function card(suit: BriscaCard['suit'], rank: BriscaCard['rank']): BriscaCard {
  return { suit, rank };
}

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

  it('arranca con el asiento 0 abriendo la primera baza y 0 puntos para todos', () => {
    const state = setupState(3);
    expect(state.turn).toBe(0);
    expect(state.leadSeat).toBe(0);
    expect(state.points).toEqual([0, 0, 0]);
    expect(state.currentTrick).toEqual([null, null, null]);
  });

  it('soporta de 2 a 4 jugadores repartiendo siempre 3 cartas', () => {
    for (const n of [2, 3, 4]) {
      const state = setupState(n);
      expect(state.hands).toHaveLength(n);
      expect(state.deck).toHaveLength(40 - 3 * n);
    }
  });
});

describe('validateMove', () => {
  it('rechaza mover fuera de turno', () => {
    const state = setupState(2);
    expect(validateMove(state, { cardIndex: 0 }, ctx(1))).toEqual({ ok: false, code: 'NOT_YOUR_TURN' });
  });

  it('rechaza un índice de carta fuera de la mano', () => {
    const state = setupState(2);
    expect(validateMove(state, { cardIndex: 3 }, ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('acepta jugar cualquier carta de la mano (sin obligación de asistir al palo)', () => {
    const state = setupState(2);
    expect(validateMove(state, { cardIndex: 0 }, ctx(0))).toEqual({ ok: true });
    expect(validateMove(state, { cardIndex: 2 }, ctx(0))).toEqual({ ok: true });
  });
});

describe('resolución de baza', () => {
  it('con triunfo en juego, gana el triunfo más alto aunque el otro palo tenga más rango nominal', () => {
    const state: BriscaState = {
      numPlayers: 2,
      deck: [card('bastos', 4), card('copas', 5)],
      trumpSuit: 'oros',
      trumpCard: card('oros', 7),
      hands: [[card('copas', 12)], [card('oros', 2)]],
      currentTrick: [null, null],
      leadSeat: 0,
      turn: 0,
      points: [0, 0],
    };
    let next = applyMove(state, { cardIndex: 0 }, ctx(0)); // seat0 juega rey de copas
    expect(next.turn).toBe(1);
    next = applyMove(next, { cardIndex: 0 }, ctx(1)); // seat1 juega el 2 de triunfo (oros)
    // El 2 de triunfo (fuerza 1) gana a un rey no-triunfo (fuerza 8): cualquier triunfo bate a cualquier no-triunfo.
    expect(next.leadSeat).toBe(1);
    expect(next.turn).toBe(1);
    expect(next.points[1]).toBe(4); // puntos del rey de copas capturado
    expect(next.currentTrick).toEqual([null, null]);
  });

  it('sin triunfo en juego, gana la carta más alta del palo que abrió; un tercer palo nunca gana', () => {
    const state: BriscaState = {
      numPlayers: 2,
      deck: [card('bastos', 4), card('copas', 5)],
      trumpSuit: 'oros',
      trumpCard: card('oros', 7),
      hands: [[card('espadas', 7)], [card('bastos', 12)]],
      currentTrick: [null, null],
      leadSeat: 0,
      turn: 0,
      points: [0, 0],
    };
    let next = applyMove(state, { cardIndex: 0 }, ctx(0)); // seat0 abre con espadas (palo de la mano)
    next = applyMove(next, { cardIndex: 0 }, ctx(1)); // seat1 juega rey de bastos (ni triunfo ni palo de la mano)
    // El rey de bastos (fuerza 8) no puede ganar: no es ni triunfo ni el palo que abrió la mano.
    expect(next.leadSeat).toBe(0);
    expect(next.points[0]).toBe(4); // puntos del rey de bastos capturado por quien abrió
  });

  it('tras resolver la baza, el ganador roba primero y todos vuelven a tener 3 cartas si queda mazo', () => {
    const state: BriscaState = {
      numPlayers: 2,
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
    let next = applyMove(state, { cardIndex: 0 }, ctx(0)); // seat0 juega as de espadas
    next = applyMove(next, { cardIndex: 0 }, ctx(1)); // seat1 juega as de bastos (no gana: ni triunfo ni espadas)
    expect(next.leadSeat).toBe(0);
    expect(next.hands[0]).toHaveLength(2); // conservaba 1 + roba 1
    expect(next.hands[1]).toHaveLength(2);
    expect(next.hands[0]![1]).toEqual(card('copas', 5)); // ganador roba primero: la carta del final del mazo
    expect(next.deck).toHaveLength(0); // el mazo tenía exactamente 2 cartas para 2 jugadores: se agota del todo
  });
});

describe('activePlayers', () => {
  it('devuelve el asiento en turno mientras queden cartas', () => {
    expect(activePlayers(setupState(2))).toEqual([0]);
  });

  it('devuelve [] cuando el mazo y todas las manos están vacíos', () => {
    const state: BriscaState = {
      numPlayers: 2,
      deck: [],
      trumpSuit: 'oros',
      trumpCard: card('oros', 7),
      hands: [[], []],
      currentTrick: [null, null],
      leadSeat: 0,
      turn: 0,
      points: [65, 55],
    };
    expect(activePlayers(state)).toEqual([]);
    expect(validateMove(state, { cardIndex: 0 }, ctx(0))).toEqual({ ok: false, code: 'GAME_OVER' });
  });
});

describe('checkEnd', () => {
  it('null mientras queden cartas en mazo o en manos', () => {
    expect(checkEnd(setupState(2))).toBeNull();
  });

  it('da ranking por puntos cuando el mazo y las manos se vacían, con el ganador en placement 1', () => {
    const state: BriscaState = {
      numPlayers: 2,
      deck: [],
      trumpSuit: 'oros',
      trumpCard: card('oros', 7),
      hands: [[], []],
      currentTrick: [null, null],
      leadSeat: 0,
      turn: 0,
      points: [70, 50],
    };
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'win' },
        { seat: 1, placement: 2, result: 'lose' },
      ],
    });
  });

  it('empate a puntos da result "draw" a ambos con el mismo placement', () => {
    const state: BriscaState = {
      numPlayers: 2,
      deck: [],
      trumpSuit: 'oros',
      trumpCard: card('oros', 7),
      hands: [[], []],
      currentTrick: [null, null],
      leadSeat: 0,
      turn: 0,
      points: [60, 60],
    };
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'draw' },
        { seat: 1, placement: 1, result: 'draw' },
      ],
    });
  });

  it('con 4 jugadores reparte placements 1..4 según puntos, sin empates', () => {
    const state: BriscaState = {
      numPlayers: 4,
      deck: [],
      trumpSuit: 'oros',
      trumpCard: card('oros', 7),
      hands: [[], [], [], []],
      currentTrick: [null, null, null, null],
      leadSeat: 0,
      turn: 0,
      points: [40, 10, 50, 20],
    };
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

  it('triunfo, baza en curso, puntos y recuento de mazo son visibles para todos por igual', () => {
    const state = setupState(2);
    const view0 = playerView(state, 0);
    const spectatorView = playerView(state, null);
    expect(view0.trumpSuit).toBe(spectatorView.trumpSuit);
    expect(view0.trumpCard).toEqual(spectatorView.trumpCard);
    expect(view0.currentTrick).toEqual(spectatorView.currentTrick);
    expect(view0.points).toEqual(spectatorView.points);
    expect(view0.deckCount).toBe(spectatorView.deckCount);
  });
});

describe('partida completa', () => {
  it('jugando siempre la primera carta de la mano, la partida termina y los puntos suman 120', () => {
    let state = setupState(2);
    let guard = 0;
    while (checkEnd(state) === null) {
      guard++;
      if (guard > 200) throw new Error('la partida no terminó — posible bucle infinito');
      const seat = state.turn;
      const validation = validateMove(state, { cardIndex: 0 }, ctx(seat));
      expect(validation.ok).toBe(true);
      state = applyMove(state, { cardIndex: 0 }, ctx(seat));
    }
    const end = checkEnd(state)!;
    const totalPoints = state.points.reduce((a, b) => a + b, 0);
    expect(totalPoints).toBe(120);
    expect(end.ranking).toHaveLength(2);
    expect(state.deck).toHaveLength(0);
    expect(state.hands.every((h) => h.length === 0)).toBe(true);
  });
});
