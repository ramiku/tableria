import type { GameEndResult, MoveCtx, PlayerRank, Rng, SetupCtx } from '@tableria/engine';
import type { BriscaCard, BriscaMove, BriscaPlayerView, BriscaRoundSummary, BriscaState, Rank, Suit } from './types.js';

const SUITS: Suit[] = ['oros', 'copas', 'espadas', 'bastos'];
const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

/** Orden de fuerza al comparar bazas: As > 3 > Rey > Caballo > Sota > 7 > 6 > 5 > 4 > 2. */
const RANK_STRENGTH: Record<Rank, number> = { 1: 10, 3: 9, 12: 8, 11: 7, 10: 6, 7: 5, 6: 4, 5: 3, 4: 2, 2: 1 };

/** Puntos de baza: As=11, 3=10, Rey=4, Caballo=3, Sota=2, resto=0 (120 puntos en total en la baraja). */
const RANK_POINTS: Record<Rank, number> = { 1: 11, 3: 10, 12: 4, 11: 3, 10: 2, 7: 0, 6: 0, 5: 0, 4: 0, 2: 0 };

/** Rondas ganadas que puede elegir el anfitrión en el lobby — ver `ui.variants` en `definition.ts`. */
const VALID_ROUNDS_TO_WIN = [1, 3, 5];
const DEFAULT_ROUNDS_TO_WIN = 1;

/** Barajas pre-mezcladas en `setup` para las rondas que puedan hacer falta — `applyMove` es un
 * reducer puro sin acceso a `rng` (solo `setup` lo tiene), así que no puede barajar sobre la
 * marcha. 60 rondas es un margen amplísimo para una partida a lo sumo a 5 rondas ganadas. */
const MAX_ROUNDS = 60;

function buildDeck(): BriscaCard[] {
  const deck: BriscaCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push({ suit, rank });
  }
  return deck;
}

function shuffle(deck: BriscaCard[], rng: Rng): BriscaCard[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/** Reparto de una ronda: 3 cartas a cada jugador, triunfo destapado y devuelto al fondo del mazo. */
function dealRound(fullDeck: BriscaCard[], numPlayers: number): { hands: BriscaCard[][]; deck: BriscaCard[]; trumpSuit: Suit; trumpCard: BriscaCard } {
  const deck = [...fullDeck];
  const hands: BriscaCard[][] = Array.from({ length: numPlayers }, () => []);
  for (let round = 0; round < 3; round++) {
    for (let seat = 0; seat < numPlayers; seat++) hands[seat]!.push(deck.pop()!);
  }

  // Se destapa la siguiente carta como triunfo y vuelve al fondo del mazo (se roba en último lugar).
  const trumpCard = deck.pop()!;
  deck.unshift(trumpCard);

  return { hands, deck, trumpSuit: trumpCard.suit, trumpCard };
}

export function setup(ctx: SetupCtx): BriscaState {
  const numPlayers = ctx.numPlayers;
  const requestedRounds = Number(ctx.options?.variant);
  const roundsToWin = VALID_ROUNDS_TO_WIN.includes(requestedRounds) ? requestedRounds : DEFAULT_ROUNDS_TO_WIN;

  const futureDecks = Array.from({ length: MAX_ROUNDS }, () => shuffle(buildDeck(), ctx.rng));
  const first = dealRound(futureDecks[0]!, numPlayers);

  return {
    numPlayers,
    roundsToWin,
    roundNumber: 1,
    matchPoints: Array(numPlayers).fill(0),
    futureDecks,
    deck: first.deck,
    trumpSuit: first.trumpSuit,
    trumpCard: first.trumpCard,
    hands: first.hands,
    currentTrick: Array(numPlayers).fill(null),
    leadSeat: 0,
    turn: 0,
    points: Array(numPlayers).fill(0),
    phase: 'playing',
    pendingConfirm: [],
    lastRoundSummary: null,
  };
}

function isMatchOver(state: BriscaState): boolean {
  return Math.max(...state.matchPoints) >= state.roundsToWin;
}

export function activePlayers(state: BriscaState): number[] {
  if (isMatchOver(state)) return [];
  return state.phase === 'roundEnd' ? state.pendingConfirm : [state.turn];
}

export function validateMove(
  state: BriscaState,
  move: BriscaMove,
  ctx: MoveCtx,
): { ok: true } | { ok: false; code: string } {
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
  return { ok: true };
}

/** Seat(s) que se llevan la ronda: el/los que más puntos de baza sumaron; vacío si hay empate en
 * el máximo (nadie se lleva la ronda ganada, se juega otra). */
function roundWinners(points: number[]): number[] {
  const max = Math.max(...points);
  const winners = points.reduce<number[]>((acc, p, seat) => (p === max ? [...acc, seat] : acc), []);
  return winners.length === 1 ? winners : [];
}

/** Confirma un asiento en la pausa de fin de ronda; cuando ya han confirmado todos, reparte la
 * siguiente ronda desde la baraja pre-mezclada correspondiente. */
function applyContinue(state: BriscaState, seat: number): BriscaState {
  const pendingConfirm = state.pendingConfirm.filter((s) => s !== seat);
  if (pendingConfirm.length > 0) return { ...state, pendingConfirm };

  const nextDeckSource = state.futureDecks[state.roundNumber] ?? state.futureDecks[state.futureDecks.length - 1]!;
  const next = dealRound(nextDeckSource, state.numPlayers);
  return {
    ...state,
    roundNumber: state.roundNumber + 1,
    deck: next.deck,
    trumpSuit: next.trumpSuit,
    trumpCard: next.trumpCard,
    hands: next.hands,
    currentTrick: Array(state.numPlayers).fill(null),
    leadSeat: 0,
    turn: 0,
    points: Array(state.numPlayers).fill(0),
    phase: 'playing',
    pendingConfirm: [],
    lastRoundSummary: null,
  };
}

export function applyMove(state: BriscaState, move: BriscaMove, ctx: MoveCtx): BriscaState {
  if (move.type === 'continue') return applyContinue(state, ctx.seat);

  const seat = ctx.seat;
  const playedHand = [...state.hands[seat]!];
  const [card] = playedHand.splice(move.cardIndex, 1);
  const hands = state.hands.map((h, i) => (i === seat ? playedHand : h));
  const currentTrick = [...state.currentTrick];
  currentTrick[seat] = card!;

  const allPlayed = currentTrick.every((c) => c !== null);
  if (!allPlayed) {
    return { ...state, hands, currentTrick, turn: (seat + 1) % state.numPlayers };
  }

  // Resolver la baza: gana el triunfo más alto jugado; si no hay triunfo, la carta
  // más alta del palo que abrió la mano (jugar un tercer palo nunca gana la baza).
  const played = currentTrick.map((c, i) => ({ seat: i, card: c! }));
  const leadSuit = currentTrick[state.leadSeat]!.suit;
  const trumps = played.filter((p) => p.card.suit === state.trumpSuit);
  const contenders = trumps.length > 0 ? trumps : played.filter((p) => p.card.suit === leadSuit);
  const winner = contenders.reduce((best, cur) =>
    RANK_STRENGTH[cur.card.rank] > RANK_STRENGTH[best.card.rank] ? cur : best,
  );

  const trickPoints = played.reduce((sum, p) => sum + RANK_POINTS[p.card.rank], 0);
  const points = [...state.points];
  points[winner.seat] = points[winner.seat]! + trickPoints;

  // El ganador de la baza roba primero; luego los demás, en orden de asiento.
  const deck = [...state.deck];
  for (let i = 0; i < state.numPlayers; i++) {
    const drawn = deck.pop();
    if (!drawn) break;
    const s = (winner.seat + i) % state.numPlayers;
    hands[s] = [...hands[s]!, drawn];
  }

  const roundOver = deck.length === 0 && hands.every((h) => h.length === 0);
  if (!roundOver) {
    return {
      ...state,
      hands,
      deck,
      points,
      currentTrick: Array(state.numPlayers).fill(null),
      leadSeat: winner.seat,
      turn: winner.seat,
    };
  }

  const winnerSeats = roundWinners(points);
  const matchPoints =
    winnerSeats.length === 1 ? state.matchPoints.map((p, i) => (i === winnerSeats[0] ? p + 1 : p)) : state.matchPoints;
  const lastRoundSummary: BriscaRoundSummary = { roundPoints: points, winnerSeats };

  const base = {
    ...state,
    hands,
    deck,
    points,
    matchPoints,
    currentTrick: Array(state.numPlayers).fill(null),
    leadSeat: winner.seat,
    turn: winner.seat,
    lastRoundSummary,
  };

  // Última ronda: no hay pausa, el estado queda listo para que `checkEnd` cierre la partida ya.
  if (Math.max(...matchPoints) >= state.roundsToWin) return base;

  return { ...base, phase: 'roundEnd', pendingConfirm: Array.from({ length: state.numPlayers }, (_, i) => i) };
}

function rankingFromMatchPoints(matchPoints: number[]): PlayerRank[] {
  const sorted = [...matchPoints].sort((a, b) => b - a);
  return matchPoints.map((p, seat) => {
    const placement = sorted.indexOf(p) + 1;
    const tiedAtTop = p === sorted[0] && sorted.filter((x) => x === sorted[0]).length > 1;
    const result: PlayerRank['result'] = p !== sorted[0] ? 'lose' : tiedAtTop ? 'draw' : 'win';
    return { seat, placement, result };
  });
}

export function checkEnd(state: BriscaState): GameEndResult | null {
  if (!isMatchOver(state)) return null;
  return { ranking: rankingFromMatchPoints(state.matchPoints) };
}

export function playerView(state: BriscaState, seatIndex: number | null): BriscaPlayerView {
  return {
    numPlayers: state.numPlayers,
    roundsToWin: state.roundsToWin,
    roundNumber: state.roundNumber,
    matchPoints: state.matchPoints,
    hand: seatIndex !== null ? (state.hands[seatIndex] ?? null) : null,
    handCounts: state.hands.map((h) => h.length),
    trumpSuit: state.trumpSuit,
    trumpCard: state.trumpCard,
    currentTrick: state.currentTrick,
    leadSeat: state.leadSeat,
    turn: state.turn,
    points: state.points,
    deckCount: state.deck.length,
    phase: state.phase,
    pendingConfirm: state.pendingConfirm,
    lastRoundSummary: state.lastRoundSummary,
  };
}
