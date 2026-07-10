import { createRng } from '@tableria/engine';
import { describe, expect, it } from 'vitest';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import type { PistaUnicaState } from './types.js';
import { WORD_LIST } from './words.js';

function setupState(numPlayers: number): PistaUnicaState {
  return setup({ numPlayers, rng: createRng('test-seed') });
}

function ctx(seat: number) {
  return { seat, now: new Date() };
}

describe('WORD_LIST', () => {
  it('no tiene palabras repetidas y da para una mesa de 8', () => {
    expect(new Set(WORD_LIST).size).toBe(WORD_LIST.length);
    expect(WORD_LIST.length).toBeGreaterThanOrEqual(8);
  });
});

describe('setup', () => {
  it('arranca en la ronda 0, adivinador el asiento 0, fase de pistas', () => {
    const state = setupState(4);
    expect(state.round).toBe(0);
    expect(state.guesser).toBe(0);
    expect(state.phase).toBe('clue');
    expect(state.score).toBe(0);
    expect(state.history).toEqual([]);
    expect(state.words).toHaveLength(4);
    expect(new Set(state.words).size).toBe(4); // sin repetir palabra entre rondas
    expect(state.secretWord).toBe(state.words[0]);
  });
});

describe('activePlayers', () => {
  it('en fase de pistas, todos menos el adivinador y quien ya mandó la suya', () => {
    const state = setupState(4);
    expect(activePlayers(state).sort()).toEqual([1, 2, 3]);
    const afterOne = applyMove(state, { type: 'clue', word: 'hoja' }, ctx(1));
    expect(activePlayers(afterOne).sort()).toEqual([2, 3]);
  });

  it('en fase de adivinanza, solo el adivinador', () => {
    let state = setupState(3);
    state = applyMove(state, { type: 'clue', word: 'agua' }, ctx(1));
    state = applyMove(state, { type: 'clue', word: 'fuego' }, ctx(2));
    expect(state.phase).toBe('guess');
    expect(activePlayers(state)).toEqual([0]);
  });
});

describe('validateMove', () => {
  it('rechaza mover fuera de turno', () => {
    const state = setupState(3);
    expect(validateMove(state, { type: 'clue', word: 'agua' }, ctx(0))).toEqual({ ok: false, code: 'NOT_YOUR_TURN' });
  });

  it('rechaza adivinar durante la fase de pistas', () => {
    const state = setupState(3);
    expect(validateMove(state, { type: 'guess', word: 'agua' }, ctx(1))).toEqual({ ok: false, code: 'WRONG_PHASE' });
  });

  it('rechaza dar pista durante la fase de adivinanza', () => {
    let state = setupState(3);
    state = applyMove(state, { type: 'clue', word: 'agua' }, ctx(1));
    state = applyMove(state, { type: 'clue', word: 'fuego' }, ctx(2));
    expect(validateMove(state, { type: 'clue', word: 'tierra' }, ctx(0))).toEqual({ ok: false, code: 'WRONG_PHASE' });
  });

  it('rechaza una pista igual (normalizada) a la palabra secreta', () => {
    const state = setupState(3);
    expect(validateMove(state, { type: 'clue', word: state.secretWord.toUpperCase() }, ctx(1))).toEqual({
      ok: false,
      code: 'CLUE_MATCHES_SECRET',
    });
  });

  it('rechaza una pista en blanco', () => {
    const state = setupState(3);
    expect(validateMove(state, { type: 'clue', word: '   ' }, ctx(1))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('rechaza cualquier movimiento si la partida ya acabó', () => {
    let state = setupState(3);
    for (let round = 0; round < 3; round++) {
      const guesser = state.guesser;
      const others = [0, 1, 2].filter((s) => s !== guesser);
      state = applyMove(state, { type: 'clue', word: `pista${round}a` }, ctx(others[0]!));
      state = applyMove(state, { type: 'clue', word: `pista${round}b` }, ctx(others[1]!));
      state = applyMove(state, { type: 'guess', word: 'lo que sea' }, ctx(guesser));
    }
    expect(validateMove(state, { type: 'guess', word: 'lo que sea' }, ctx(0))).toEqual({ ok: false, code: 'GAME_OVER' });
  });
});

describe('applyMove — fase de pistas', () => {
  it('espera a que todos los no-adivinadores manden pista antes de pasar de fase', () => {
    const state = setupState(3);
    const afterOne = applyMove(state, { type: 'clue', word: 'agua' }, ctx(1));
    expect(afterOne.phase).toBe('clue');
    expect(afterOne.clues[1]).toBe('agua');
  });

  it('invalida pistas duplicadas (comparación insensible a mayúsculas y acentos) al resolver la ronda', () => {
    let state = setupState(4);
    // asientos 1,2,3 dan pista; guesser=0. 1 y 2 coinciden (con distinto caso/acento), 3 es única.
    state = applyMove(state, { type: 'clue', word: 'Camaleón' }, ctx(1));
    state = applyMove(state, { type: 'clue', word: 'camaleon' }, ctx(2));
    state = applyMove(state, { type: 'clue', word: 'reptil' }, ctx(3));

    expect(state.phase).toBe('guess');
    expect(state.clueValid[0]).toBeNull();
    expect(state.clueValid[1]).toBe(false);
    expect(state.clueValid[2]).toBe(false);
    expect(state.clueValid[3]).toBe(true);
  });
});

describe('applyMove — fase de adivinanza y transición de ronda', () => {
  it('acierto suma punto; fallo no', () => {
    let state = setupState(3);
    state = applyMove(state, { type: 'clue', word: 'agua' }, ctx(1));
    state = applyMove(state, { type: 'clue', word: 'fuego' }, ctx(2));
    const correctGuess = applyMove(state, { type: 'guess', word: state.secretWord }, ctx(0));
    expect(correctGuess.score).toBe(1);
    expect(correctGuess.history).toHaveLength(1);
    expect(correctGuess.history[0]!.correct).toBe(true);

    const wrongGuess = applyMove(state, { type: 'guess', word: 'esto-no-es-la-palabra' }, ctx(0));
    expect(wrongGuess.score).toBe(0);
    expect(wrongGuess.history[0]!.correct).toBe(false);
  });

  it('rota el adivinador a la siguiente ronda y resetea pistas', () => {
    let state = setupState(3);
    state = applyMove(state, { type: 'clue', word: 'agua' }, ctx(1));
    state = applyMove(state, { type: 'clue', word: 'fuego' }, ctx(2));
    state = applyMove(state, { type: 'guess', word: state.secretWord }, ctx(0));

    expect(state.round).toBe(1);
    expect(state.guesser).toBe(1);
    expect(state.phase).toBe('clue');
    expect(state.clues).toEqual([null, null, null]);
    expect(state.clueValid).toEqual([null, null, null]);
    expect(state.secretWord).toBe(state.words[1]);
  });
});

describe('checkEnd', () => {
  it('sigue en juego mientras no todos los jugadores hayan adivinado', () => {
    const state = setupState(3);
    expect(checkEnd(state)).toBeNull();
  });

  it('el equipo gana si acierta al menos la mitad de las rondas', () => {
    let state = setupState(3);
    for (let round = 0; round < 3; round++) {
      const guesser = state.guesser;
      const others = [0, 1, 2].filter((s) => s !== guesser);
      const word = state.secretWord;
      state = applyMove(state, { type: 'clue', word: `pista${round}a` }, ctx(others[0]!));
      state = applyMove(state, { type: 'clue', word: `pista${round}b` }, ctx(others[1]!));
      // Acierta las 2 primeras rondas, falla la última — 2/3 sigue siendo mayoría.
      state = applyMove(state, { type: 'guess', word: round < 2 ? word : 'fallo total' }, ctx(guesser));
    }
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'win' },
        { seat: 1, placement: 1, result: 'win' },
        { seat: 2, placement: 1, result: 'win' },
      ],
    });
    expect(activePlayers(state)).toEqual([]);
  });

  it('el equipo pierde si acierta menos de la mitad', () => {
    let state = setupState(3);
    for (let round = 0; round < 3; round++) {
      const guesser = state.guesser;
      const others = [0, 1, 2].filter((s) => s !== guesser);
      state = applyMove(state, { type: 'clue', word: `pista${round}a` }, ctx(others[0]!));
      state = applyMove(state, { type: 'clue', word: `pista${round}b` }, ctx(others[1]!));
      state = applyMove(state, { type: 'guess', word: 'siempre fallo' }, ctx(guesser));
    }
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'lose' },
        { seat: 1, placement: 1, result: 'lose' },
        { seat: 2, placement: 1, result: 'lose' },
      ],
    });
  });
});

describe('playerView', () => {
  it('el adivinador no ve la palabra secreta; el resto sí', () => {
    const state = setupState(3);
    expect(playerView(state, 0).secretWord).toBeNull();
    expect(playerView(state, 1).secretWord).toBe(state.secretWord);
    expect(playerView(state, 2).secretWord).toBe(state.secretWord);
  });

  it('los espectadores tampoco ven la palabra secreta mientras la partida está en curso', () => {
    const state = setupState(3);
    expect(playerView(state, null).secretWord).toBeNull();
  });

  it('durante la fase de pistas, cada jugador solo ve su propia pista, nunca las ajenas', () => {
    let state = setupState(3);
    state = applyMove(state, { type: 'clue', word: 'agua' }, ctx(1));
    const viewOfGiver = playerView(state, 1);
    const viewOfOther = playerView(state, 2);
    expect(viewOfGiver.clues[1]).toBe('agua');
    expect(viewOfOther.clues[1]).toBeNull(); // no ve la pista de otro no-adivinador todavía
    expect(viewOfGiver.submitted).toEqual([false, true, false]);
  });

  it('al pasar a la fase de adivinanza, todas las pistas y su validez son visibles para todos', () => {
    let state = setupState(3);
    state = applyMove(state, { type: 'clue', word: 'agua' }, ctx(1));
    state = applyMove(state, { type: 'clue', word: 'fuego' }, ctx(2));
    const guesserView = playerView(state, 0);
    const spectatorView = playerView(state, null);
    expect(guesserView.clues).toEqual([null, 'agua', 'fuego']);
    expect(spectatorView.clues).toEqual([null, 'agua', 'fuego']);
    expect(guesserView.clueValid).toEqual([null, true, true]);
  });

  it('una pista repetida se oculta al adivinador y a los espectadores, pero no a quienes la escribieron', () => {
    let state = setupState(4);
    // asientos 1,2,3 dan pista; guesser=0. 1 y 2 coinciden (con distinto caso/acento), 3 es única.
    state = applyMove(state, { type: 'clue', word: 'Camaleón' }, ctx(1));
    state = applyMove(state, { type: 'clue', word: 'camaleon' }, ctx(2));
    state = applyMove(state, { type: 'clue', word: 'reptil' }, ctx(3));

    // El adivinador no debe poder leer qué palabra se repitió — es justo lo que la anulación
    // pretende evitarle — pero sí sabe que hubo dos pistas anuladas (clueValid en false).
    const guesserView = playerView(state, 0);
    expect(guesserView.clues).toEqual([null, null, null, 'reptil']);
    expect(guesserView.clueValid).toEqual([null, false, false, true]);

    // Un espectador podría estar compartiendo pantalla con el adivinador — se le oculta igual.
    expect(playerView(state, null).clues).toEqual([null, null, null, 'reptil']);

    // Quienes escribieron las pistas sí ven el texto real, tachado — necesitan saber por qué
    // se anuló la suya.
    expect(playerView(state, 1).clues).toEqual([null, 'Camaleón', 'camaleon', 'reptil']);
    expect(playerView(state, 3).clues).toEqual([null, 'Camaleón', 'camaleon', 'reptil']);
  });

  it('revela la palabra secreta a todos, incluido el propio adivinador, una vez la partida ha terminado', () => {
    let state = setupState(3);
    for (let round = 0; round < 3; round++) {
      const guesser = state.guesser;
      const others = [0, 1, 2].filter((s) => s !== guesser);
      state = applyMove(state, { type: 'clue', word: `pista${round}a` }, ctx(others[0]!));
      state = applyMove(state, { type: 'clue', word: `pista${round}b` }, ctx(others[1]!));
      state = applyMove(state, { type: 'guess', word: 'fallo' }, ctx(guesser));
    }
    const lastGuesser = state.guesser;
    expect(playerView(state, lastGuesser).secretWord).toBe(state.secretWord);
    expect(playerView(state, null).secretWord).toBe(state.secretWord);
  });
});
