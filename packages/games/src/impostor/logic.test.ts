import { createRng } from '@tableria/engine';
import { describe, expect, it } from 'vitest';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import type { ImpostorState } from './types.js';

function setupState(numPlayers: number, variant?: string): ImpostorState {
  return setup({ numPlayers, rng: createRng('impostor-test-seed'), options: variant ? { variant } : undefined });
}

function ctx(seat: number) {
  return { seat, now: new Date() };
}

describe('setup', () => {
  it('sortea impostor y palabra por ronda, sin repetir palabra en la partida', () => {
    const state = setupState(4, '9');
    expect(state.totalRounds).toBe(9);
    expect(state.round).toBe(0);
    expect(state.phase).toBe('voting');
    expect(state.impostors).toHaveLength(9);
    expect(state.words).toHaveLength(9);
    expect(new Set(state.words).size).toBe(9);
    expect(state.impostors.every((s) => s >= 0 && s < 4)).toBe(true);
    expect(state.impostor).toBe(state.impostors[0]);
    expect(state.secretWord).toBe(state.words[0]);
    expect(state.scores).toEqual([0, 0, 0, 0]);
  });

  it('usa 5 rondas por defecto si no se pide una variante válida', () => {
    expect(setupState(4).totalRounds).toBe(5);
    expect(setupState(4, '7').totalRounds).toBe(5);
  });
});

describe('activePlayers / validateMove', () => {
  it('en fase de voto, todos los que no han votado aún', () => {
    const state = setupState(4);
    expect(activePlayers(state).sort()).toEqual([0, 1, 2, 3]);
    const afterOne = applyMove(state, { type: 'vote', target: 1 }, ctx(0));
    expect(activePlayers(afterOne).sort()).toEqual([1, 2, 3]);
  });

  it('rechaza votarse a uno mismo', () => {
    const state = setupState(4);
    expect(validateMove(state, { type: 'vote', target: 0 }, ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('rechaza un objetivo fuera de rango', () => {
    const state = setupState(3);
    expect(validateMove(state, { type: 'vote', target: 5 }, ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('rechaza continuar fuera de la pausa entre rondas', () => {
    const state = setupState(3);
    expect(validateMove(state, { type: 'continue' }, ctx(0))).toEqual({ ok: false, code: 'WRONG_PHASE' });
  });
});

describe('applyMove — votación', () => {
  it('resuelve la ronda en cuanto todos han votado, sin esperar a nadie más', () => {
    let state = setupState(3);
    const impostor = state.impostor;
    const others = [0, 1, 2].filter((s) => s !== impostor);
    state = applyMove(state, { type: 'vote', target: impostor }, ctx(others[0]!));
    expect(state.phase).toBe('voting'); // aún falta gente por votar
    state = applyMove(state, { type: 'vote', target: impostor }, ctx(others[1]!));
    state = applyMove(state, { type: 'vote', target: others[0]! }, ctx(impostor));
    expect(state.phase).toBe('roundEnd');
    expect(state.lastRoundSummary).not.toBeNull();
  });

  it('empate: se resetean todos los votos y se repite la votación entera', () => {
    let state = setupState(4);
    // 4 jugadores, votos 1-1-1-1 (cada uno a un asiento distinto): empate a 1.
    state = applyMove(state, { type: 'vote', target: 1 }, ctx(0));
    state = applyMove(state, { type: 'vote', target: 2 }, ctx(1));
    state = applyMove(state, { type: 'vote', target: 3 }, ctx(2));
    state = applyMove(state, { type: 'vote', target: 0 }, ctx(3));
    expect(state.phase).toBe('voting');
    expect(state.votes).toEqual([null, null, null, null]);
    expect(state.revoteCount).toBe(1);
  });

  it('si aciertan al impostor, cada NO impostor suma 1 punto y el impostor no suma nada', () => {
    let state = setupState(3);
    const impostor = state.impostor;
    const others = [0, 1, 2].filter((s) => s !== impostor);
    state = applyMove(state, { type: 'vote', target: impostor }, ctx(others[0]!));
    state = applyMove(state, { type: 'vote', target: impostor }, ctx(others[1]!));
    state = applyMove(state, { type: 'vote', target: others[0]! }, ctx(impostor));

    expect(state.lastRoundSummary).toEqual({
      impostor,
      secretWord: state.words[0],
      votes: state.lastRoundSummary!.votes,
      accused: impostor,
      caught: true,
      pointsAwarded: state.scores,
    });
    expect(state.scores[impostor]).toBe(0);
    for (const seat of others) expect(state.scores[seat]).toBe(1);
  });

  it('si no aciertan, el impostor suma 2 puntos y nadie más suma', () => {
    let state = setupState(3);
    const impostor = state.impostor;
    const others = [0, 1, 2].filter((s) => s !== impostor);
    // Los dos no-impostores se acusan mutuamente por error; el impostor remata votando al mismo
    // inocente que su compañero acusado — así el impostor nunca es el más votado (2 votos a 1).
    state = applyMove(state, { type: 'vote', target: others[1]! }, ctx(others[0]!));
    state = applyMove(state, { type: 'vote', target: others[0]! }, ctx(others[1]!));
    state = applyMove(state, { type: 'vote', target: others[0]! }, ctx(impostor));

    expect(state.lastRoundSummary!.caught).toBe(false);
    expect(state.lastRoundSummary!.accused).toBe(others[0]);
    expect(state.scores[impostor]).toBe(2);
    expect(state.scores[others[0]!]).toBe(0);
    expect(state.scores[others[1]!]).toBe(0);
  });

  it('la última ronda no pausa: el estado queda listo para checkEnd sin pedir continue', () => {
    let state = setupState(3, '5');
    for (let round = 0; round < 5; round++) {
      const impostor = state.impostor;
      const others = [0, 1, 2].filter((s) => s !== impostor);
      state = applyMove(state, { type: 'vote', target: others[0]! }, ctx(others[1]!));
      state = applyMove(state, { type: 'vote', target: others[0]! }, ctx(impostor));
      state = applyMove(state, { type: 'vote', target: others[1]! }, ctx(others[0]!));
      if (round < 4) {
        expect(state.phase).toBe('roundEnd');
        state = applyMove(state, { type: 'continue' }, ctx(0));
        state = applyMove(state, { type: 'continue' }, ctx(1));
        state = applyMove(state, { type: 'continue' }, ctx(2));
      }
    }
    expect(state.round).toBe(5);
    expect(activePlayers(state)).toEqual([]);
    expect(checkEnd(state)).not.toBeNull();
  });
});

describe('checkEnd', () => {
  it('ordena el ranking final por puntuación acumulada, con empates compartiendo puesto', () => {
    const state: ImpostorState = {
      ...setupState(3),
      round: 5,
      totalRounds: 5,
      scores: [4, 4, 2],
    };
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'draw' },
        { seat: 1, placement: 1, result: 'draw' },
        { seat: 2, placement: 3, result: 'lose' },
      ],
    });
  });
});

describe('playerView', () => {
  it('el impostor no ve la palabra secreta; el resto sí', () => {
    const state = setupState(4);
    const impostorView = playerView(state, state.impostor);
    expect(impostorView.amITheImpostor).toBe(true);
    expect(impostorView.secretWord).toBeNull();

    const otherSeat = [0, 1, 2, 3].find((s) => s !== state.impostor)!;
    const otherView = playerView(state, otherSeat);
    expect(otherView.amITheImpostor).toBe(false);
    expect(otherView.secretWord).toBe(state.secretWord);
  });

  it('los espectadores tampoco ven la palabra secreta', () => {
    const state = setupState(4);
    const spectatorView = playerView(state, null);
    expect(spectatorView.secretWord).toBeNull();
    expect(spectatorView.amITheImpostor).toBe(false);
  });

  it('muestra el progreso de la votación sin revelar a quién ha votado cada uno', () => {
    let state = setupState(3);
    state = applyMove(state, { type: 'vote', target: (state.impostor + 1) % 3 }, ctx(state.impostor));
    const view = playerView(state, (state.impostor + 1) % 3);
    expect(view.submitted[state.impostor]).toBe(true);
    expect(view.myVote).toBeNull(); // ese asiento aún no ha votado
  });
});
