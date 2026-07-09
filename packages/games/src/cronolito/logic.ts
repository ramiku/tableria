import type { GameEndResult, MoveCtx, PlayerRank, Rng, SetupCtx } from '@tableria/engine';
import { CRONOLITO_EVENTS } from './events.js';
import type { CronolitoEvent, CronolitoMove, CronolitoPlayerView, CronolitoState } from './types.js';

const STARTING_LIVES = 3;

/** Cartas en juego por partida — una muestra del catálogo completo (más de 300 hitos) para que
 * cada partida sea distinta y de duración razonable, no toda la historia de la humanidad de golpe. */
const DECK_SIZE = 25;

function shuffle<T>(deck: T[], rng: Rng): T[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function setup(ctx: SetupCtx): CronolitoState {
  const numPlayers = ctx.numPlayers;
  const deck = shuffle(CRONOLITO_EVENTS, ctx.rng).slice(0, DECK_SIZE);

  // La primera carta robada arranca la Línea del Tiempo ya con el año visible; la segunda es la
  // primera carta "en juego" del turno 1.
  const initial = deck.pop()!;
  const currentCard = deck.pop() ?? null;

  return {
    numPlayers,
    deck,
    timeline: [initial],
    currentCard,
    lives: Array(numPlayers).fill(STARTING_LIVES),
    turn: 0,
    correctCount: Array(numPlayers).fill(0),
    eliminationOrder: [],
    lastResolution: null,
  };
}

function isMatchOver(state: CronolitoState): boolean {
  return state.currentCard === null || !state.lives.some((l) => l > 0);
}

export function activePlayers(state: CronolitoState): number[] {
  return isMatchOver(state) ? [] : [state.turn];
}

/** Posición reservada que nunca sale de un clic real — solo la usa `onTurnTimeout` (ver
 * `definition.ts`) para forzar una Paradoja automática sin intentar colocar la carta en ningún
 * sitio. Se acepta siempre en `validateMove`: no representa una posición real de la línea. */
export const TIMEOUT_POSITION = -1;

export function validateMove(state: CronolitoState, move: CronolitoMove, ctx: MoveCtx): { ok: true } | { ok: false; code: string } {
  if (isMatchOver(state)) return { ok: false, code: 'GAME_OVER' };
  if (ctx.seat !== state.turn) return { ok: false, code: 'NOT_YOUR_TURN' };
  if (move.position === TIMEOUT_POSITION) return { ok: true };
  if (move.position < 0 || move.position > state.timeline.length) return { ok: false, code: 'INVALID_MOVE' };
  return { ok: true };
}

function nextAliveSeat(lives: number[], from: number): number {
  for (let i = 1; i <= lives.length; i++) {
    const candidate = (from + i) % lives.length;
    if (lives[candidate]! > 0) return candidate;
  }
  return from;
}

/**
 * Reducer principal: coloca (o descarta) la carta en juego según si la posición elegida respeta
 * el orden cronológico, roba la siguiente y pasa el turno al próximo asiento con vidas. La
 * partida se resuelve sola en cuanto el mazo se agota (éxito para quien siga con vida) o todos
 * los asientos se quedan a la vez sin vidas (derrota total).
 */
export function applyMove(state: CronolitoState, move: CronolitoMove, ctx: MoveCtx): CronolitoState {
  const seat = ctx.seat;
  const card = state.currentCard!;

  // El timeout nunca intenta colocar nada — es una Paradoja automática garantizada, no una
  // conjetura al azar sobre dónde encajaría la carta.
  const timedOut = move.position === TIMEOUT_POSITION;
  const before = timedOut ? null : (state.timeline[move.position - 1] ?? null);
  const after = timedOut ? null : (state.timeline[move.position] ?? null);
  const correct = !timedOut && (before === null || before.anio < card.anio) && (after === null || card.anio < after.anio);

  let timeline = state.timeline;
  let lives = state.lives;
  const correctCount = [...state.correctCount];
  let eliminationOrder = state.eliminationOrder;

  if (correct) {
    timeline = [...state.timeline.slice(0, move.position), card, ...state.timeline.slice(move.position)];
    correctCount[seat] = correctCount[seat]! + 1;
  } else {
    lives = [...state.lives];
    lives[seat] = Math.max(0, lives[seat]! - 1);
    if (lives[seat] === 0) eliminationOrder = [...eliminationOrder, seat];
  }

  const lastResolution = { titulo: card.titulo, anio: card.anio, correct, seat, timedOut };

  const deck = [...state.deck];
  const nextCard = deck.pop() ?? null;

  const stillAlive = lives.some((l) => l > 0);
  const turn = !stillAlive || nextCard === null ? seat : nextAliveSeat(lives, seat);

  return { ...state, timeline, lives, correctCount, eliminationOrder, deck, currentCard: nextCard, lastResolution, turn };
}

function rankingFromState(state: CronolitoState): PlayerRank[] {
  const alive = state.lives.map((l) => l > 0);
  const anyAlive = alive.some(Boolean);

  if (anyAlive) {
    // Éxito: la Línea del Tiempo se ha completado con al menos un Arquitecto en pie — todos los
    // supervivientes ganan juntos; los eliminados por el camino quedan detrás, peor cuanto antes cayeran.
    return state.lives.map((_, seat) => {
      if (alive[seat]) return { seat, placement: 1, result: 'win' as const };
      const placement = 2 + state.eliminationOrder.indexOf(seat);
      return { seat, placement, result: 'lose' as const };
    });
  }

  // Bucle Temporal: cayeron todos. Mejor puesto para quien resistió más tiempo (cayó más tarde).
  return state.lives.map((_, seat) => {
    const fellAt = state.eliminationOrder.indexOf(seat);
    const placement = state.eliminationOrder.length - fellAt;
    return { seat, placement, result: 'lose' as const };
  });
}

export function checkEnd(state: CronolitoState): GameEndResult | null {
  if (!isMatchOver(state)) return null;
  return { ranking: rankingFromState(state) };
}

export function playerView(state: CronolitoState, _seatIndex: number | null): CronolitoPlayerView {
  return {
    numPlayers: state.numPlayers,
    timeline: state.timeline,
    currentCardTitle: state.currentCard?.titulo ?? null,
    lives: state.lives,
    turn: state.turn,
    deckCount: state.deck.length,
    correctCount: state.correctCount,
    lastResolution: state.lastResolution,
  };
}

export type { CronolitoEvent };
