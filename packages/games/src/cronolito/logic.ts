import type { GameEndResult, MoveCtx, PlayerRank, Rng, SetupCtx } from '@tableria/engine';
import { CRONOLITO_EVENTS } from './events.js';
import type { CronolitoEvent, CronolitoMove, CronolitoPlayerView, CronolitoState } from './types.js';

const STARTING_LIVES = 3;

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
  // El mazo entero (todo el catálogo, +500 hitos) se baraja y se juega sin recortar — en
  // solitario da para una partida larga de verdad; en grupo casi nunca llega a agotarse, porque
  // la eliminación decide antes (ver `isMatchOver`).
  const deck = shuffle(CRONOLITO_EVENTS, ctx.rng);

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

function aliveCount(lives: number[]): number {
  return lives.filter((l) => l > 0).length;
}

/**
 * En solitario la partida solo la decide el propio jugador: se acaba al agotar el mazo (éxito)
 * o al quedarse sin vidas (derrota) — con un único asiento, "queda 1 con vidas" es cierto desde
 * el primer turno, así que ahí el umbral es 0, no 1. Con más de un jugador es una eliminación:
 * en cuanto solo queda uno con vidas, la partida termina ya mismo y ese es el ganador — no hace
 * falta que complete el resto del mazo en solitario. Agotar el mazo con 2+ supervivientes sigue
 * siendo un final de éxito compartido, aunque con +500 cartas es un desenlace raro.
 */
function isMatchOver(state: CronolitoState): boolean {
  if (state.currentCard === null) return true;
  const alive = aliveCount(state.lives);
  return state.numPlayers === 1 ? alive === 0 : alive <= 1;
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
    // Con más de un jugador, este es el caso normal de fin de partida: en cuanto solo queda un
    // Arquitecto en pie, gana ahí mismo (ver `isMatchOver`) — con 2+ supervivientes solo pasa si
    // se agota el mazo entero antes de que la eliminación decida. El/los superviviente(s) ganan
    // juntos; los eliminados por el camino quedan detrás, peor cuanto antes cayeran.
    return state.lives.map((_, seat) => {
      if (alive[seat]) return { seat, placement: 1, result: 'win' as const };
      // `eliminationOrder` lista antes a quien cayó antes — el índice hay que invertirlo para
      // que caer antes dé un puesto peor (número más alto), no mejor.
      const placement = 1 + (state.eliminationOrder.length - state.eliminationOrder.indexOf(seat));
      return { seat, placement, result: 'lose' as const };
    });
  }

  // Bucle Temporal: cayeron todos — con más de un jugador ya no es alcanzable (la partida termina
  // en cuanto queda uno solo en pie, antes de que ese también pueda caer); sigue viva para el
  // solitario, cuyo único asiento cae sin que haya nadie más a quien ceder el turno. Mejor puesto
  // para quien resistió más tiempo (cayó más tarde) — solo relevante si esta rama alguna vez
  // vuelve a ser alcanzable con varios asientos.
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
