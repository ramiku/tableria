/**
 * Glicko-2 (Mark Glickman) — implementación propia, sin IO, ~80 líneas.
 * Referencia: http://www.glicko.net/glicko/glicko2.pdf
 */

export interface GlickoRating {
  rating: number;
  rd: number;
  vol: number;
}

export interface GlickoOpponentResult {
  rating: number;
  rd: number;
  /** 1 = victoria, 0.5 = empate, 0 = derrota */
  score: number;
}

const SCALE = 173.7178;
// Restringe cuánto puede moverse la volatilidad de un periodo a otro.
const TAU = 0.5;
const CONVERGENCE_EPSILON = 1e-6;

function g(phi: number): number {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}

function expectedScore(mu: number, muOpp: number, phiOpp: number): number {
  return 1 / (1 + Math.exp(-g(phiOpp) * (mu - muOpp)));
}

/** Actualiza el rating de un jugador tras un periodo con 0+ resultados frente a rivales. */
export function updateGlicko(player: GlickoRating, results: GlickoOpponentResult[]): GlickoRating {
  const mu = (player.rating - 1500) / SCALE;
  const phi = player.rd / SCALE;
  const sigma = player.vol;

  if (results.length === 0) {
    // Sin partidas en el periodo: solo crece la incertidumbre (RD), nada más.
    const phiUnrated = Math.sqrt(phi * phi + sigma * sigma);
    return { rating: player.rating, rd: phiUnrated * SCALE, vol: sigma };
  }

  const opponents = results.map((r) => ({
    muOpp: (r.rating - 1500) / SCALE,
    phiOpp: r.rd / SCALE,
    score: r.score,
  }));

  let vInv = 0;
  let deltaSum = 0;
  for (const opp of opponents) {
    const gPhiOpp = g(opp.phiOpp);
    const e = expectedScore(mu, opp.muOpp, opp.phiOpp);
    vInv += gPhiOpp * gPhiOpp * e * (1 - e);
    deltaSum += gPhiOpp * (opp.score - e);
  }
  const v = 1 / vInv;
  const delta = v * deltaSum;

  // Algoritmo de convergencia de Illinois para resolver f(x) = 0 y hallar la nueva volatilidad.
  const a = Math.log(sigma * sigma);
  const f = (x: number): number => {
    const ex = Math.exp(x);
    const num = ex * (delta * delta - phi * phi - v - ex);
    const den = 2 * (phi * phi + v + ex) ** 2;
    return num / den - (x - a) / (TAU * TAU);
  };

  let A = a;
  let B: number;
  if (delta * delta > phi * phi + v) {
    B = Math.log(delta * delta - phi * phi - v);
  } else {
    let k = 1;
    while (f(a - k * TAU) < 0) k += 1;
    B = a - k * TAU;
  }

  let fA = f(A);
  let fB = f(B);
  while (Math.abs(B - A) > CONVERGENCE_EPSILON) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB < 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }
    B = C;
    fB = fC;
  }

  const newSigma = Math.exp(A / 2);
  const phiStar = Math.sqrt(phi * phi + newSigma * newSigma);
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const newMu = mu + newPhi * newPhi * deltaSum;

  return { rating: newMu * SCALE + 1500, rd: newPhi * SCALE, vol: newSigma };
}

export interface RankedPlayer<TId> {
  id: TId;
  /** 1 = primer puesto; empates comparten placement. */
  placement: number;
  rating: GlickoRating;
}

/**
 * Generaliza Glicko-2 (diseñado para 1v1) a un resultado de N jugadores:
 * cada partida se descompone en enfrentamientos por parejas (todos contra
 * todos), con el resultado de cada par derivado de su `placement` relativo.
 * Todas las actualizaciones parten de los ratings PREVIOS a la partida
 * (no se encadenan entre sí dentro del mismo periodo).
 */
export function updateGlickoForRanking<TId>(players: RankedPlayer<TId>[]): Map<TId, GlickoRating> {
  const resultsByPlayer = new Map<TId, GlickoOpponentResult[]>();
  for (const p of players) resultsByPlayer.set(p.id, []);

  for (const a of players) {
    for (const b of players) {
      if (a === b) continue;
      const score = a.placement < b.placement ? 1 : a.placement > b.placement ? 0 : 0.5;
      resultsByPlayer.get(a.id)!.push({ rating: b.rating.rating, rd: b.rating.rd, score });
    }
  }

  const updated = new Map<TId, GlickoRating>();
  for (const p of players) {
    updated.set(p.id, updateGlicko(p.rating, resultsByPlayer.get(p.id)!));
  }
  return updated;
}
