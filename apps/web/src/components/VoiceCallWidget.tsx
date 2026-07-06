import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useChatDock } from '../stores/chatDock';
import { useVoiceStore } from '../stores/voice';
import { GripIcon, MicIcon, MicOffIcon, PhoneOffIcon } from './icons';

const POSITION_STORAGE_KEY = 'tableria:voiceWidgetPosition';
const MARGIN = 12;

interface Position {
  x: number;
  y: number;
}

function loadStoredPosition(): Position | null {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Position>;
    return typeof parsed.x === 'number' && typeof parsed.y === 'number' ? { x: parsed.x, y: parsed.y } : null;
  } catch {
    return null;
  }
}

function clamp(pos: Position, width: number, height: number): Position {
  return {
    x: Math.min(Math.max(pos.x, MARGIN), Math.max(MARGIN, window.innerWidth - width - MARGIN)),
    y: Math.min(Math.max(pos.y, MARGIN), Math.max(MARGIN, window.innerHeight - height - MARGIN)),
  };
}

/**
 * Barra de llamada de voz flotante y persistente: vive montada en el layout raíz (`_app.tsx`),
 * ajena a la ruta activa, así que la llamada sigue conectada y controlable aunque se navegue a
 * otro juego, a los rankings, etc. Solo se pinta mientras hay una llamada activa. Pulsar sobre
 * el nombre lleva de vuelta al origen de la llamada sin colgar; el asa de la izquierda permite
 * arrastrarla a otro punto de la pantalla para que no tape nada importante.
 */
export function VoiceCallWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const openChat = useChatDock((s) => s.openChat);
  const activeRoom = useVoiceStore((s) => s.activeRoom);
  const label = useVoiceStore((s) => s.label);
  const participants = useVoiceStore((s) => s.participants);
  const remoteStreams = useVoiceStore((s) => s.remoteStreams);
  const muted = useVoiceStore((s) => s.muted);
  const leaveCall = useVoiceStore((s) => s.leaveCall);
  const toggleMute = useVoiceStore((s) => s.toggleMute);

  const widgetRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const [position, setPosition] = useState<Position | null>(() => loadStoredPosition());
  const [dragging, setDragging] = useState(false);

  // Si la ventana cambia de tamaño, no dejar la barra fuera de la pantalla.
  useEffect(() => {
    function onResize() {
      const el = widgetRef.current;
      if (!el) return;
      setPosition((prev) => (prev ? clamp(prev, el.offsetWidth, el.offsetHeight) : prev));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function handleGripPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    const el = widgetRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragState.current = { pointerId: e.pointerId, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }

  function handleGripPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragState.current;
    const el = widgetRef.current;
    if (!drag || !el || drag.pointerId !== e.pointerId) return;
    setPosition(clamp({ x: e.clientX - drag.offsetX, y: e.clientY - drag.offsetY }, el.offsetWidth, el.offsetHeight));
  }

  function endDrag(e: ReactPointerEvent<HTMLButtonElement>) {
    if (dragState.current?.pointerId !== e.pointerId) return;
    dragState.current = null;
    setDragging(false);
    setPosition((prev) => {
      if (prev) {
        try {
          localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(prev));
        } catch {
          // localStorage no disponible (modo privado, cuota, etc.) — la posición simplemente no persiste.
        }
      }
      return prev;
    });
  }

  if (!activeRoom) return null;

  function goToSource() {
    if (!activeRoom) return;
    if (activeRoom.kind === 'conversation') {
      openChat(activeRoom.conversationId, label ?? undefined);
    } else {
      void navigate({ to: '/partida/$id', params: { id: activeRoom.matchId } });
    }
  }

  return (
    <div
      ref={widgetRef}
      className={`fixed z-50 flex items-center gap-2 rounded-2xl border border-tb-border bg-tb-surface px-3 py-3 shadow-xl ${dragging ? 'cursor-grabbing' : ''} ${position ? '' : 'bottom-6 left-6'}`}
      style={position ? { left: position.x, top: position.y } : undefined}
    >
      <button
        type="button"
        onPointerDown={handleGripPointerDown}
        onPointerMove={handleGripPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label={t('voice.dragHandle')}
        className="flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-tb-muted hover:text-tb-text active:cursor-grabbing"
      >
        <GripIcon />
      </button>

      <button
        type="button"
        onClick={goToSource}
        className="flex min-w-0 items-center gap-2 text-left"
        aria-label={t('voice.backToSource')}
      >
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-tb-success" />
        <span className="min-w-0">
          <span className="block max-w-40 truncate text-sm font-semibold text-tb-text">{label}</span>
          <span className="block text-xs text-tb-muted">{t('voice.inCall', { count: participants.length })}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? t('voice.unmute') : t('voice.mute')}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-tb-border text-tb-text hover:bg-tb-surface-2"
      >
        {muted ? <MicOffIcon /> : <MicIcon />}
      </button>
      <button
        type="button"
        onClick={leaveCall}
        aria-label={t('voice.leaveCall')}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tb-danger text-white hover:opacity-90"
      >
        <PhoneOffIcon />
      </button>

      {Object.entries(remoteStreams).map(([userId, stream]) => (
        <RemoteAudio key={userId} stream={stream} />
      ))}
    </div>
  );
}

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <audio ref={ref} autoPlay className="hidden" />;
}
