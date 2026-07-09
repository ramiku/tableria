export type SpanishSuit = 'oros' | 'copas' | 'espadas' | 'bastos';

interface SpanishCardProps {
  /** Omitido junto con `rank` cuando `back` es true. */
  suit?: SpanishSuit;
  /** 1-9, 10 = sota, 11 = caballo, 12 = rey. */
  rank?: number;
  back?: boolean;
  className?: string;
}

const SHEET_COLS = 12;
const SHEET_ROWS = 5;
const SUIT_ROW: Record<SpanishSuit, number> = { oros: 0, copas: 1, espadas: 2, bastos: 3 };

/**
 * Recorte de la hoja de sprites `/baraja_espanola.png` (2496×1595px — cuadrícula real de
 * 12 columnas × 5 filas, 208×319px por carta): fila = palo (oros/copas/espadas/bastos),
 * columna = valor (1-9, 10=sota, 11=caballo, 12=rey). La 5ª fila trae el reverso en su
 * 2ª columna (el resto de esa fila es fondo negro en la imagen original, sin usar).
 * Compartido por cualquier juego de baraja española (hoy Brisca) — no depende de los
 * tipos de ningún juego en concreto.
 *
 * `background-size`/`background-position` van en porcentaje (no en px) para que el recorte
 * escale con lo que le dé cada juego vía `className` (solo hace falta fijar el ancho —
 * `aspect-ratio` calcula el alto real de la carta sin deformar el dibujo).
 */
export function SpanishCard({ suit, rank, back = false, className = '' }: SpanishCardProps) {
  const row = back || !suit ? 4 : SUIT_ROW[suit];
  const col = back || !rank ? 1 : Math.min(Math.max(rank - 1, 0), SHEET_COLS - 1);

  return (
    <span
      aria-hidden="true"
      className={`inline-block rounded-lg border border-black/10 bg-white shadow-sm ${className}`}
      style={{
        aspectRatio: '208 / 319',
        backgroundImage: "url('/baraja_espanola.png')",
        backgroundSize: `${SHEET_COLS * 100}% ${SHEET_ROWS * 100}%`,
        backgroundPosition: `${(col / (SHEET_COLS - 1)) * 100}% ${(row / (SHEET_ROWS - 1)) * 100}%`,
      }}
    />
  );
}
