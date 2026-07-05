import type { GameEndResult, MoveCtx, PlayerRank, Rng, SetupCtx } from '@tableria/engine';
import type { BriscaCard, BriscaMove, BriscaPlayerView, BriscaState, Rank, Suit } from './types.js';

const SUITS: Suit[] = ['oros', 'copas', 'espadas', 'bastos'];
const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

/** Orden de fuerza al comparar bazas: As > 3 > Rey > Caballo > Sota > 7 > 6 > 5 > 4 > 2. */
const RANK_STRENGTH: Record<Rank, number> = { 1: 10, 3: 9, 12: 8, 11: 7, 10: 6, 7: 5, 6: 4, 5: 3, 4: 2, 2: 1 };

/** Puntos de baza: As=11, 3=10, Rey=4, Caballo=3, Sota=2, resto=0 (120 puntos en total en la baraja). */
const RANK_POINTS: Record<Rank, number> = { 1: 11, 3: 10, 12: 4, 11: 3, 10: 2, 7: 0, 6: 0, 5: 0, 4: 0, 2: 0 };

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

export function setup(ctx: SetupCtx): BriscaState {
  const numPlayers = ctx.numPlayers;
  const deck = shuffle(buildDeck(), ctx.rng);

  const hands: BriscaCard[][] = Array.from({ length: numPlayers }, () => []);
  for (let round = 0; round < 3; round++) {
    for (let seat = 0; seat < numPlayers; seat++) {
      hands[seat]!.push(deck.pop()!);
    }
  }

  // Se destapa la siguiente carta como triunfo y vuelve al fondo del mazo (se roba en último lugar).
  const trumpCard = deck.pop()!;
  deck.unshift(trumpCard);

  return {
    numPlayers,
    deck,
    trumpSuit: trumpCard.suit,
    trumpCard,
    hands,
    currentTrick: Array(numPlayers).fill(null),
    leadSeat: 0,
    turn: 0,
    points: Array(numPlayers).fill(0),
  };
}

export function activePlayers(state: BriscaState): number[] {
  const ended = state.deck.length === 0 && state.hands.every((h) => h.length === 0);
  return ended ? [] : [state.turn];
}

export function validateMove(
  state: BriscaState,
  move: BriscaMove,
  ctx: MoveCtx,
): { ok: true } | { ok: false; code: string } {
  if (activePlayers(state).length === 0) return { ok: false, code: 'GAME_OVER' };
  if (ctx.seat !== state.turn) return { ok: false, code: 'NOT_YOUR_TURN' };
  const hand = state.hands[ctx.seat];
  if (!hand || move.cardIndex < 0 || move.cardIndex >= hand.length) return { ok: false, code: 'INVALID_MOVE' };
  return { ok: true };
}

export function applyMove(state: BriscaState, move: BriscaMove, ctx: MoveCtx): BriscaState {
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

function rankingFromPoints(points: number[]): PlayerRank[] {
  const sorted = [...points].sort((a, b) => b - a);
  return points.map((p, seat) => {
    const placement = sorted.indexOf(p) + 1;
    const tiedAtTop = p === sorted[0] && sorted.filter((x) => x === sorted[0]).length > 1;
    const result: PlayerRank['result'] = p !== sorted[0] ? 'lose' : tiedAtTop ? 'draw' : 'win';
    return { seat, placement, result };
  });
}

export function checkEnd(state: BriscaState): GameEndResult | null {
  if (state.deck.length > 0 || state.hands.some((h) => h.length > 0)) return null;
  return { ranking: rankingFromPoints(state.points) };
}

export function playerView(state: BriscaState, seatIndex: number | null): BriscaPlayerView {
  return {
    numPlayers: state.numPlayers,
    hand: seatIndex !== null ? (state.hands[seatIndex] ?? null) : null,
    handCounts: state.hands.map((h) => h.length),
    trumpSuit: state.trumpSuit,
    trumpCard: state.trumpCard,
    currentTrick: state.currentTrick,
    leadSeat: state.leadSeat,
    turn: state.turn,
    points: state.points,
    deckCount: state.deck.length,
  };
}
