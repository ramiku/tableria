import type { ClientMessage, VoiceRoom } from '@tableria/protocol';
import { matchSocket } from './ws';

type VoiceSignal = Extract<ClientMessage, { type: 'voice.signal' }>['payload']['signal'];

// STUN público de Google — suficiente para la mayoría de redes domésticas. Sin TURN:
// NAT simétrico o firewalls corporativos estrictos podrían no lograr conexión directa
// (mejora futura conocida, no bloqueante para esta primera versión en malla).
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

interface VoiceManagerOptions {
  room: VoiceRoom;
  myUserId: string;
  localStream: MediaStream;
  onRemoteStream(userId: string, stream: MediaStream): void;
  onRemoteStreamRemoved(userId: string): void;
}

export interface VoiceManager {
  syncParticipants(participantIds: string[]): void;
  handleSignal(fromUserId: string, signal: VoiceSignal): Promise<void>;
  close(): void;
}

function sendSignal(room: VoiceRoom, targetUserId: string, signal: VoiceSignal): void {
  matchSocket.send({ type: 'voice.signal', payload: { room, targetUserId, signal } });
}

/**
 * Gestor de la malla WebRTC P2P para una llamada de grupo: una `RTCPeerConnection` por
 * cada participante remoto. Para evitar colisión de ofertas simultáneas (glare) sin la
 * complejidad de "perfect negotiation": regla determinista simple, el userId
 * lexicográficamente menor siempre inicia la oferta hacia el otro.
 */
export function createVoiceManager(options: VoiceManagerOptions): VoiceManager {
  const { room, myUserId, localStream, onRemoteStream, onRemoteStreamRemoved } = options;
  const peers = new Map<string, RTCPeerConnection>();

  function createPeerConnection(remoteUserId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    for (const track of localStream.getTracks()) pc.addTrack(track, localStream);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(room, remoteUserId, { kind: 'ice-candidate', candidate: event.candidate.toJSON() });
      }
    };
    pc.ontrack = (event) => {
      if (event.streams[0]) onRemoteStream(remoteUserId, event.streams[0]);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        peers.delete(remoteUserId);
        onRemoteStreamRemoved(remoteUserId);
      }
    };

    return pc;
  }

  async function connectTo(remoteUserId: string): Promise<void> {
    const pc = createPeerConnection(remoteUserId);
    peers.set(remoteUserId, pc);

    if (myUserId < remoteUserId) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal(room, remoteUserId, { kind: 'offer', sdp: offer.sdp ?? '' });
    }
  }

  return {
    syncParticipants(participantIds) {
      const others = new Set(participantIds.filter((id) => id !== myUserId));

      for (const existingId of peers.keys()) {
        if (!others.has(existingId)) {
          peers.get(existingId)?.close();
          peers.delete(existingId);
          onRemoteStreamRemoved(existingId);
        }
      }

      for (const id of others) {
        if (!peers.has(id)) void connectTo(id);
      }
    },

    async handleSignal(fromUserId, signal) {
      let pc = peers.get(fromUserId);
      if (!pc) {
        pc = createPeerConnection(fromUserId);
        peers.set(fromUserId, pc);
      }

      if (signal.kind === 'offer') {
        await pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal(room, fromUserId, { kind: 'answer', sdp: answer.sdp ?? '' });
      } else if (signal.kind === 'answer') {
        await pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
      } else {
        await pc.addIceCandidate(signal.candidate as RTCIceCandidateInit);
      }
    },

    close() {
      for (const pc of peers.values()) pc.close();
      peers.clear();
    },
  };
}
