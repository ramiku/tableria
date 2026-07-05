import type { FastifyInstance } from 'fastify';
import { and, eq, gt, isNull, magicLinkTokens, or, passwordResets, twoFactorBackupCodes, users, type Db } from '@tableria/db';
import type { Env } from '../config.js';
import { decryptSecret, encryptSecret, hashPassword, hashToken, randomToken, verifyPassword } from './crypto.js';
import { createSession, getUserFromToken, revokeAllSessions, revokeSession, SESSION_COOKIE } from './session.js';
import { verifyCsrf } from './csrf.js';
import type { Mailer } from './mailer.js';
import {
  forgotPasswordSchema,
  loginSchema,
  magicLinkConsumeSchema,
  magicLinkRequestSchema,
  registerSchema,
  resetPasswordSchema,
  twoFactorDisableSchema,
  twoFactorEnableSchema,
  twoFactorVerifySchema,
} from './schemas.js';
import { generateBackupCodes, generateTotpSetup, verifyTotpCode } from './totp.js';
import {
  createTrustedDevice,
  isTrustedDevice,
  listTrustedDevices,
  revokeAllTrustedDevices,
  revokeTrustedDevice,
  TRUSTED_DEVICE_COOKIE,
} from './trustedDevices.js';
import { createChallenge, invalidateChallenge, peekChallenge } from './twoFactorChallenges.js';

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
  const trustedDeviceCookieOpts = {
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

      const trustedToken = request.cookies[TRUSTED_DEVICE_COOKIE];
      const isTrusted = user.totpEnabledAt && trustedToken ? await isTrustedDevice(db, env.SESSION_PEPPER, trustedToken, user.id) : false;

      if (user.totpEnabledAt && !isTrusted) {
        const challengeToken = createChallenge(user.id);
        return { ok: true, requiresTwoFactor: true as const, challengeToken };
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
    '/api/auth/2fa/verify',
    { preHandler: verifyCsrf, config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const parsed = twoFactorVerifySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, error: 'Datos no válidos' });
      }
      const { challengeToken, code, trustDevice } = parsed.data;

      const userId = peekChallenge(challengeToken);
      if (!userId) {
        return reply.code(400).send({ ok: false, error: 'El reto ha caducado, vuelve a iniciar sesión' });
      }

      const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const user = rows[0];
      if (!user?.totpSecret) {
        return reply.code(400).send({ ok: false, error: 'Reto no válido' });
      }

      const secretBase32 = decryptSecret(user.totpSecret, env.ENCRYPTION_KEY);
      let validCode = verifyTotpCode(secretBase32, code, user.username);

      if (!validCode) {
        const codeHash = hashToken(code.trim().toUpperCase(), env.SESSION_PEPPER);
        const backupRows = await db
          .select()
          .from(twoFactorBackupCodes)
          .where(
            and(
              eq(twoFactorBackupCodes.userId, userId),
              eq(twoFactorBackupCodes.codeHash, codeHash),
              isNull(twoFactorBackupCodes.usedAt),
            ),
          )
          .limit(1);
        const backupCode = backupRows[0];
        if (backupCode) {
          await db.update(twoFactorBackupCodes).set({ usedAt: new Date() }).where(eq(twoFactorBackupCodes.id, backupCode.id));
          validCode = true;
        }
      }

      if (!validCode) {
        return reply.code(400).send({ ok: false, error: 'Código no válido' });
      }

      invalidateChallenge(challengeToken);

      const { token, expiresAt } = await createSession(db, env.SESSION_PEPPER, userId, {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
      reply.setCookie(SESSION_COOKIE, token, { ...sessionCookieOpts, expires: expiresAt });

      if (trustDevice) {
        const device = await createTrustedDevice(db, env.SESSION_PEPPER, userId, request.headers['user-agent']);
        reply.setCookie(TRUSTED_DEVICE_COOKIE, device.token, { ...trustedDeviceCookieOpts, expires: device.expiresAt });
      }

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

  app.post('/api/auth/2fa/setup', { preHandler: verifyCsrf }, async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    const sessionUser = token ? await getUserFromToken(db, env.SESSION_PEPPER, token) : null;
    if (!sessionUser) return reply.code(401).send({ ok: false, error: 'No autenticado' });

    const { secretBase32, otpauthUri, qrDataUrl } = await generateTotpSetup(sessionUser.username);
    await db
      .update(users)
      .set({ totpSecret: encryptSecret(secretBase32, env.ENCRYPTION_KEY) })
      .where(eq(users.id, sessionUser.id));

    return { ok: true, secret: secretBase32, otpauthUri, qrDataUrl };
  });

  app.post(
    '/api/auth/2fa/enable',
    { preHandler: verifyCsrf, config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const token = request.cookies[SESSION_COOKIE];
      const sessionUser = token ? await getUserFromToken(db, env.SESSION_PEPPER, token) : null;
      if (!sessionUser) return reply.code(401).send({ ok: false, error: 'No autenticado' });

      const parsed = twoFactorEnableSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ ok: false, error: 'Código no válido' });

      const rows = await db.select({ totpSecret: users.totpSecret }).from(users).where(eq(users.id, sessionUser.id)).limit(1);
      const pendingSecret = rows[0]?.totpSecret;
      if (!pendingSecret) {
        return reply.code(400).send({ ok: false, error: 'Primero genera un código QR desde /2fa/setup' });
      }

      const secretBase32 = decryptSecret(pendingSecret, env.ENCRYPTION_KEY);
      if (!verifyTotpCode(secretBase32, parsed.data.code, sessionUser.username)) {
        return reply.code(400).send({ ok: false, error: 'Código incorrecto' });
      }

      await db.update(users).set({ totpEnabledAt: new Date() }).where(eq(users.id, sessionUser.id));

      const plainCodes = generateBackupCodes();
      await db.delete(twoFactorBackupCodes).where(eq(twoFactorBackupCodes.userId, sessionUser.id));
      await db
        .insert(twoFactorBackupCodes)
        .values(plainCodes.map((code) => ({ userId: sessionUser.id, codeHash: hashToken(code, env.SESSION_PEPPER) })));

      return { ok: true, backupCodes: plainCodes };
    },
  );

  app.post('/api/auth/2fa/disable', { preHandler: verifyCsrf }, async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    const sessionUser = token ? await getUserFromToken(db, env.SESSION_PEPPER, token) : null;
    if (!sessionUser) return reply.code(401).send({ ok: false, error: 'No autenticado' });

    const parsed = twoFactorDisableSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: 'Indica tu contraseña' });

    const rows = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
    const user = rows[0];
    if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, parsed.data.password))) {
      return reply.code(401).send({ ok: false, error: 'Contraseña incorrecta' });
    }

    await db.update(users).set({ totpSecret: null, totpEnabledAt: null }).where(eq(users.id, sessionUser.id));
    await db.delete(twoFactorBackupCodes).where(eq(twoFactorBackupCodes.userId, sessionUser.id));
    return { ok: true };
  });

  app.get('/api/auth/trusted-devices', async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    const sessionUser = token ? await getUserFromToken(db, env.SESSION_PEPPER, token) : null;
    if (!sessionUser) return reply.code(401).send({ ok: false, error: 'No autenticado' });

    const devices = await listTrustedDevices(db, sessionUser.id);
    return { ok: true, devices };
  });

  app.delete('/api/auth/trusted-devices/:id', { preHandler: verifyCsrf }, async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    const sessionUser = token ? await getUserFromToken(db, env.SESSION_PEPPER, token) : null;
    if (!sessionUser) return reply.code(401).send({ ok: false, error: 'No autenticado' });

    const { id } = request.params as { id: string };
    await revokeTrustedDevice(db, sessionUser.id, id);
    return { ok: true };
  });

  app.delete('/api/auth/trusted-devices', { preHandler: verifyCsrf }, async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    const sessionUser = token ? await getUserFromToken(db, env.SESSION_PEPPER, token) : null;
    if (!sessionUser) return reply.code(401).send({ ok: false, error: 'No autenticado' });

    await revokeAllTrustedDevices(db, sessionUser.id);
    reply.clearCookie(TRUSTED_DEVICE_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.post(
    '/api/auth/magic-link/request',
    { preHandler: verifyCsrf, config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const parsed = magicLinkRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, error: 'Indica tu nick o correo' });
      }

      // Respuesta genérica siempre — no revela si la cuenta existe (mismo principio que forgot-password).
      const genericReply = { ok: true, message: 'Si la cuenta existe, te hemos enviado un enlace.' };

      const rows = await db
        .select()
        .from(users)
        .where(or(eq(users.username, parsed.data.identifier), eq(users.email, parsed.data.identifier)))
        .limit(1);
      const user = rows[0];
      if (!user) return genericReply;

      const token = randomToken();
      const tokenHash = hashToken(token, env.SESSION_PEPPER);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await db.insert(magicLinkTokens).values({ userId: user.id, tokenHash, expiresAt });

      const magicUrl = `${env.WEB_ORIGIN}/entrar?token=${token}`;
      try {
        await mailer.sendMagicLink(user.email, magicUrl);
      } catch (err) {
        request.log.error({ err }, 'No se pudo enviar el enlace mágico');
      }

      return genericReply;
    },
  );

  app.post(
    '/api/auth/magic-link/consume',
    { preHandler: verifyCsrf, config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const parsed = magicLinkConsumeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, error: 'Enlace no válido' });
      }

      const tokenHash = hashToken(parsed.data.token, env.SESSION_PEPPER);
      const now = new Date();
      const rows = await db
        .select()
        .from(magicLinkTokens)
        .where(and(eq(magicLinkTokens.tokenHash, tokenHash), isNull(magicLinkTokens.consumedAt), gt(magicLinkTokens.expiresAt, now)))
        .limit(1);
      const magicLink = rows[0];
      if (!magicLink) {
        return reply.code(400).send({ ok: false, error: 'El enlace no es válido o ha caducado' });
      }

      const userRows = await db.select().from(users).where(eq(users.id, magicLink.userId)).limit(1);
      const user = userRows[0];
      if (!user) {
        return reply.code(400).send({ ok: false, error: 'El enlace no es válido o ha caducado' });
      }

      await db.update(magicLinkTokens).set({ consumedAt: now }).where(eq(magicLinkTokens.id, magicLink.id));

      // Un enlace mágico es un factor de posesión suficientemente fuerte (acceso al correo):
      // se salta el reto de 2FA aunque esté activo, igual que hacen muchos proveedores.
      const { token: sessionToken, expiresAt } = await createSession(db, env.SESSION_PEPPER, user.id, {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
      reply.setCookie(SESSION_COOKIE, sessionToken, { ...sessionCookieOpts, expires: expiresAt });
      return { ok: true, user: publicUser(user) };
    },
  );

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

