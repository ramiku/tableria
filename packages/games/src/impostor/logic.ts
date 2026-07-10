import type { GameEndResult, MoveCtx, PlayerRank, Rng, SetupCtx } from '@tableria/engine';
import { WORD_LIST } from './words.js';
import type { ImpostorMove, ImpostorPlayerView, ImpostorRoundSummary, ImpostorState } from './types.js';

/** Rondas totales que puede elegir el anfitrión en el lobby — ver `ui.variants` en `definition.ts`. */
const VALID_TOTAL_ROUNDS = [5, 9, 15];
const DEFAULT_TOTAL_ROUNDS = 5;

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function setup(ctx: SetupCtx): ImpostorState {
  const numPlayers = ctx.numPlayers;
  const requested = Number(ctx.options?.variant);
  const totalRounds = VALID_TOTAL_ROUNDS.includes(requested) ? requested : DEFAULT_TOTAL_ROUNDS;

  // El número total de rondas es fijo y se conoce desde el principio (a diferencia de Brisca,
  // aquí no hay empates que alarguen la partida) — se sortea de una vez impostor y palabra de
  // cada ronda en `setup`, la única función con acceso a `rng`.
  const words = shuffle(WORD_LIST, ctx.rng).slice(0, totalRounds);
  const impostors = Array.from({ length: totalRounds }, () => ctx.rng.int(numPlayers));

  return {
    numPlayers,
    totalRounds,
    round: 0,
    impostors,
    words,
    impostor: impostors[0]!,
    secretWord: words[0]!,
    phase: 'voting',
    votes: Array(numPlayers).fill(null),
    revoteCount: 0,
    scores: Array(numPlayers).fill(0),
    pendingConfirm: [],
    lastRoundSummary: null,
  };
}

function isMatchOver(state: ImpostorState): boolean {
  return state.round >= state.totalRounds;
}

export function activePlayers(state: ImpostorState): number[] {
  if (isMatchOver(state)) return [];
  if (state.phase === 'roundEnd') return state.pendingConfirm;
  return state.votes.reduce<number[]>((seats, v, seat) => (v === null ? [...seats, seat] : seats), []);
}

export function validateMove(state: ImpostorState, move: ImpostorMove, ctx: MoveCtx): { ok: true } | { ok: false; code: string } {
  if (isMatchOver(state)) return { ok: false, code: 'GAME_OVER' };
  if (!activePlayers(state).includes(ctx.seat)) return { ok: false, code: 'NOT_YOUR_TURN' };

  if (state.phase === 'roundEnd') {
    return move.type === 'continue' ? { ok: true } : { ok: false, code: 'WRONG_PHASE' };
  }

  if (move.type !== 'vote') return { ok: false, code: 'WRONG_PHASE' };
  if (move.target === ctx.seat) return { ok: false, code: 'INVALID_MOVE' }; // no puedes acusarte a ti mismo
  if (move.target < 0 || move.target >= state.numPlayers) return { ok: false, code: 'INVALID_MOVE' };
  return { ok: true };
}

/** Asiento(s) con más votos. Más de uno = empate — hay que repetir la votación entera. */
function mostVotedSeats(votes: number[], numPlayers: number): number[] {
  const counts = Array<number>(numPlayers).fill(0);
  for (const v of votes) counts[v]! += 1;
  const max = Math.max(...counts);
  return counts.reduce<number[]>((seats, c, seat) => (c === max ? [...seats, seat] : seats), []);
}

export function applyMove(state: ImpostorState, move: ImpostorMove, ctx: MoveCtx): ImpostorState {
  if (move.type === 'continue') {
    const pendingConfirm = state.pendingConfirm.filter((s) => s !== ctx.seat);
    if (pendingConfirm.length > 0) return { ...state, pendingConfirm };

    // Todos confirmaron: reparte la siguiente ronda (impostor y palabra ya sorteados en `setup`).
    const round = state.round + 1;
    return {
      ...state,
      round,
      impostor: state.impostors[round] ?? state.impostor,
      secretWord: state.words[round] ?? state.secretWord,
      phase: 'voting',
      votes: Array(state.numPlayers).fill(null),
      revoteCount: 0,
      pendingConfirm: [],
      lastRoundSummary: null,
    };
  }

  // move.type === 'vote'
  const votes = [...state.votes];
  votes[ctx.seat] = move.target;
  if (votes.some((v) => v === null)) return { ...state, votes };

  const resolvedVotes = votes as number[];
  const topSeats = mostVotedSeats(resolvedVotes, state.numPlayers);

  if (topSeats.length > 1) {
    // Empate: se repite la votación entera desde cero (no solo entre los empatados).
    return { ...state, votes: Array(state.numPlayers).fill(null), revoteCount: state.revoteCount + 1 };
  }

  const accused = topSeats[0]!;
  const caught = accused === state.impostor;
  const pointsAwarded = Array<number>(state.numPlayers).fill(0);
  if (caught) {
    for (let seat = 0; seat < state.numPlayers; seat++) {
      if (seat !== state.impostor) pointsAwarded[seat] = 1;
    }
  } else {
    pointsAwarded[state.impostor] = 2;
  }
  const scores = state.scores.map((s, seat) => s + pointsAwarded[seat]!);

  const lastRoundSummary: ImpostorRoundSummary = {
    impostor: state.impostor,
    secretWord: state.secretWord,
    votes: resolvedVotes,
    accused,
    caught,
    pointsAwarded,
  };

  const base: ImpostorState = { ...state, votes: resolvedVotes, scores, lastRoundSummary };

  // Última ronda: no hay pausa, el estado queda listo para que `checkEnd` cierre la partida ya
  // (igual que Brisca/Tute/Escoba en su ronda decisiva).
  if (state.round + 1 >= state.totalRounds) return { ...base, round: state.round + 1 };

  return { ...base, phase: 'roundEnd', pendingConfirm: Array.from({ length: state.numPlayers }, (_, i) => i) };
}

function rankingFromScores(scores: number[]): PlayerRank[] {
  const sorted = [...scores].sort((a, b) => b - a);
  return scores.map((s, seat) => {
    const placement = sorted.indexOf(s) + 1;
    const tiedAtTop = s === sorted[0] && sorted.filter((x) => x === sorted[0]).length > 1;
    const result: PlayerRank['result'] = s !== sorted[0] ? 'lose' : tiedAtTop ? 'draw' : 'win';
    return { seat, placement, result };
  });
}

export function checkEnd(state: ImpostorState): GameEndResult | null {
  if (!isMatchOver(state)) return null;
  return { ranking: rankingFromScores(state.scores) };
}

export function playerView(state: ImpostorState, playerIndex: number | null): ImpostorPlayerView {
  const amITheImpostor = playerIndex !== null && playerIndex === state.impostor;
  const submitted = state.votes.map((v) => v !== null);
  const myVote = playerIndex !== null ? (state.votes[playerIndex] ?? null) : null;

  // La palabra nunca llega a quien es el impostor, ni a espectadores (podrían estar compartiendo
  // pantalla con él) — mismo criterio que Pista Única con las pistas anuladas.
  const secretWord = !amITheImpostor && playerIndex !== null ? state.secretWord : null;

  return {
    numPlayers: state.numPlayers,
    totalRounds: state.totalRounds,
    round: state.round,
    scores: state.scores,
    phase: state.phase,
    amITheImpostor,
    secretWord,
    submitted,
    myVote,
    revoteCount: state.revoteCount,
    pendingConfirm: state.pendingConfirm,
    lastRoundSummary: state.lastRoundSummary,
  };
}
