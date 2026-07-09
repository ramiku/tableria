import type { GameEndResult, MoveCtx, PlayerRank, Rng, SetupCtx } from '@tableria/engine';
import type { EscobaCard, EscobaHandSummary, EscobaMove, EscobaPlayerView, EscobaState, Rank, Suit } from './types.js';

const SUITS: Suit[] = ['oros', 'copas', 'espadas', 'bastos'];
const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

/** Valor de cada carta a efectos de sumar 15: 1-7 valor de cara, sota=8, caballo=9, rey=10. */
const CAPTURE_VALUE: Record<Rank, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 10: 8, 11: 9, 12: 10 };

/** Puntuaciones objetivo que puede elegir el anfitrión en el lobby — ver `ui.variants` en `definition.ts`. */
const VALID_TARGET_SCORES = [11, 21, 31];
const DEFAULT_TARGET_SCORE = 21;

/** Barajas pre-mezcladas en `setup` para las manos que puedan hacer falta — `applyMove` es un
 * reducer puro sin acceso a `rng` (solo `setup` lo tiene), así que no puede barajar sobre la
 * marcha. 60 manos es un margen amplísimo: en la práctica la partida se decide en muchas menos. */
const MAX_HANDS = 60;

function buildDeck(): EscobaCard[] {
  const deck: EscobaCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push({ suit, rank });
  }
  return deck;
}

function shuffle(deck: EscobaCard[], rng: Rng): EscobaCard[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/** Reparto inicial de una mano: 4 cartas a la mesa, 3 a cada jugador; el resto queda en el mazo. */
function dealHand(fullDeck: EscobaCard[], numPlayers: number): { table: EscobaCard[]; hands: EscobaCard[][]; deck: EscobaCard[] } {
  const deck = [...fullDeck];
  const table = Array.from({ length: 4 }, () => deck.pop()!);
  const hands: EscobaCard[][] = Array.from({ length: numPlayers }, () => []);
  for (let round = 0; round < 3; round++) {
    for (let seat = 0; seat < numPlayers; seat++) hands[seat]!.push(deck.pop()!);
  }
  return { table, hands, deck };
}

/** Reparto de reposición a mitad de mano: 3 cartas más a cada jugador cuando se quedan sin nada
 * en la mano y aún queda mazo — la mesa no se toca. */
function redeal(deck: EscobaCard[], numPlayers: number): { hands: EscobaCard[][]; deck: EscobaCard[] } {
  const d = [...deck];
  const hands: EscobaCard[][] = Array.from({ length: numPlayers }, () => []);
  for (let round = 0; round < 3; round++) {
    for (let seat = 0; seat < numPlayers; seat++) hands[seat]!.push(d.pop()!);
  }
  return { hands, deck: d };
}

/** Puntuación de una mano ya jugada: 1 punto a quien tenga más cartas capturadas (sin empate),
 * 1 a quien tenga más oros (sin empate), 1 a quien capturase el 7 de oros, y 1 por cada escoba.
 * Simplificación deliberada: no se implementa "la primera" (puntuación opcional por valor de carta).
 * Devuelve también QUIÉN se llevó cada categoría, para el desglose del modal de resumen. */
function tallyHandScores(captured: EscobaCard[][], escobas: number[], numPlayers: number): EscobaHandSummary {
  const handPoints = Array(numPlayers).fill(0) as number[];

  const cardCounts = captured.map((c) => c.length);
  const maxCards = Math.max(...cardCounts);
  let cardsWinner: number | null = null;
  if (maxCards > 0 && cardCounts.filter((c) => c === maxCards).length === 1) {
    cardsWinner = cardCounts.indexOf(maxCards);
    handPoints[cardsWinner]! += 1;
  }

  const orosCounts = captured.map((c) => c.filter((card) => card.suit === 'oros').length);
  const maxOros = Math.max(...orosCounts);
  let orosWinner: number | null = null;
  if (maxOros > 0 && orosCounts.filter((c) => c === maxOros).length === 1) {
    orosWinner = orosCounts.indexOf(maxOros);
    handPoints[orosWinner]! += 1;
  }

  const veloWinner = captured.findIndex((c) => c.some((card) => card.suit === 'oros' && card.rank === 7));
  if (veloWinner !== -1) handPoints[veloWinner]! += 1;

  for (let seat = 0; seat < numPlayers; seat++) handPoints[seat]! += escobas[seat]!;

  return { handPoints, cardsWinner, orosWinner, veloWinner: veloWinner === -1 ? null : veloWinner, escobas: [...escobas] };
}

function isMatchDecided(scores: number[], targetScore: number): boolean {
  const max = Math.max(...scores);
  if (max < targetScore) return false;
  return scores.filter((s) => s === max).length === 1;
}

export function setup(ctx: SetupCtx): EscobaState {
  const numPlayers = ctx.numPlayers;
  const requestedTarget = Number(ctx.options?.variant);
  const targetScore = VALID_TARGET_SCORES.includes(requestedTarget) ? requestedTarget : DEFAULT_TARGET_SCORE;

  const futureHands = Array.from({ length: MAX_HANDS }, () => shuffle(buildDeck(), ctx.rng));
  const first = dealHand(futureHands[0]!, numPlayers);

  return {
    numPlayers,
    targetScore,
    futureHands,
    handIndex: 0,
    deck: first.deck,
    hands: first.hands,
    table: first.table,
    captured: Array.from({ length: numPlayers }, () => []),
    escobas: Array(numPlayers).fill(0),
    lastCapturer: null,
    turn: 0,
    scores: Array(numPlayers).fill(0),
    phase: 'playing',
    pendingConfirm: [],
    lastHandSummary: null,
  };
}

function isMatchOver(state: EscobaState): boolean {
  return isMatchDecided(state.scores, state.targetScore);
}

export function activePlayers(state: EscobaState): number[] {
  if (isMatchOver(state)) return [];
  return state.phase === 'roundEnd' ? state.pendingConfirm : [state.turn];
}

export function validateMove(state: EscobaState, move: EscobaMove, ctx: MoveCtx): { ok: true } | { ok: false; code: string } {
  if (isMatchOver(state)) return { ok: false, code: 'GAME_OVER' };

  if (move.type === 'continue') {
    if (state.phase !== 'roundEnd') return { ok: false, code: 'INVALID_MOVE' };
    if (!state.pendingConfirm.includes(ctx.seat)) return { ok: false, code: 'NOT_YOUR_TURN' };
    return { ok: true };
  }

  if (state.phase !== 'playing') return { ok: false, code: 'INVALID_MOVE' };
  if (ctx.seat !== state.turn) return { ok: false, code: 'NOT_YOUR_TURN' };
  const hand = state.hands[ctx.seat];
  if (!hand || move.cardIndex < 0 || move.cardIndex >= hand.length) return { ok: false, code: 'INVALID_MOVE' };

  if (move.captureIndices.length > 0) {
    const seen = new Set<number>();
    for (const i of move.captureIndices) {
      if (i < 0 || i >= state.table.length || seen.has(i)) return { ok: false, code: 'INVALID_MOVE' };
      seen.add(i);
    }
    const playedValue = CAPTURE_VALUE[hand[move.cardIndex]!.rank];
    const tableSum = move.captureIndices.reduce((sum, i) => sum + CAPTURE_VALUE[state.table[i]!.rank], 0);
    if (playedValue + tableSum !== 15) return { ok: false, code: 'INVALID_MOVE' };
  }

  return { ok: true };
}

/** Confirma un asiento en la pausa de fin de mano; cuando ya han confirmado todos, reparte la
 * siguiente mano desde la baraja pre-mezclada correspondiente. */
function applyContinue(state: EscobaState, seat: number): EscobaState {
  const pendingConfirm = state.pendingConfirm.filter((s) => s !== seat);
  if (pendingConfirm.length > 0) return { ...state, pendingConfirm };

  const nextHandIndex = state.handIndex + 1;
  const nextDeckSource = state.futureHands[nextHandIndex] ?? state.futureHands[state.futureHands.length - 1]!;
  const next = dealHand(nextDeckSource, state.numPlayers);
  return {
    ...state,
    handIndex: nextHandIndex,
    hands: next.hands,
    deck: next.deck,
    table: next.table,
    captured: Array.from({ length: state.numPlayers }, () => []),
    escobas: Array(state.numPlayers).fill(0),
    lastCapturer: null,
    // Rota quién abre cada mano para que nadie tenga siempre ventaja de salida.
    turn: nextHandIndex % state.numPlayers,
    phase: 'playing',
    pendingConfirm: [],
  };
}

/**
 * Reducer principal. No hay "bazas" como en Brisca: cada jugador simplemente juega una carta e
 * intenta sumar 15 con la mesa; capturar no es obligatorio (simplificación deliberada — el
 * reglamento estricto exige capturar si hay alguna combinación posible, pero comprobar eso de
 * verdad exigiría enumerar subconjuntos de una mesa que puede crecer bastante). Cuando una mano
 * termina y la partida no está decidida, congela el reparto de la siguiente en `phase: 'roundEnd'`
 * hasta que todos los asientos confirmen con `continue` (ver `applyContinue`).
 */
export function applyMove(state: EscobaState, move: EscobaMove, ctx: MoveCtx): EscobaState {
  if (move.type === 'continue') return applyContinue(state, ctx.seat);

  const seat = ctx.seat;
  const hand = [...state.hands[seat]!];
  const [playedCard] = hand.splice(move.cardIndex, 1);

  const captureSet = new Set(move.captureIndices);
  const captured = state.captured.map((c) => [...c]);
  const escobas = [...state.escobas];
  let table = [...state.table];
  let lastCapturer = state.lastCapturer;

  if (captureSet.size > 0) {
    const capturedCards = move.captureIndices.map((i) => table[i]!);
    const remainingTable = table.filter((_, i) => !captureSet.has(i));
    captured[seat] = [...captured[seat]!, playedCard!, ...capturedCards];
    if (remainingTable.length === 0) escobas[seat] = escobas[seat]! + 1;
    table = remainingTable;
    lastCapturer = seat;
  } else {
    table = [...table, playedCard!];
  }

  const hands = state.hands.map((h, i) => (i === seat ? hand : h));
  const nextTurn = (seat + 1) % state.numPlayers;

  if (!hands.every((h) => h.length === 0)) {
    return { ...state, hands, table, captured, escobas, lastCapturer, turn: nextTurn };
  }

  if (state.deck.length > 0) {
    const redealt = redeal(state.deck, state.numPlayers);
    return { ...state, hands: redealt.hands, deck: redealt.deck, table, captured, escobas, lastCapturer, turn: nextTurn };
  }

  // Se acabó la mano: lo que quede en la mesa se lo lleva quien hizo la última captura.
  if (table.length > 0 && lastCapturer !== null) {
    captured[lastCapturer] = [...captured[lastCapturer]!, ...table];
  }

  const handSummary = tallyHandScores(captured, escobas, state.numPlayers);
  const scores = state.scores.map((s, i) => s + handSummary.handPoints[i]!);

  if (isMatchDecided(scores, state.targetScore)) {
    // Última mano: no hay pausa, el estado queda listo para que `checkEnd` cierre la partida ya.
    return {
      ...state,
      hands,
      deck: [],
      table: [],
      captured,
      escobas,
      lastCapturer,
      scores,
      turn: nextTurn,
      lastHandSummary: handSummary,
    };
  }

  return {
    ...state,
    hands,
    deck: [],
    table: [],
    captured,
    escobas,
    lastCapturer,
    scores,
    turn: nextTurn,
    phase: 'roundEnd',
    pendingConfirm: Array.from({ length: state.numPlayers }, (_, i) => i),
    lastHandSummary: handSummary,
  };
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

export function checkEnd(state: EscobaState): GameEndResult | null {
  if (!isMatchOver(state)) return null;
  return { ranking: rankingFromScores(state.scores) };
}

export function playerView(state: EscobaState, seatIndex: number | null): EscobaPlayerView {
  return {
    numPlayers: state.numPlayers,
    targetScore: state.targetScore,
    hand: seatIndex !== null ? (state.hands[seatIndex] ?? null) : null,
    handCounts: state.hands.map((h) => h.length),
    table: state.table,
    capturedCounts: state.captured.map((c) => c.length),
    escobas: state.escobas,
    scores: state.scores,
    turn: state.turn,
    deckCount: state.deck.length,
    phase: state.phase,
    pendingConfirm: state.pendingConfirm,
    lastHandSummary: state.lastHandSummary,
  };
}
