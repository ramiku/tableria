# Tableria v2 — Reescritura full-stack TypeScript

## Context

Tableria es una plataforma de juegos de mesa online (objetivo: funcionalidad tipo boardgamearena.com, pero más cómoda y moderna). La implementación actual en `c:\xampp\htdocs\tableria` es PHP 8.1 procedural + MariaDB (XAMPP) + SPA JS vanilla + 2 servidores Node WS (`chat-server.js` :8080, `game-server.js` :8081). Tras explorar todo el código, el usuario ha decidido una **reescritura completa full-stack TypeScript**, priorizando a la vez: seguridad/estabilidad, motor de juego genérico + más juegos, funciones sociales/competitivas (ELO, torneos, espectadores) y UX moderna (URLs reales, i18n, a11y). Horizonte: prototipo local que evoluciona a producción (dominio `tableria.app`).

### Diagnóstico del código actual (resultado de la exploración)

**Valioso, a portar conceptualmente:**
- Esquema MariaDB de 22 tablas bien diseñado ([includes/db/schema.sql](c:\xampp\htdocs\tableria\includes\db\schema.sql) + [auth_schema.sql](c:\xampp\htdocs\tableria\includes\db\auth_schema.sql)): users, user_sessions (solo hash SHA-256), friendships, games/game_mods/game_content, rooms/room_players/room_moves, conversations/messages, activity_feed, y capa auth completa (2FA TOTP+backup+trusted devices, OAuth ×4, magic links, lockout, audit_log, AES-256-GCM).
- Flujo de partida probado ([includes/lobby.php](c:\xampp\htdocs\tableria\includes\lobby.php), [server/game-server.js](c:\xampp\htdocs\tableria\server\game-server.js)): crear mesa → código → ready-check 20s → in_game → movimientos con transacción `FOR UPDATE` → fin/claim por timeout → broadcast WS.
- Un juego funcional (tres-en-raya) con motor de reglas server-side.
- Branding: "Tableria", tipografías Manrope + Inter, prefijo CSS `tb-`, layout 3 paneles (leftRail nav+amigos / center / rightRail actividad) + chat dock flotante. Todo en español.

**Defectos que la reescritura corrige estructuralmente:**
- Seguridad: credenciales BD hardcodeadas en repo (`includes/db/config.php` y `server/db.js`), clave AES en el código, API interna PHP acepta `userId` del body sin verificación (bypass de auth), el WS no valida expiración/revocación de sesión, `dev_login` y `DEV_BYPASS`, IP spoofeable en rate-limit, ENUMs desincronizados que rompen silenciosamente el rate-limit por identificador y la auditoría.
- Funcional: lobby limitado a exactamente 2 jugadores; DMs no persisten (tabla `messages` sin escribir); `user_game_stats` nunca se actualiza; sin ELO/leaderboards/torneos; estado de partida solo en memoria del proceso WS (se pierde al reiniciar); sin router por URL; sin i18n; a11y parcial; cache-busting manual `?v=4`; god-modules (`gamePage.js` 598 líneas, `actions.js` 456); dos sistemas de estado en paralelo (store vs mutación directa en chat).
- Higiene: no es repo git; basura en raíz (`login.html`, `login-resp.html`, `sid-*.cookies` con tokens, `*.tmp`, `last-room.json`); `node_modules` en disco; `storage/emails.log` con magic-links activos; README desactualizado (referencia una carpeta `project/` que ya no existe).

### Decisiones del usuario
1. **Reescritura completa full-stack TS** (el PHP pasa a `legacy/` como referencia durante la transición).
2. **PostgreSQL 17 vía Docker Desktop** (no MariaDB).
3. Juegos (además de portar tres-en-raya), en este orden: **Conecta 4** y **juego de cartas con info oculta** (validan el motor), luego **Reversi/Othello** y un **party game simultáneo 3-8 jugadores**.

---

## Stack elegido

Decisión central: **un único proceso Node persistente** que sirve API HTTP + WebSocket + SPA compilada (los timers de turno, estado caliente y scheduler necesitan proceso de larga vida; un meta-framework serverless pelea contra eso y recrearía el problema actual de procesos descoordinados).

| Capa | Elección |
|---|---|
| Monorepo | pnpm workspaces + Turborepo (`pnpm@10`, `turbo@^2.5`) |
| Lenguaje | TypeScript `^5.9` strict + `noUncheckedIndexedAccess` |
| Backend | Fastify `^5` + `@fastify/websocket` + `@fastify/cookie` + `@fastify/rate-limit` + `@fastify/static` — WS y HTTP en el mismo puerto |
| API tipada | tRPC v11 (`@trpc/server`, `@trpc/react-query`) para CRUD; WS propio para partida/chat/presencia |
| BD | PostgreSQL 17 (docker-compose) — JSONB, DDL transaccional, `FOR UPDATE SKIP LOCKED` |
| ORM | Drizzle (`drizzle-orm@^0.44`, `drizzle-kit@^0.31`, driver `postgres@^3.4`) — migraciones SQL versionadas |
| Tiempo real | `ws@^8.18` + protocolo propio tipado con Zod (`{type, seq, payload}`, heartbeat 30s, resume por `lastSeq`) |
| Auth | **Lógica propia portada** (no Auth.js/Lucia): `@node-rs/argon2` (argon2id), `arctic@^3` (OAuth discord/twitch/google/github), `otpauth@^9` (TOTP), `@oslojs/crypto` |
| Validación | Zod `^4.1` — única fuente de verdad: DTOs, mensajes WS, movimientos, config de entorno |
| Frontend | React 19 + Vite `^7` |
| Router | TanStack Router `^1` — URLs reales type-safe: `/juegos/$slug`, `/sala/$code`, `/partida/$id`, `/perfil/$username`, `/rankings`, `/torneos` |
| Estado | TanStack Query `^5` (datos servidor) + Zustand `^5` (estado empujado por WS) |
| Estilos | Tailwind CSS 4 + Radix primitives — tokens `tb-` y Manrope+Inter portados como tema |
| i18n | i18next + react-i18next — `es` por defecto, `en` desde día 1, claves desde M0 |
| Testing | Vitest `^3.2` (motor/auth) + Playwright (E2E) + `fastify.inject()` |
| Logs | pino `^9` |
| Email | Nodemailer + MailHog en dev → Resend en prod |
| Rating | Glicko-2 (mejor que ELO con pocas partidas; ~80 líneas propias o lib `glicko2`) |

**Motor de juego: propio, inspirado en boardgame.io pero sin usarlo** (mantenimiento estancado, trae storage/auth/transport propios que chocan con nuestro diseño). Se copian sus ideas: reducer puro, `playerView` para info oculta, RNG determinista con seed persistida. ~600 líneas de TS puro sin IO, 100% unit-testeable.

## Arquitectura del motor de juego (`@tableria/engine`)

```ts
interface GameDefinition<S, M> {
  id: string; minPlayers: number; maxPlayers: number;
  moveSchema: z.ZodType<M>;
  setup(ctx: { numPlayers: number; rng: Rng; options?: Record<string, unknown> }): S;
  activePlayers(state: S): number[];              // array ⇒ turnos simultáneos soportados
  validateMove(state: S, move: M, ctx: MoveCtx): { ok: true } | { ok: false; code: string };
  applyMove(state: S, move: M, ctx: MoveCtx): S;  // reducer PURO: sin IO/Date/Math.random
  checkEnd(state: S): GameEndResult | null;       // { ranking: PlayerRank[] } — N jugadores, no solo win/lose/draw
  playerView(state: S, playerIndex: number | null): unknown;  // null = espectador
  onTurnTimeout?(state: S, playerIndex: number): TimeoutAction<M>;
  ui: { defaultTurnSeconds?: number; supportsRealtime: boolean };
}
```

- **State machine de sala**: `waiting → starting(ready-check 20s) → in_game → finished | cancelled | abandoned` (hereda el diseño probado del PHP).
- **Pipeline de movimiento**: WS autenticado (sesión revalidada contra BD) → `moveSchema.parse` → transacción con `FOR UPDATE` sobre la sala → validar/aplicar/checkEnd → INSERT `match_moves` con `UNIQUE(match_id, seq)` → snapshot cada 20 moves → si fin: resultados + stats + rating **en la misma transacción** → broadcast de `playerView(state, i)` por asiento y `playerView(state, null)` a espectadores.
- **Persistencia**: event sourcing (`match_moves`) + snapshots (`matches.state_snapshot JSONB` + `snapshot_seq`). Rehidratar = snapshot + replay. Un restart del servidor no pierde ninguna partida. Caché caliente `Map<matchId, MatchRuntime>` con TTL.
- **Timers restart-safe**: `matches.turn_deadline_at` en BD; scheduler con `setTimeout` para partidas calientes y recuperación al arrancar vía `SELECT … WHERE turn_deadline_at < now() AND state='in_game' FOR UPDATE SKIP LOCKED`. Al expirar: `onTurnTimeout` (forfeit por defecto — sustituye el "claim" manual actual).
- **Reconexión**: `match.resume {matchId, lastSeq}` → vista completa + seq. Grace period 60s antes de marcar `left`.
- **Espectadores**: `match.watch` → vista pública + chat de mesa; fila en `match_spectators`.
- **RNG**: seed + contador persistidos con el snapshot → mazos barajados seguros en servidor y replay reproducible.

## Modelo de datos (Postgres + Drizzle)

IDs `uuid v7`, JSONB, `citext` para username/email.

- **Portadas casi tal cual**: `users`, `sessions` (hash SHA-256 + `revoked_at`), `friendships`, `game_categories`, `games`, `game_content`, `conversations`, `conversation_members`, `messages`, `activity_feed`, y toda la capa auth (`email_verifications`, `password_resets`, `magic_link_tokens`, `login_attempts`, `two_factor_backup_codes`, `user_oauth_providers`, `audit_log`, `trusted_devices`).
- **Rediseñadas**: `matches` (antes rooms: + `state_snapshot`, `snapshot_seq`, `rng_seed`, `turn_deadline_at`, `rated`, `tournament_match_id`, `options JSONB`, `max_players` real N); `match_players` (+ `seat`, `placement 1..N`, `rating_before/after`, `disconnected_at`); `match_moves` (`UNIQUE(match_id, seq)`); `match_spectators`.
- **Nuevas — competición**: `seasons`; `user_game_ratings` (PK user+game+season, Glicko-2: rating/rd/vol, W/L/D, peak) con `INDEX (game_id, season_id, rating DESC)` para leaderboards; `rating_history`; `user_game_stats` ahora sí escrita en la tx de fin de partida.
- **Nuevas — torneos**: `tournaments` (format: single_elim/double_elim/swiss/round_robin; state: draft/registration/running/finished/cancelled; config JSONB), `tournament_participants`, `tournament_rounds`, `tournament_matches`. Runner que reacciona a "match finished" → avanza bracket / pairings suizos → crea matches automáticamente.
- **Nueva**: `notifications (user_id, type, payload JSONB, read_at)`.

## Estructura del monorepo

```
tableria/                       # git init en la raíz actual
├─ package.json  pnpm-workspace.yaml  turbo.json  .env.example  .gitignore
├─ docker-compose.yml           # postgres:17 + mailhog
├─ apps/
│  ├─ server/src/               # Fastify: UN proceso HTTP+tRPC+WS+workers
│  │   ├─ index.ts  config.ts   # config = Zod.parse(process.env), aborta si falta algo
│  │   ├─ auth/  trpc/routers/  ws/  match/  social/  ratings/  tournaments/  notifications/  email/
│  └─ web/src/                  # Vite + React 19
│      ├─ routes/               # TanStack Router file-based
│      ├─ features/  games/  ws/  i18n/  styles/
├─ packages/
│  ├─ db/                       # schema Drizzle + migrations/ + seed.ts
│  ├─ engine/                   # motor puro, cero IO
│  ├─ games/                    # tres-en-raya/, conecta-cuatro/, <cartas>/, reversi/, <party>/
│  ├─ protocol/                 # Zod: mensajes WS, DTOs, errores tipados
│  └─ config/                   # tsconfig/eslint compartidos
├─ e2e/                         # Playwright
└─ legacy/                      # todo el PHP/JS actual (referencia hasta M4)
```

Regla de dependencias: `games → engine → protocol`; `server → db + games`; `web → protocol + games` (solo tipos/UI). La lógica de juego nunca importa IO.

## Roadmap por fases (cada una termina demostrable)

**M0 — Esqueleto (S).** git init + limpieza + `legacy/`; monorepo pnpm+turbo; docker-compose Postgres 17 + MailHog; `@tableria/db` con esquema núcleo y primera migración; Fastify `/health`; config Zod por entorno; shell Vite con router y layout 3 paneles (tokens `tb-`, Manrope+Inter); i18n inicializado; CI GitHub Actions (lint+typecheck+vitest).
*Demo: la app arranca y navega entre rutas con URLs reales.*

**M1 — Auth + catálogo (M).** Registro/login argon2id, sesiones opacas + cookie `tb_sid`, CSRF, verificación email (MailHog), lockout, anti-enumeración, rate-limit; página de cuenta; catálogo con ficha de juego (tabs Jugar/Reglas). Tests unitarios del flujo auth. (2FA/OAuth/magic links se difieren a M6; el esquema ya los soporta.)
*Demo: registrarse, verificar email, entrar, ver catálogo.*

**M2 — Motor + tres-en-raya + lobby N jugadores (L — fase crítica).** `@tableria/engine` completo con tests; tres-en-raya como primer `GameDefinition`; gateway WS con sesión revalidada; lobby N asientos (pública/privada, código); ready-check 20s; movimientos transaccionales, snapshots, timer persistente, reconexión con resume, espectadores; chat de mesa persistente. **Antes de congelar la interfaz `GameDefinition`, diseñar sobre papel el juego de cartas (info oculta, 2-4 j.) para validar el contrato.**
*Demo: 2+ pestañas juegan una partida completa; se reinicia el servidor a mitad y la partida sobrevive.*

**M3 — Social (M).** Amigos (solicitudes/bloqueo), presencia real, DMs y grupos **persistidos en `messages`**, unread/reply, invitaciones a mesa por chat, activity feed, notificaciones in-app.
*Demo: invitar a un amigo desde el chat y que entre a tu mesa con un clic.*

**M4 — Competición + Conecta 4 + juego de cartas (L).** Glicko-2 por juego y temporada (escrito en la tx de fin junto a `user_game_stats`), historial de rating, perfiles con stats, leaderboards, partidas rated/casual. **Conecta 4** (valida el motor barato) y **juego de cartas con info oculta 2-4 j.** (tipo Lost Cities / trick-taker — ejercita `playerView`, RNG persistido y N jugadores).
*Demo: jugar rated, ver subir el rating en el leaderboard, espectar con cartas ocultas.*

**M5 — Torneos (M/L).** Single-elim y suizo primero; inscripción, check-in, generación automática de matches por ronda, bracket visual, feed de resultados.
*Demo: torneo de 8 personas de principio a fin.*

**M6 — Endurecimiento + producción (M).** 2FA TOTP + backup codes + trusted devices, OAuth ×4 (arctic), magic links; auditoría a11y (teclado, focus, aria en tableros); i18n `en` completo; E2E Playwright de flujos críticos; despliegue en tableria.app; backups; monitorización.
*Demo: producción real con HTTPS.*

**M7 — Más juegos (M).** **Reversi/Othello** (1v1 información perfecta) y **party game simultáneo 3-8 jugadores** (valida turnos simultáneos y salas grandes). Eliminar `legacy/`.
*Demo: 5 juegos jugables en producción.*

Tamaño relativo: M2 ≈ M4 > M5 ≈ M6 ≈ M7 > M1 ≈ M3 > M0.

## Migración desde el proyecto actual (parte de M0)

1. `git init` en `c:\xampp\htdocs\tableria`; primer commit con README nuevo + `.gitignore`.
2. **Borrar basura de la raíz** (verificado que son residuos de pruebas curl): `*.tmp`, `sid-ramiku1.cookies` (contiene tokens — nunca commitear), `sid-ramiku1.txt`, `login.html`, `login-resp.html`, `last-room.json`, `server/*.log`.
3. Mover `public/`, `includes/`, `server/`, `storage/`, `tools/`, `chats/` → `legacy/` (sigue funcionando bajo XAMPP con alias si hace falta; referencia viva hasta M4, se elimina en M7). Conservar `schema.sql`/`auth_schema.sql` como referencia en `docs/legacy-schema/`.
4. Los ~8 usuarios demo NO se migran; `packages/db/seed.ts` recrea usuarios demo + catálogo (portando `includes/db/seed.sql` conceptualmente).
5. Puertos dev: Fastify `:3000` + Vite `:5173` (sin chocar con Apache `:80` ni WS legacy `:8080/:8081`).

## Seguridad y producción

- **Secretos**: `.env` gitignoreado + `.env.example`; `config.ts` valida con Zod y aborta al arrancar si falta algo. Rotables: `SESSION_PEPPER`, `ENCRYPTION_KEY` (AES-256-GCM para secretos TOTP), OAuth, SMTP, `DATABASE_URL`.
- **Sesiones**: cookie HttpOnly+Secure+SameSite=Lax, token opaco 256 bits, solo SHA-256 en BD, expiración deslizante, revocación por dispositivo; **el WS revalida sesión en handshake y periódicamente**.
- **Fin de los bypasses**: no existe API interna que confíe en `userId` del body — WS y HTTP comparten proceso y middleware de sesión. Rate-limit por IP+cuenta en auth y por socket en movimientos.
- **Despliegue**: VPS (p.ej. Hetzner CX22) con Docker Compose: Caddy (HTTPS automático + WS passthrough) + servidor Node + `postgres:17` con volumen y `pg_dump` nocturno. `drizzle-kit migrate` como paso de deploy. Escala vertical sobra; el diseño snapshot+deadline en BD permite horizontal futuro.
- **CI**: PR → `turbo lint typecheck test` + `drizzle-kit check` + build; `main` → E2E Playwright + imagen + deploy.

## Verificación

- **M0**: `pnpm dev` levanta server+web; `docker compose up` levanta Postgres+MailHog; navegar entre rutas.
- **M1**: flujo completo registro→email en MailHog→verificar→login→catálogo; tests Vitest de auth en verde.
- **M2 (prueba de fuego)**: dos navegadores juegan tres-en-raya completo; matar y reiniciar el proceso Node a mitad de partida y comprobar que ambos clientes reconectan y la partida continúa; dejar expirar un timer de turno y ver el forfeit automático; abrir una tercera pestaña como espectador.
- **M3–M5**: E2E Playwright por flujo (invitación por chat, partida rated con cambio de rating visible, torneo de 8).
- **Continuo**: `turbo lint typecheck test` en cada PR; Playwright en main.

## Riesgos

1. **M2 es el corazón**: si el contrato `GameDefinition` sale mal, los juegos posteriores lo pagan → diseñar el juego de cartas sobre papel antes de congelar la interfaz.
2. **Torneos suizos** (byes, desempates) fáciles de subestimar → single-elim primero.
3. **Docker Desktop en Windows**: paso de setup nuevo → documentar en README de M0.
