import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { randomToken } from './crypto.js';

export const CSRF_COOKIE = 'tb_csrf';
const CSRF_HEADER = 'x-csrf-token';

/** Cookie doble-submit: legible por JS (no httpOnly) para que el cliente la reenvíe como cabecera. */
export function registerCsrf(app: FastifyInstance, secureCookies: boolean): void {
  app.addHook('onRequest', async (request, reply) => {
    if (!request.cookies[CSRF_COOKIE]) {
      reply.setCookie(CSRF_COOKIE, randomToken(), {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        secure: secureCookies,
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  });
}

/** preHandler para rutas mutantes: exige que la cabecera coincida con la cookie. */
export async function verifyCsrf(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const cookieToken = request.cookies[CSRF_COOKIE];
  const headerToken = request.headers[CSRF_HEADER];
  const valid = typeof headerToken === 'string' && cookieToken === headerToken;
  if (!valid) {
    reply.code(403).send({ ok: false, error: 'csrf_invalid' });
  }
}
