import type { Db } from '@tableria/db';
import { clientMessageSchema } from '@tableria/protocol';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { SESSION_COOKIE, getUserFromToken } from '../auth/session.js';
import type { Env } from '../config.js';
import type { AuthedSocket } from '../match/registry.js';
import type { MatchService } from '../match/service.js';
import { dispatchClientMessage } from './handlers.js';
import { registerSocket, startHeartbeat, unregisterSocket } from './heartbeat.js';

/**
 * `@fastify/cookie` no siempre corre sus hooks sobre la petición de *upgrade*
 * de un WebSocket igual que sobre una petición HTTP normal — si `request.cookies`
 * viene vacío, caemos a parsear la cabecera `cookie` a mano.
 */
function extractSessionToken(request: FastifyRequest): string | undefined {
  const fromCookies = request.cookies[SESSION_COOKIE];
  if (fromCookies) return fromCookies;

  const raw = request.headers.cookie;
  if (!raw) return undefined;
  const pair = raw
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${SESSION_COOKIE}=`));
  return pair ? decodeURIComponent(pair.slice(SESSION_COOKIE.length + 1)) : undefined;
}

export function registerWsGateway(app: FastifyInstance, db: Db, env: Env, matchService: MatchService): void {
  app.get('/api/ws', { websocket: true }, async (socket, request) => {
    const token = extractSessionToken(request);
    const user = token ? await getUserFromToken(db, env.SESSION_PEPPER, token) : null;
    if (!user || !token) {
      socket.close(4401, 'unauthorized');
      return;
    }

    const authed = socket as unknown as AuthedSocket;
    authed.userId = user.id;
    authed.username = user.username;
    authed.sessionToken = token;
    authed.isAlive = true;
    authed.currentMatchId = null;

    registerSocket(authed);

    socket.on('message', (raw: Buffer) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw.toString());
      } catch {
        return;
      }
      const result = clientMessageSchema.safeParse(parsed);
      if (!result.success) return;
      void dispatchClientMessage(matchService, authed, result.data).catch((err: unknown) => {
        app.log.error({ err }, 'Error despachando mensaje WS');
      });
    });

    socket.on('close', () => {
      unregisterSocket(authed);
      matchService.detachSocket(authed);
    });
  });

  startHeartbeat(app, db, env);
}
