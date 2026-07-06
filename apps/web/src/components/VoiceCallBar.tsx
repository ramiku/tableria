import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { VoiceRoom } from '@tableria/protocol';
import { matchSocket } from '../lib/ws';
import { sameRoom, useVoiceStore, type VoiceParticipant } from '../stores/voice';
import { MicIcon } from './icons';

/**
 * Punto de entrada a una llamada de voz (conversación de grupo o partida): botón "Iniciar/Unirse"
 * (pide permiso de micrófono en ese momento, no antes), o un estado breve si ya estás dentro. La
 * llamada en sí vive en `useVoiceStore` y persiste al margen de este componente — los controles
 * (silenciar/colgar) están en `VoiceCallWidget`, que se queda montado en toda la plataforma.
 */
export function VoiceCallBar({ room, label, meId }: { room: VoiceRoom; label: string; meId: string }) {
  const { t } = useTranslation();
  const activeRoom = useVoiceStore((s) => s.activeRoom);
  const participants = useVoiceStore((s) => s.participants);
  const connecting = useVoiceStore((s) => s.connecting);
  const error = useVoiceStore((s) => s.error);
  const joinCall = useVoiceStore((s) => s.joinCall);
  const [preview, setPreview] = useState<VoiceParticipant[]>([]);

  const inThisCall = activeRoom !== null && sameRoom(activeRoom, room);

  useEffect(() => {
    return matchSocket.onMessage((message) => {
      if (message.type !== 'voice.roster' || !sameRoom(message.payload.room, room)) return;
      setPreview(message.payload.participants);
    });
  }, [room]);

  if (inThisCall) {
    return (
      <div className="flex items-center gap-1.5 border-b border-tb-border bg-tb-surface-2 px-4 py-2 text-xs font-semibold text-tb-success">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tb-success" />
        {t('voice.inCall', { count: participants.length })}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 border-b border-tb-border bg-tb-surface-2 px-4 py-2">
      <button
        type="button"
        onClick={() => void joinCall(room, meId, label)}
        disabled={connecting}
        className="flex items-center gap-1.5 rounded-lg border border-tb-border px-3 py-1.5 text-xs font-semibold text-tb-text hover:bg-tb-surface disabled:opacity-50"
      >
        <MicIcon className="h-3.5 w-3.5" />
        {connecting
          ? t('voice.connecting')
          : preview.length > 0
            ? t('voice.joinCallWithCount', { count: preview.length })
            : t('voice.joinCall')}
      </button>
      {error === 'mic-denied' && <p className="text-xs font-medium text-tb-danger">{t('voice.micDenied')}</p>}
    </div>
  );
}
