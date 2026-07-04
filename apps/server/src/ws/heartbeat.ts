import type { FastifyInstance } from 'fastify';
import type { Db } from '@tableria/db';
import type { Env } from '../config.js';
import { getUserFromToken } from '../auth/session.js';
import type { AuthedSocket } from '../match/registry.js';

const HEARTBEAT_MS = 30_000;

const sockets = new Set<AuthedSocket>();

export function registerSocket(socket: AuthedSocket): void {
  sockets.add(socket);
  socket.on('pong', () => {
    socket.isAlive = true;
  });
}

export function unregisterSocket(socket: AuthedSocket): void {
  sockets.delete(socket);
}

/** ping/pong cada 30s: cierra sockets muertos y revalida que la sesión siga activa. */
export function startHeartbeat(app: FastifyInstance, db: Db, env: Env): void {
  const interval = setInterval(() => {
    for (const socket of sockets) {
      if (!socket.isAlive) {
        socket.terminate();
        sockets.delete(socket);
        continue;
      }
      socket.isAlive = false;
      socket.ping();
      void getUserFromToken(db, env.SESSION_PEPPER, socket.sessionToken).then((user) => {
        if (!user) socket.close(4401, 'session revoked');
      });
    }
  }, HEARTBEAT_MS);
  interval.unref();

  app.addHook('onClose', (_instance, done) => {
    clearInterval(interval);
    done();
  });
}
