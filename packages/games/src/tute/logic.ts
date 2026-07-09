import type { GameEndResult, MoveCtx, PlayerRank, Rng, SetupCtx } from '@tableria/engine';
import type { TuteCard, TuteMove, TutePlayerView, TuteRoundSummary, TuteState, Rank, Suit } from './types.js';

const SUITS: Suit[] = ['oros', 'copas', 'espadas', 'bastos'];
const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Orden de fuerza al comparar bazas: As > 3 > Rey > Caballo > Sota > 9 > 8 > 7 > 6 > 5 > 4 > 2.
 * Las mismas 5 cartas de Brisca mandan igual; el resto (incluidos el 8 y el 9, que no existen en
 * Brisca) son "de relleno" sin consenso oficial de orden — convención propia, documentada aquí,
 * ya que en la práctica solo importa cuando nadie juega ni triunfo ni el palo de la mano. */
const RANK_STRENGTH: Record<Rank, number> = { 1: 12, 3: 11, 12: 10, 11: 9, 10: 8, 9: 7, 8: 6, 7: 5, 6: 4, 5: 3, 4: 2, 2: 1 };

/** Puntos de baza: As=11, 3=10, Rey=4, Caballo=3, Sota=2, resto=0 (120 puntos en la baraja,
 * igual que en Brisca — el 8 y el 9 añadidos no puntúan). */
const RANK_POINTS: Record<Rank, number> = { 1: 11, 3: 10, 12: 4, 11: 3, 10: 2, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 2: 0 };

/** Cante de rey+caballo del mismo palo: 20 puntos: "las cuarenta" (40) si es el palo de triunfo. */
const CANTE_PLAIN = 20;
const CANTE_TRUMP = 40;

/** Bonus por ganar la última baza de la mano. */
const LAST_TRICK_BONUS = 10;

/** Rondas ganadas que puede elegir el anfitrión en el lobby — ver `ui.variants` en `definition.ts`. */
const VALID_ROUNDS_TO_WIN = [1, 3, 5];
const DEFAULT_ROUNDS_TO_WIN = 1;

/** Barajas pre-mezcladas en `setup` para las rondas que puedan hacer falta — `applyMove` es un
 * reducer puro sin acceso a `rng` (solo `setup` lo tiene), así que no puede barajar sobre la
 * marcha. 60 rondas es un margen amplísimo para una partida a lo sumo a 5 rondas ganadas. */
const MAX_ROUNDS = 60;

function buildDeck(): TuteCard[] {
  const deck: TuteCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push({ suit, rank });
  }
  return deck;
}

function shuffle(deck: TuteCard[], rng: Rng): TuteCard[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/**
 * Agrupa asientos a efectos de puntuación: con 4 jugadores hay parejas fijas sentadas una frente
 * a la otra (asientos 0+2 contra 1+3); con 3 (Tute Cabrón) no hay alianzas, cada asiento va a la
 * suya y es su propio grupo. Compartido por `tute` y `tute-cabron` — es la única diferencia real
 * de reglas entre ambos, así que basta con parametrizar por `numPlayers`.
 */
export function groupOf(seat: number, numPlayers: number): number {
  return numPlayers === 4 ? seat % 2 : seat;
}

function numGroupsFor(numPlayers: number): number {
  return numPlayers === 4 ? 2 : numPlayers;
}

/** Reparto de una ronda: la baraja entera repartida de golpe; el palo de la primera carta
 * barajada decide el triunfo (no hay carta de triunfo física aparte, a diferencia de Brisca). */
function dealRound(fullDeck: TuteCard[], numPlayers: number): { hands: TuteCard[][]; trumpSuit: Suit } {
  const deck = [...fullDeck];
  const trumpSuit = deck[0]!.suit;

  const perPlayer = 48 / numPlayers;
  const hands: TuteCard[][] = Array.from({ length: numPlayers }, () => []);
  for (let round = 0; round < perPlayer; round++) {
    for (let seat = 0; seat < numPlayers; seat++) hands[seat]!.push(deck.pop()!);
  }

  return { hands, trumpSuit };
}

export function setup(ctx: SetupCtx): TuteState {
  const numPlayers = ctx.numPlayers;
  const requestedRounds = Number(ctx.options?.variant);
  const roundsToWin = VALID_ROUNDS_TO_WIN.includes(requestedRounds) ? requestedRounds : DEFAULT_ROUNDS_TO_WIN;

  const futureDecks = Array.from({ length: MAX_ROUNDS }, () => shuffle(buildDeck(), ctx.rng));
  const first = dealRound(futureDecks[0]!, numPlayers);
  const numGroups = numGroupsFor(numPlayers);

  return {
    numPlayers,
    roundsToWin,
    roundNumber: 1,
    matchRoundsWon: Array(numGroups).fill(0),
    futureDecks,
    trumpSuit: first.trumpSuit,
    hands: first.hands,
    currentTrick: Array(numPlayers).fill(null),
    leadSeat: 0,
    turn: 0,
    groupScores: Array(numGroups).fill(0),
    cantedSuits: [],
    phase: 'playing',
    pendingConfirm: [],
    lastRoundSummary: null,
  };
}

function isMatchOver(state: TuteState): boolean {
  return Math.max(...state.matchRoundsWon) >= state.roundsToWin;
}

export function activePlayers(state: TuteState): number[] {
  if (isMatchOver(state)) return [];
  return state.phase === 'roundEnd' ? state.pendingConfirm : [state.turn];
}

export function validateMove(state: TuteState, move: TuteMove, ctx: MoveCtx): { ok: true } | { ok: false; code: string } {
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

  if (move.cante) {
    const isLeading = state.currentTrick.every((c) => c === null);
    if (!isLeading) return { ok: false, code: 'INVALID_CANTE' };
    if (state.cantedSuits.includes(move.cante)) return { ok: false, code: 'INVALID_CANTE' };
    const hasKing = hand.some((c) => c.suit === move.cante && c.rank === 12);
    const hasKnight = hand.some((c) => c.suit === move.cante && c.rank === 11);
    if (!hasKing || !hasKnight) return { ok: false, code: 'INVALID_CANTE' };
  }

  return { ok: true };
}

/** Grupo(s) que se llevan la ronda: el/los que más puntos sumaron; vacío si hay empate en el
 * máximo (nadie se lleva la ronda ganada, se juega otra). */
function roundWinners(groupScores: number[]): number[] {
  const max = Math.max(...groupScores);
  const winners = groupScores.reduce<number[]>((acc, p, group) => (p === max ? [...acc, group] : acc), []);
  return winners.length === 1 ? winners : [];
}

/** Confirma un asiento en la pausa de fin de ronda; cuando ya han confirmado todos, reparte la
 * siguiente ronda desde la baraja pre-mezclada correspondiente. */
function applyContinue(state: TuteState, seat: number): TuteState {
  const pendingConfirm = state.pendingConfirm.filter((s) => s !== seat);
  if (pendingConfirm.length > 0) return { ...state, pendingConfirm };

  const nextDeckSource = state.futureDecks[state.roundNumber] ?? state.futureDecks[state.futureDecks.length - 1]!;
  const next = dealRound(nextDeckSource, state.numPlayers);
  return {
    ...state,
    roundNumber: state.roundNumber + 1,
    trumpSuit: next.trumpSuit,
    hands: next.hands,
    currentTrick: Array(state.numPlayers).fill(null),
    leadSeat: 0,
    turn: 0,
    groupScores: Array(numGroupsFor(state.numPlayers)).fill(0),
    cantedSuits: [],
    phase: 'playing',
    pendingConfirm: [],
    lastRoundSummary: null,
  };
}

/**
 * Reducer principal: jugar una carta (con cante opcional bundled en la misma jugada — no cuesta
 * turno aparte) y, si se completa la baza, resolverla igual que en Brisca (gana el triunfo más
 * alto; si no hay triunfo, la carta más alta del palo que abrió — un tercer palo nunca gana).
 * Cuando la ronda termina (manos vacías) y la partida no está decidida, congela el reparto de la
 * siguiente en `phase: 'roundEnd'` hasta que todos los asientos confirmen con `continue`.
 */
export function applyMove(state: TuteState, move: TuteMove, ctx: MoveCtx): TuteState {
  if (move.type === 'continue') return applyContinue(state, ctx.seat);

  const seat = ctx.seat;
  const hand = [...state.hands[seat]!];
  const [playedCard] = hand.splice(move.cardIndex, 1);
  const hands = state.hands.map((h, i) => (i === seat ? hand : h));

  let groupScores = state.groupScores;
  let cantedSuits = state.cantedSuits;
  if (move.cante) {
    const bonus = move.cante === state.trumpSuit ? CANTE_TRUMP : CANTE_PLAIN;
    const g = groupOf(seat, state.numPlayers);
    groupScores = groupScores.map((s, i) => (i === g ? s + bonus : s));
    cantedSuits = [...cantedSuits, move.cante];
  }

  const currentTrick = [...state.currentTrick];
  currentTrick[seat] = playedCard!;

  const allPlayed = currentTrick.every((c) => c !== null);
  if (!allPlayed) {
    return { ...state, hands, currentTrick, groupScores, cantedSuits, turn: (seat + 1) % state.numPlayers };
  }

  const played = currentTrick.map((c, i) => ({ seat: i, card: c! }));
  const leadSuit = currentTrick[state.leadSeat]!.suit;
  const trumps = played.filter((p) => p.card.suit === state.trumpSuit);
  const contenders = trumps.length > 0 ? trumps : played.filter((p) => p.card.suit === leadSuit);
  const winner = contenders.reduce((best, cur) =>
    RANK_STRENGTH[cur.card.rank] > RANK_STRENGTH[best.card.rank] ? cur : best,
  );

  const trickPoints = played.reduce((sum, p) => sum + RANK_POINTS[p.card.rank], 0);
  const winnerGroup = groupOf(winner.seat, state.numPlayers);
  groupScores = groupScores.map((s, i) => (i === winnerGroup ? s + trickPoints : s));

  const isLastTrick = hands.every((h) => h.length === 0);
  if (!isLastTrick) {
    return {
      ...state,
      hands,
      groupScores,
      cantedSuits,
      currentTrick: Array(state.numPlayers).fill(null),
      leadSeat: winner.seat,
      turn: winner.seat,
    };
  }

  groupScores = groupScores.map((s, i) => (i === winnerGroup ? s + LAST_TRICK_BONUS : s));

  const winnerGroups = roundWinners(groupScores);
  const matchRoundsWon =
    winnerGroups.length === 1 ? state.matchRoundsWon.map((w, i) => (i === winnerGroups[0] ? w + 1 : w)) : state.matchRoundsWon;
  const lastRoundSummary: TuteRoundSummary = { groupPoints: groupScores, winnerGroups };

  const base = {
    ...state,
    hands,
    groupScores,
    cantedSuits,
    currentTrick: Array(state.numPlayers).fill(null),
    leadSeat: winner.seat,
    turn: winner.seat,
    matchRoundsWon,
    lastRoundSummary,
  };

  // Última ronda: no hay pausa, el estado queda listo para que `checkEnd` cierre la partida ya.
  if (Math.max(...matchRoundsWon) >= state.roundsToWin) return base;

  return { ...base, phase: 'roundEnd', pendingConfirm: Array.from({ length: state.numPlayers }, (_, i) => i) };
}

function rankingFromMatchRoundsWon(matchRoundsWon: number[], numPlayers: number): PlayerRank[] {
  const sorted = [...matchRoundsWon].sort((a, b) => b - a);
  return Array.from({ length: numPlayers }, (_, seat) => {
    const won = matchRoundsWon[groupOf(seat, numPlayers)]!;
    const placement = sorted.indexOf(won) + 1;
    const tiedAtTop = won === sorted[0] && sorted.filter((x) => x === sorted[0]).length > 1;
    const result: PlayerRank['result'] = won !== sorted[0] ? 'lose' : tiedAtTop ? 'draw' : 'win';
    return { seat, placement, result };
  });
}

export function checkEnd(state: TuteState): GameEndResult | null {
  if (!isMatchOver(state)) return null;
  return { ranking: rankingFromMatchRoundsWon(state.matchRoundsWon, state.numPlayers) };
}

export function playerView(state: TuteState, seatIndex: number | null): TutePlayerView {
  return {
    numPlayers: state.numPlayers,
    roundsToWin: state.roundsToWin,
    roundNumber: state.roundNumber,
    matchRoundsWon: state.matchRoundsWon,
    hand: seatIndex !== null ? (state.hands[seatIndex] ?? null) : null,
    handCounts: state.hands.map((h) => h.length),
    trumpSuit: state.trumpSuit,
    currentTrick: state.currentTrick,
    leadSeat: state.leadSeat,
    turn: state.turn,
    groupScores: state.groupScores,
    cantedSuits: state.cantedSuits,
    phase: state.phase,
    pendingConfirm: state.pendingConfirm,
    lastRoundSummary: state.lastRoundSummary,
  };
}
