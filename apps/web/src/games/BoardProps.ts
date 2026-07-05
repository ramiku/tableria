/** Contrato común de los tableros por juego, montados desde `_app.partida.$id.tsx` según `gameId`. */
export interface BoardProps {
  matchId: string;
  /** `matchState.seq` — cambia en cada movimiento, útil para resetear selección local. */
  seq: number;
  mySeat: number | null;
  myTurn: boolean;
  view: unknown;
}
