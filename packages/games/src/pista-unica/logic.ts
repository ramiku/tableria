import type { GameEndResult, MoveCtx, SetupCtx, Rng } from '@tableria/engine';
import type { PistaUnicaMove, PistaUnicaState, PistaUnicaView, RoundHistoryEntry } from './types.js';
import { WORD_LIST } from './words.js';

function normalize(word: string): string {
  // NFD separa cada letra acentuada en base + marca diacrítica combinante (rango Unicode U+0300–U+036F);
  // quitarlas hace que "camaleón"/"camaleon" cuenten como la misma palabra al comparar pistas o adivinanzas.
  return word
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function pickWords(rng: Rng, count: number): string[] {
  const pool = [...WORD_LIST];
  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = rng.int(pool.length);
    picked.push(pool[idx]!);
    pool.splice(idx, 1);
  }
  return picked;
}

export function setup(ctx: SetupCtx): PistaUnicaState {
  const numPlayers = ctx.numPlayers;
  const words = pickWords(ctx.rng, numPlayers);
  return {
    numPlayers,
    round: 0,
    guesser: 0,
    phase: 'clue',
    secretWord: words[0]!,
    words,
    clues: Array(numPlayers).fill(null),
    clueValid: Array(numPlayers).fill(null),
    score: 0,
    history: [],
  };
}

export function checkEnd(state: PistaUnicaState): GameEndResult | null {
  if (state.round < state.numPlayers) return null;
  const result = state.score * 2 >= state.numPlayers ? 'win' : 'lose';
  return {
    ranking: Array.from({ length: state.numPlayers }, (_, seat) => ({ seat, placement: 1, result })),
  };
}

export function activePlayers(state: PistaUnicaState): number[] {
  if (checkEnd(state)) return [];
  if (state.phase === 'guess') return [state.guesser];

  const seats: number[] = [];
  for (let seat = 0; seat < state.numPlayers; seat++) {
    if (seat !== state.guesser && state.clues[seat] === null) seats.push(seat);
  }
  return seats;
}

export function validateMove(
  state: PistaUnicaState,
  move: PistaUnicaMove,
  ctx: MoveCtx,
): { ok: true } | { ok: false; code: string } {
  const active = activePlayers(state);
  if (active.length === 0) return { ok: false, code: 'GAME_OVER' };
  if (!active.includes(ctx.seat)) return { ok: false, code: 'NOT_YOUR_TURN' };
  if (state.phase === 'clue' && move.type !== 'clue') return { ok: false, code: 'WRONG_PHASE' };
  if (state.phase === 'guess' && move.type !== 'guess') return { ok: false, code: 'WRONG_PHASE' };
  if (normalize(move.word).length === 0) return { ok: false, code: 'INVALID_MOVE' };
  if (move.type === 'clue' && normalize(move.word) === normalize(state.secretWord)) {
    return { ok: false, code: 'CLUE_MATCHES_SECRET' };
  }
  return { ok: true };
}

export function applyMove(state: PistaUnicaState, move: PistaUnicaMove, ctx: MoveCtx): PistaUnicaState {
  if (move.type === 'clue') {
    const clues = [...state.clues];
    clues[ctx.seat] = move.word.trim();
    const next: PistaUnicaState = { ...state, clues };

    if (activePlayers(next).length > 0) return next; // aún faltan pistas por mandar

    // Todas las pistas están: invalidar duplicadas (comparación normalizada) y pasar a adivinar.
    const counts = new Map<string, number>();
    for (let seat = 0; seat < next.numPlayers; seat++) {
      if (seat === next.guesser) continue;
      const key = normalize(next.clues[seat]!);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const clueValid = next.clues.map((clue, seat) => (seat === next.guesser ? null : counts.get(normalize(clue!))! === 1));
    return { ...next, clueValid, phase: 'guess' };
  }

  // move.type === 'guess'
  const correct = normalize(move.word) === normalize(state.secretWord);
  const historyEntry: RoundHistoryEntry = {
    round: state.round,
    guesser: state.guesser,
    secretWord: state.secretWord,
    clues: state.clues,
    clueValid: state.clueValid,
    guess: move.word.trim(),
    correct,
  };
  const score = state.score + (correct ? 1 : 0);
  const history = [...state.history, historyEntry];
  const nextRound = state.round + 1;

  if (nextRound >= state.numPlayers) {
    return { ...state, score, history, round: nextRound };
  }

  return {
    ...state,
    round: nextRound,
    guesser: nextRound,
    phase: 'clue',
    secretWord: state.words[nextRound]!,
    clues: Array(state.numPlayers).fill(null),
    clueValid: Array(state.numPlayers).fill(null),
    score,
    history,
  };
}

export function playerView(state: PistaUnicaState, playerIndex: number | null): PistaUnicaView {
  const finished = checkEnd(state) !== null;
  const isGuesser = playerIndex !== null && playerIndex === state.guesser;
  const revealed = finished || state.phase === 'guess';

  const secretWord = finished || (playerIndex !== null && !isGuesser) ? state.secretWord : null;
  const submitted = state.clues.map((c, seat) => (seat === state.guesser ? false : c !== null));

  // Una pista repetida se anula y NUNCA debe llegar a quien adivina (ni a espectadores, que
  // podrían estar compartiendo pantalla con él): el propio motivo de anularla es que revelaría
  // la palabra secreta demasiado fácil. El resto de compañeros de pista sí las ve tal cual — son
  // quienes las escribieron y necesitan saber por qué se anularon. Una vez terminada la partida
  // ya no hay nada que proteger, así que el historial siempre queda íntegro.
  const hideInvalidClues = !finished && state.phase === 'guess' && (isGuesser || playerIndex === null);

  const clues = revealed
    ? state.clues.map((c, seat) => (hideInvalidClues && state.clueValid[seat] === false ? null : c))
    : state.clues.map((c, seat) => (playerIndex !== null && seat === playerIndex ? c : null));
  const clueValid = revealed ? state.clueValid : state.clues.map(() => null);

  return {
    numPlayers: state.numPlayers,
    round: state.round,
    totalRounds: state.numPlayers,
    guesser: state.guesser,
    phase: state.phase,
    secretWord,
    clues,
    clueValid,
    submitted,
    score: state.score,
    history: state.history,
  };
}
