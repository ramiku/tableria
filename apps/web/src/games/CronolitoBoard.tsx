import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { CronolitoPlayerView } from '@tableria/games';
import { matchSocket } from '../lib/ws';
import { ArrowLeftIcon, ArrowRightIcon } from '../components/icons';
import type { BoardProps } from './BoardProps';

/**
 * Paleta fija "retro-futurista", deliberadamente independiente del claro/oscuro del resto de la
 * app — el Cronolito es un artefacto de otra época (o de ninguna), no debería mimetizarse con el
 * tema de turno. Variables CSS locales en el wrapper, referenciadas por el resto del árbol.
 */
const THEME_VARS = {
  '--cro-bg': '#0b0e1f',
  '--cro-surface': '#131a36',
  '--cro-border': '#2a3a72',
  '--cro-accent': '#5ef4e0',
  '--cro-accent-dim': '#2a6e66',
  '--cro-danger': '#ff3d9a',
  '--cro-danger-dim': '#6e2648',
  '--cro-text': '#e8ecff',
  '--cro-muted': '#7c88b8',
} as CSSProperties;

function EnergyCores({ lives, max = 3 }: { lives: number; max?: number }) {
  return (
    <div className="flex gap-1" aria-label={`${lives} de ${max} estabilizadores temporales`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className="h-3 w-3 rounded-full border"
          style={
            i < lives
              ? {
                  background: 'var(--cro-accent)',
                  borderColor: 'var(--cro-accent)',
                  boxShadow: '0 0 6px var(--cro-accent)',
                }
              : { background: 'transparent', borderColor: 'var(--cro-danger-dim)' }
          }
        />
      ))}
    </div>
  );
}

export function CronolitoBoard({ matchId, mySeat, myTurn, view: rawView, players }: BoardProps) {
  const { t } = useTranslation();
  const view = rawView as CronolitoPlayerView | undefined;
  const [showBriefing, setShowBriefing] = useState(true);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  // Insinúa que hay más historia fuera de la vista con un desvanecido en el borde — solo se
  // muestra en el lado donde de verdad queda algo por descubrir, nunca en un extremo ya agotado.
  const [edgeFade, setEdgeFade] = useState({ left: false, right: false });

  const updateEdgeFade = useCallback(() => {
    const el = timelineScrollRef.current;
    if (!el) return;
    setEdgeFade({
      left: el.scrollLeft > 4,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateEdgeFade();
    window.addEventListener('resize', updateEdgeFade);
    return () => window.removeEventListener('resize', updateEdgeFade);
  }, [updateEdgeFade, view?.timeline.length]);

  if (!view) return null;

  function handlePlace(position: number) {
    if (!myTurn) return;
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { position } } });
  }

  const slotLabel = (position: number) => {
    const before = view.timeline[position - 1];
    const after = view.timeline[position];
    if (!before) return t('cronolito.slotStart');
    if (!after) return t('cronolito.slotEnd');
    return t('cronolito.slotBetween', { before: before.titulo, after: after.titulo });
  };

  return (
    // `min-w-0` es necesario porque este tablero vive dentro de columnas flex/grid (la página de
    // partida, a veces el zoom): sin él, el contenido intrínsecamente ancho de la fila de eventos
    // de más abajo empujaría el ancho de TODO este contenedor en vez de quedarse contenido en su
    // propio scroll — arrastrando con él la cabecera y la carta actual, que deben quedarse fijas.
    <div
      className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border p-5"
      style={{ ...THEME_VARS, background: 'var(--cro-bg)', borderColor: 'var(--cro-border)', color: 'var(--cro-text)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          className="font-display text-sm font-extrabold uppercase tracking-[0.2em]"
          style={{ color: 'var(--cro-accent)', textShadow: '0 0 10px var(--cro-accent-dim)' }}
        >
          🚀 {t('cronolito.title')}
        </h2>
        <button
          type="button"
          onClick={() => setShowBriefing((v) => !v)}
          className="rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors"
          style={{ borderColor: 'var(--cro-border)', color: 'var(--cro-muted)' }}
        >
          {showBriefing ? t('cronolito.hideBriefing') : t('cronolito.showBriefing')}
        </button>
      </div>

      {showBriefing && (
        <div
          className="tb-modal-in rounded-xl border p-4 text-sm leading-relaxed"
          style={{ borderColor: 'var(--cro-border)', background: 'var(--cro-surface)', color: 'var(--cro-muted)' }}
        >
          <p className="mb-2" style={{ color: 'var(--cro-text)' }}>
            {t('cronolito.story1')}
          </p>
          <p className="mb-2">{t('cronolito.story2')}</p>
          <p>{t('cronolito.story3')}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {view.lives.map((lives, seat) => (
          <div
            key={seat}
            className="flex items-center gap-2 rounded-full border px-3 py-1.5"
            style={{
              borderColor: seat === view.turn ? 'var(--cro-accent)' : 'var(--cro-border)',
              background: 'var(--cro-surface)',
            }}
          >
            <span className="text-xs font-semibold uppercase tracking-wide">
              {seat === mySeat ? t('cronolito.you') : (players.find((p) => p.seat === seat)?.username ?? t('cronolito.seat', { n: seat + 1 }))}
            </span>
            <EnergyCores lives={lives} />
          </div>
        ))}
        <span
          className="tb-nums rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
          style={{ borderColor: 'var(--cro-border)', color: 'var(--cro-muted)' }}
        >
          {t('cronolito.deckCount', { n: view.deckCount })}
        </span>
      </div>

      {view.lastResolution && (
        <p
          key={`${view.lastResolution.titulo}-${view.lastResolution.anio}-${view.lastResolution.correct}`}
          className="tb-modal-in rounded-lg border px-4 py-2 text-center text-sm font-semibold"
          style={
            view.lastResolution.correct
              ? { borderColor: 'var(--cro-accent)', color: 'var(--cro-accent)', background: 'var(--cro-surface)' }
              : { borderColor: 'var(--cro-danger)', color: 'var(--cro-danger)', background: 'var(--cro-surface)' }
          }
        >
          {view.lastResolution.correct
            ? t('cronolito.resultCorrect', { anio: formatYear(view.lastResolution.anio) })
            : view.lastResolution.timedOut
              ? t('cronolito.resultTimeout', { anio: formatYear(view.lastResolution.anio) })
              : t('cronolito.resultParadox', { anio: formatYear(view.lastResolution.anio) })}
        </p>
      )}

      {view.currentCardTitle && (
        <div className="flex justify-center">
          <div
            className="max-w-md rounded-xl border-2 px-5 py-4 text-center"
            style={{
              borderColor: 'var(--cro-accent)',
              background: 'var(--cro-surface)',
              boxShadow: '0 0 16px var(--cro-accent-dim)',
            }}
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--cro-muted)' }}>
              {t('cronolito.currentCard')}
            </p>
            <p className="font-display text-base font-bold">{view.currentCardTitle}</p>
            <p className="mt-2 text-xs" style={{ color: 'var(--cro-muted)' }}>
              {myTurn ? t('cronolito.yourTurnHint') : t('cronolito.waitingHint')}
            </p>
          </div>
        </div>
      )}

      {/* Única zona con scroll horizontal del tablero: cabecera, marcadores y carta actual (arriba)
          quedan siempre fijos en pantalla, se navegue lo que se navegue por el historial. El
          `overflow-hidden` del envoltorio recorta los desvanecidos de borde a las mismas esquinas
          redondeadas del recuadro, en vez de sobresalir en forma de rectángulo. */}
      <div className="relative overflow-hidden rounded-xl">
        <div
          ref={timelineScrollRef}
          onScroll={updateEdgeFade}
          className="tb-cro-scrollbar w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-xl border p-3"
          style={{ borderColor: 'var(--cro-border)', scrollSnapType: 'x proximity' }}
        >
          <div
            className="flex min-w-max items-stretch gap-0.5"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--cro-accent-dim) 8%, var(--cro-accent-dim) 92%, transparent)',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: '100% 1px',
            }}
          >
            <button
              type="button"
              onClick={() => handlePlace(0)}
              disabled={!myTurn}
              aria-label={slotLabel(0)}
              className="w-4 shrink-0 rounded-full transition-colors disabled:cursor-default"
              style={{ background: myTurn ? 'var(--cro-accent-dim)' : 'transparent' }}
            />
            {view.timeline.map((event, i) => (
              <div
                key={event.id}
                className="flex items-stretch gap-0.5"
                style={{ scrollSnapAlign: 'center' }}
              >
                <div
                  className="flex w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-3 text-center"
                  style={{ borderColor: 'var(--cro-border)', background: 'var(--cro-surface)' }}
                >
                  <span className="tb-nums text-lg font-extrabold" style={{ color: 'var(--cro-accent)' }}>
                    {formatYear(event.anio)}
                  </span>
                  <span className="text-[11px] leading-tight" style={{ color: 'var(--cro-muted)' }}>
                    {event.titulo}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlace(i + 1)}
                  disabled={!myTurn}
                  aria-label={slotLabel(i + 1)}
                  className="w-4 shrink-0 rounded-full transition-colors disabled:cursor-default"
                  style={{ background: myTurn ? 'var(--cro-accent-dim)' : 'transparent' }}
                />
              </div>
            ))}
          </div>
        </div>

        {edgeFade.left && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-start pl-1"
            style={{ background: 'linear-gradient(to right, var(--cro-bg), transparent)' }}
          >
            <ArrowLeftIcon className="h-3.5 w-3.5 motion-safe:animate-pulse" style={{ color: 'var(--cro-accent)' }} />
          </div>
        )}
        {edgeFade.right && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-end pr-1"
            style={{ background: 'linear-gradient(to left, var(--cro-bg), transparent)' }}
          >
            <ArrowRightIcon className="h-3.5 w-3.5 motion-safe:animate-pulse" style={{ color: 'var(--cro-accent)' }} />
          </div>
        )}
      </div>
    </div>
  );
}

function formatYear(anio: number): string {
  return anio < 0 ? `${Math.abs(anio)} a.C.` : `${anio} d.C.`;
}
