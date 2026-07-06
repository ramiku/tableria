import { create } from 'zustand';
import type { ServerMessage, VoiceRoom } from '@tableria/protocol';
import { createVoiceManager, type VoiceManager } from '../lib/webrtc';
import { matchSocket } from '../lib/ws';

export interface VoiceParticipant {
  userId: string;
  username: string;
}

export function sameRoom(a: VoiceRoom, b: VoiceRoom): boolean {
  if (a.kind !== b.kind) return false;
  return a.kind === 'conversation' ? a.conversationId === (b as typeof a).conversationId : a.matchId === (b as typeof a).matchId;
}

interface VoiceState {
  activeRoom: VoiceRoom | null;
  /** Nombre legible de la sala activa (nombre del grupo o de la partida), para el widget global. */
  label: string | null;
  participants: VoiceParticipant[];
  remoteStreams: Record<string, MediaStream>;
  muted: boolean;
  connecting: boolean;
  error: 'mic-denied' | 'unknown' | null;
  joinCall(room: VoiceRoom, myUserId: string, label: string): Promise<void>;
  leaveCall(): void;
  toggleMute(): void;
}

// Vive fuera del store (no serializable / no debe disparar renders por sí mismo).
let manager: VoiceManager | null = null;
let localStream: MediaStream | null = null;

export const useVoiceStore = create<VoiceState>((set, get) => ({
  activeRoom: null,
  label: null,
  participants: [],
  remoteStreams: {},
  muted: false,
  connecting: false,
  error: null,

  async joinCall(room, myUserId, label) {
    if (get().activeRoom) get().leaveCall();
    set({ connecting: true, error: null });

    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      set({ connecting: false, error: 'mic-denied' });
      return;
    }

    manager = createVoiceManager({
      room,
      myUserId,
      localStream,
      onRemoteStream: (userId, stream) =>
        set((s) => ({ remoteStreams: { ...s.remoteStreams, [userId]: stream } })),
      onRemoteStreamRemoved: (userId) =>
        set((s) => {
          const next = { ...s.remoteStreams };
          delete next[userId];
          return { remoteStreams: next };
        }),
    });

    matchSocket.send({ type: 'voice.join', payload: { room } });
    set({ activeRoom: room, label, connecting: false });
  },

  leaveCall() {
    const room = get().activeRoom;
    if (room) matchSocket.send({ type: 'voice.leave', payload: { room } });

    manager?.close();
    manager = null;
    for (const track of localStream?.getTracks() ?? []) track.stop();
    localStream = null;

    set({ activeRoom: null, label: null, participants: [], remoteStreams: {}, muted: false, error: null });
  },

  toggleMute() {
    const next = !get().muted;
    for (const track of localStream?.getAudioTracks() ?? []) track.enabled = !next;
    set({ muted: next });
  },
}));

function handleMessage(message: ServerMessage): void {
  const activeRoom = useVoiceStore.getState().activeRoom;
  if (message.type === 'voice.roster') {
    if (!activeRoom || !sameRoom(message.payload.room, activeRoom)) return;
    useVoiceStore.setState({ participants: message.payload.participants });
    manager?.syncParticipants(message.payload.participants.map((p) => p.userId));
  } else if (message.type === 'voice.signal') {
    if (!activeRoom || !sameRoom(message.payload.room, activeRoom)) return;
    void manager?.handleSignal(message.payload.fromUserId, message.payload.signal);
  }
}

// Mismo patrón que `stores/match.ts`/`stores/presence.ts`: sin este dispose, cada HMR
// de este módulo apilaría un listener más sobre el socket singleton.
const unsubscribe = matchSocket.onMessage(handleMessage);
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unsubscribe();
    useVoiceStore.getState().leaveCall();
  });
}
