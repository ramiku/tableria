import type { FastifyInstance } from 'fastify';
import { and, eq, gt, isNull, or, passwordResets, users, type Db } from '@tableria/db';
import type { Env } from '../config.js';
import { hashPassword, hashToken, randomToken, verifyPassword } from './crypto.js';
import { createSession, getUserFromToken, revokeAllSessions, revokeSession, SESSION_COOKIE } from './session.js';
import { verifyCsrf } from './csrf.js';
import type { Mailer } from './mailer.js';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from './schemas.js';

const AVATAR_PALETTE = ['#2f6fe0', '#1c5c52', '#4a2f6e', '#6e3b2f', '#2f5c6e', '#1d3f72'];

function pickAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]!;
}

function publicUser(u: { id: string; username: string; displayName: string; avatarInitial: string | null; avatarColor: string | null }) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarInitial: u.avatarInitial,
    avatarColor: u.avatarColor,
  };
}

interface AuthDeps {
  db: Db;
  env: Env;
  mailer: Mailer;
}

export async function registerAuthRoutes(app: FastifyInstance, { db, env, mailer }: AuthDeps): Promise<void> {
  const secureCookies = env.NODE_ENV === 'production';
  const sessionCookieOpts = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: secureCookies,
  };

  app.post(
    '/api/auth/register',
    { preHandler: verifyCsrf, config: { rateLimit: { max: 8, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, error: parsed.error.issues[0]?.message ?? 'Datos no válidos' });
      }
      const { username, email, password } = parsed.data;

      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.username, username), eq(users.email, email)))
        .limit(1);
      if (existing.length > 0) {
        return reply.code(409).send({ ok: false, error: 'Ese nick o correo ya está en uso' });
      }

      const passwordHash = await hashPassword(password);
      const avatarColor = pickAvatarColor(username);
      const [user] = await db
        .insert(users)
        .values({
          username,
          email,
          passwordHash,
          displayName: username,
          avatarInitial: username.charAt(0).toUpperCase(),
          avatarColor,
        })
        .returning();
      if (!user) {
        return reply.code(500).send({ ok: false, error: 'No se pudo crear la cuenta' });
      }

      const { token, expiresAt } = await createSession(db, env.SESSION_PEPPER, user.id, {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
      reply.setCookie(SESSION_COOKIE, token, { ...sessionCookieOpts, expires: expiresAt });
      return { ok: true, user: publicUser(user) };
    },
  );

  app.post(
    '/api/auth/login',
    { preHandler: verifyCsrf, config: { rateLimit: { max: 15, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, error: 'Indica tu nick/correo y contraseña' });
      }
      const { identifier, password } = parsed.data;

      const invalid = () => reply.code(401).send({ ok: false, error: 'Credenciales no válidas' });

      const rows = await db
        .select()
        .from(users)
        .where(or(eq(users.username, identifier), eq(users.email, identifier)))
        .limit(1);
      const user = rows[0];
      if (!user || !user.passwordHash) return invalid();

      const valid = await verifyPassword(user.passwordHash, password);
      if (!valid) return invalid();

      const { token, expiresAt } = await createSession(db, env.SESSION_PEPPER, user.id, {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
      reply.setCookie(SESSION_COOKIE, token, { ...sessionCookieOpts, expires: expiresAt });
      return { ok: true, user: publicUser(user) };
    },
  );

  app.post('/api/auth/logout', { preHandler: verifyCsrf }, async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    if (token) await revokeSession(db, env.SESSION_PEPPER, token, 'logout');
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/api/auth/me', async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    const user = token ? await getUserFromToken(db, env.SESSION_PEPPER, token) : null;
    if (!user) return reply.code(401).send({ ok: false, error: 'No autenticado' });
    return { ok: true, user };
  });

  app.post(
    '/api/auth/forgot-password',
    { preHandler: verifyCsrf, config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const parsed = forgotPasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, error: 'Correo no válido' });
      }

      // Respuesta genérica siempre — no revela si el correo existe.
      const genericReply = { ok: true, message: 'Si el correo existe, te hemos enviado un enlace.' };

      const rows = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
      const user = rows[0];
      if (!user) return genericReply;

      const token = randomToken();
      const tokenHash = hashToken(token, env.SESSION_PEPPER);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.insert(passwordResets).values({ userId: user.id, tokenHash, expiresAt });

      const resetUrl = `${env.WEB_ORIGIN}/restablecer?token=${token}`;
      try {
        await mailer.sendPasswordReset(user.email, resetUrl);
      } catch (err) {
        request.log.error({ err }, 'No se pudo enviar el correo de reseteo');
      }

      return genericReply;
    },
  );

  app.post(
    '/api/auth/reset-password',
    { preHandler: verifyCsrf, config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const parsed = resetPasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, error: parsed.error.issues[0]?.message ?? 'Datos no válidos' });
      }
      const { token, password } = parsed.data;
      const tokenHash = hashToken(token, env.SESSION_PEPPER);
      const now = new Date();

      const rows = await db
        .select()
        .from(passwordResets)
        .where(and(eq(passwordResets.tokenHash, tokenHash), isNull(passwordResets.consumedAt), gt(passwordResets.expiresAt, now)))
        .limit(1);
      const reset = rows[0];
      if (!reset) {
        return reply.code(400).send({ ok: false, error: 'El enlace no es válido o ha caducado' });
      }

      const passwordHash = await hashPassword(password);
      await db.update(users).set({ passwordHash, updatedAt: now }).where(eq(users.id, reset.userId));
      await db.update(passwordResets).set({ consumedAt: now }).where(eq(passwordResets.id, reset.id));
      await revokeAllSessions(db, reset.userId, 'password_reset');

      return { ok: true };
    },
  );
}

