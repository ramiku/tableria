import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface RoundEndModalRow {
  key: string | number;
  label: string;
  points: number;
  won: boolean;
}

interface RoundEndModalProps {
  title: string;
  subtitle?: string;
  rows: RoundEndModalRow[];
  /** Contenido extra bajo las filas (p.ej. desglose por categoría en Escoba) — opcional, cada
   * tablero decide si lo necesita. */
  footer?: ReactNode;
  /** Ninguna fila de `rows` ganó la ronda (empate) — se avisa de que se juega otra para desempatar. */
  tie?: boolean;
  /** Etiquetas de los asientos que aún no han confirmado, sin incluir el propio. */
  waitingFor: string[];
  /** El propio asiento ya mandó `continue` — se sustituye el botón por un aviso de espera. */
  confirmed: boolean;
  onContinue: () => void;
}

/**
 * Overlay compartido por Brisca/Tute/Escoba entre rondas o manos: desglose de puntos + botón
 * "Continuar" que todos los asientos deben pulsar antes de repartir la siguiente. Presentacional
 * puro — cada tablero decide qué filas mostrar y cómo etiquetar los asientos (nombres reales no
 * llegan a `BoardProps`, solo asiento/equipo, igual que ya hace el resto del marcador).
 */
export function RoundEndModal({ title, subtitle, rows, footer, tie, waitingFor, confirmed, onContinue }: RoundEndModalProps) {
  const { t } = useTranslation();

  return (
    <div className="tb-modal-in absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-tb-surface/25 p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-tb-border bg-tb-surface/95 p-7 text-center shadow-2xl backdrop-blur-md">
        <div>
          <h2 className="font-display text-lg font-bold text-tb-text">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs font-medium text-tb-muted">{subtitle}</p>}
        </div>

        <div className="flex w-full flex-col gap-1.5">
          {rows.map((row) => (
            <div
              key={row.key}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                row.won ? 'bg-tb-accent-tint font-bold text-tb-accent' : 'bg-tb-surface-2 text-tb-text'
              }`}
            >
              <span>{row.label}</span>
              <span className="tb-nums">+{row.points}</span>
            </div>
          ))}
        </div>

        {footer}

        {tie && <p className="text-xs text-tb-muted">{t('roundEnd.tieNote')}</p>}

        {confirmed ? (
          <p className="flex items-center gap-2 text-xs font-medium text-tb-muted">
            <span className="h-2 w-2 shrink-0 rounded-full bg-tb-accent motion-safe:animate-pulse" />
            {waitingFor.length > 0 ? t('roundEnd.waitingFor', { names: waitingFor.join(', ') }) : t('roundEnd.confirmed')}
          </p>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            className="tb-gradient-cta flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-display text-sm font-extrabold text-white shadow-md shadow-tb-accent/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            {t('roundEnd.continue')}
          </button>
        )}
      </div>
    </div>
  );
}
