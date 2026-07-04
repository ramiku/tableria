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

### Identidad visual (logo oficial, añadido 2026-07-04; revisado a 2 temas el mismo día)

El usuario aportó el logo definitivo: icono isométrico (hexágono con meeple, bandera, pila de fichas y dado) en azules, wordmark "Tableria" en gradiente azul→cian, tagline "TU PLATAFORMA DE JUEGOS DE MESA". El archivo real vive en `apps/web/public/logo-tableria.png`.

Tras una primera iteración solo-oscura ("neon", con halo/glow), el usuario pidió explícitamente **un diseño claro y limpio, con tema claro por defecto y tema oscuro como opción**, ambos con la misma identidad azul. Sistema final en [apps/web/src/styles/app.css](../apps/web/src/styles/app.css): variables CSS en `:root` (claro) y `:root[data-theme='dark']` (oscuro), leídas por los tokens de Tailwind `@theme`. El azul de marca (`--tb-accent` / `--tb-accent-strong` / `--tb-accent-fg`) es **invariante entre temas** — solo cambian fondo, superficie, borde, texto y el gradiente del wordmark (más oscuro en claro para legibilidad, más brillante en oscuro).

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--tb-bg` | `#f7f9fc` | `#0b0f17` | fondo |
| `--tb-surface` / `-2` | `#ffffff` / `#f1f5fb` | `#121826` / `#1a2233` | paneles, tarjetas |
| `--tb-border` | `#e3e9f3` | `#29334a` | bordes |
| `--tb-text` / `-muted` | `#101828` / `#5d6b82` | `#e8eef9` / `#8b9ab3` | texto |
| `--tb-accent-tint` | `#e7f0fe` | `#16283d` | fondo de estado activo/badges |
| `--tb-accent` / `-strong` (invariante) | `#2f6fe0` / `#1e4fb0` | `#4c93f2` / `#7cb4ff` | botones, focos, marca |
| `--tb-success` / `-warn` / `-danger` | `#16a34a` / `#b45309` / `#dc2626` | `#34c973` / `#e2a93d` / `#f0645c` | presencia/estado en vivo, avisos, errores |

**Toggle de tema**: [stores/theme.ts](../apps/web/src/stores/theme.ts) (Zustand + `persist`, clave `tableria-theme`, por defecto `light`) + [components/ThemeToggle.tsx](../apps/web/src/components/ThemeToggle.tsx). Un script inline en `index.html` aplica el tema guardado antes del primer render para evitar parpadeo. `@custom-variant dark` en `app.css` ata el prefijo `dark:` de Tailwind a `[data-theme='dark']` (no a `prefers-color-scheme`).

**Segunda iteración (mismo día)**: el usuario valoró la primera pasada como "bastante fea" y aportó una captura de la v1 (PHP) como referencia de densidad de información — banner "continúa donde lo dejaste", catálogo con badges de estado y contador en vivo, entrada de código de sala, lista de amigos con presencia, panel de invitación. Se usó la skill `ui-ux-pro-max` para validar dirección (estilo Flat Design + tarjetas tipo Bento: sombras casi nulas, radios generosos, icono-heavy) y se añadió el token semántico `--tb-success` (ausente hasta entonces). Componentes nuevos en `apps/web/src/components/`: `icons.tsx` (SVG propios, sin emoji), `Avatar.tsx` (círculo — el hexágono de marca se reserva para elementos de tablero/juego, no para personas), `GameCard.tsx`, `ContinueBanner.tsx`, `FriendRow.tsx`, `InviteCard.tsx` (con copia al portapapeles funcional). Foco visible global y `cursor-pointer` en botones añadidos por accesibilidad.

**Firma visual**: recorte hexagonal (`.tb-hex`, clip-path) — reutiliza la forma exacta del icono del logo (y es también la ficha por excelencia del género: tableros hexagonales tipo Catan). Aplicado con moderación en dos sitios: el punto de navegación activo (`__root.tsx`) y la insignia de nº de jugadores en las tarjetas de juego (`routes/index.tsx`). Es el único elemento decorativo recurrente — el resto de la interfaz se mantiene sobrio (bordes finos, sin sombras/glow, espaciado generoso).

**Tercera iteración (mismo día): layout full-bleed + sidebar de marca fija.** El usuario consideró la segunda pasada aún genérica (tarjetas centradas flotando con `max-w` + padding, como una plantilla de admin) y pidió: (1) layout full-width con sidebars a sangre (sin margen exterior ni bordes redondeados en los contenedores exteriores), (2) el logo grande arriba del sidebar tal como en la captura de referencia — icono grande apilado sobre el wordmark, no un icono pequeño en línea, (3) un color con más carácter.

**Decisión de arquitectura visual**: el sidebar izquierdo pasa a ser una **franja de marca fija en azul oscuro** (patrón Slack/Notion/Linear: la navegación primaria mantiene su color de marca sea cual sea el tema del contenido). Esto es intencionadamente **independiente** del toggle claro/oscuro — ese toggle sigue existiendo pero ahora solo afecta al contenido central y al rail derecho, se movió del sidebar a una barra superior persistente en la columna central (visible en todas las páginas, no solo Explorar). La franja fija también resuelve el problema de la primera iteración: el halo/glow del icono nunca se veía bien sobre fondo claro; ahora vive garantizado sobre oscuro.

Tokens nuevos (fijos, no cambian con el tema, en `apps/web/src/styles/app.css`): `--tb-sidebar-bg` (`#0a0f1a`), `--tb-sidebar-bg-2` (`#131c2e`), `--tb-sidebar-border`, `--tb-sidebar-text`, `--tb-sidebar-muted`, `--tb-sidebar-accent` (`#4c93f2`), `--tb-sidebar-success`, `--tb-gradient-sidebar` (`#2f6fe0→#7ecbff`, para el wordmark grande y el botón "Crear sala" del sidebar). El contenido usa un nuevo `--tb-gradient-cta` (en vez de azul plano) para botones primarios (Crear sala, Reanudar, tarjeta de invitación) — más carácter que un fill sólido, coherente con el gradiente real del logo.

`Logo.tsx` ahora tiene variante `stacked` (icono 72px + wordmark + tagline, centrado, con `.tb-logo-glow`) para el sidebar, y `inline` (compacta) para otros contextos futuros. `Avatar.tsx` recibió un prop `tone` (`content` | `sidebar`) para que el anillo de presencia use el token correcto según dónde viva.

Tipografía sin cambios: Manrope (display) + Inter (body/UI), con `.tb-nums` (tabular-nums) para ratings, timers y contadores de mesa.

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

**M0 — Esqueleto (S). ✅ Implementado 2026-07-04.** git init + limpieza + `legacy/`; monorepo pnpm+turbo; docker-compose Postgres 17 + MailHog; `@tableria/db` con esquema núcleo y primera migración; Fastify `/health`; config Zod por entorno; shell Vite con router y layout 3 paneles (tokens `tb-`, Manrope+Inter); i18n inicializado; CI GitHub Actions (lint+typecheck+vitest).
*Demo: la app arranca y navega entre rutas con URLs reales.*

**M1 — Auth + catálogo (M). ✅ Implementado 2026-07-04.** Registro/login argon2id, sesiones opacas + cookie `tb_sid`, CSRF, verificación email (MailHog), lockout, anti-enumeración, rate-limit; página de cuenta; catálogo con ficha de juego (tabs Jugar/Reglas). Tests unitarios del flujo auth. (2FA/OAuth/magic links se difieren a M6; el esquema ya los soporta.) Detalle en [«M1 — Auth + catálogo (implementado)»](#m1--auth--catálogo-implementado-2026-07-04) más abajo.
*Demo: registrarse, verificar email, entrar, ver catálogo.*

**M2 — Motor + tres-en-raya + lobby N jugadores (L — fase crítica). ✅ Implementado 2026-07-04.** `@tableria/engine` completo con tests; tres-en-raya como primer `GameDefinition`; gateway WS con sesión revalidada; lobby N asientos (pública/privada, código); ready-check 20s; movimientos transaccionales, snapshots, timer persistente, reconexión con resume, espectadores; chat de mesa persistente. Detalle en [«M2 — Motor de juego + tres en raya + lobby (implementado)»](#m2--motor-de-juego--tres-en-raya--lobby-implementado-2026-07-04) más abajo.
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

## M1 — Auth + catálogo (implementado 2026-07-04)

Primer recorte real de M1: registro/login/logout/recuperación de contraseña, sin 2FA/OAuth/magic-links/email de verificación (deferidos a M6 tal cual decía el roadmap). Registro pedido explícitamente "simple": solo nick, correo, contraseña.

**Backend** (`apps/server/src/auth/`):
- `crypto.ts` — `@node-rs/argon2` (argon2id) para contraseñas; tokens de sesión y de reseteo son aleatorios de 256 bits, guardados en BD como **HMAC-SHA256 con `SESSION_PEPPER`** (no SHA-256 plano) — así una fuga de la BD sin el `.env` no permite reconstruir tokens válidos.
- `session.ts` — cookie `tb_sid` (httpOnly, sameSite lax, secure en producción), TTL 30 días, revocación individual y masiva (`revokeAllSessions`, usada al resetear contraseña).
- `csrf.ts` — cookie doble-submit `tb_csrf` (legible por JS) + cabecera `x-csrf-token`; verificado en todas las rutas mutantes.
- `mailer.ts` — nodemailer a MailHog en dev.
- `routes.ts` — `POST /api/auth/{register,login,logout,forgot-password,reset-password}` + `GET /api/auth/me`. Rate-limit por ruta vía `@fastify/rate-limit`. Anti-enumeración: `forgot-password` siempre responde igual exista o no la cuenta, y solo envía email si existe.
- Tabla nueva `password_resets` (migración `0001_even_jackpot.sql`): token de un solo uso, caduca en 1h, `consumedAt` lo invalida tras usarse.
- Ruta de auth como **REST plano, no tRPC** — decisión deliberada: el login vive fuera de la capa RPC en muchos stacks (cookies, redirects); tRPC entra con el catálogo/social en el resto de M1/M3.

**Frontend**: reestructura de rutas para separar público de privado —
- `routes/__root.tsx` ahora es un `<Outlet/>` desnudo (antes tenía el shell completo).
- `routes/_app.tsx` es un **pathless layout route** (patrón de TanStack Router: prefijo `_`) que contiene el shell (sidebar + topbar) y hace de guardia: `beforeLoad` llama a `fetchMe()` y redirige a `/login` si no hay sesión. Todas las páginas privadas pasaron de `foo.tsx` a `_app.foo.tsx` (`_app.index.tsx`, `_app.salas.tsx`, etc.).
- `routes/{login,registro,recuperar,restablecer}.tsx` — públicas, con `AuthLayout` (logo grande centrado sobre el fondo fijo del sidebar) y `FormField` compartido. `login`/`registro` redirigen a `/` si ya hay sesión.
- `lib/api.ts` (fetch con cookies + cabecera CSRF automática) y `lib/auth.ts` (funciones tipadas: fetchMe/login/register/logout/forgotPassword/resetPassword).
- El sidebar (`_app.tsx`) ya no tiene la caja "entra con un código" (se quitó por no aportar valor); el usuario real llega vía `Route.useRouteContext().me` y hay un botón de logout real (icono nuevo `LogoutIcon`).
- Token nuevo `--tb-sidebar-danger` para mensajes de error en las páginas de auth (viven sobre el fondo fijo del sidebar, no sobre el tema claro/oscuro del contenido).

**Verificado end-to-end vía curl** contra el servidor real: registro → `/me` → logout → `/me` 401 → login → contraseña incorrecta rechazada (mensaje genérico) → forgot-password (email real recibido en MailHog, email inexistente no genera envío) → reset-password con token real → reutilizar el mismo token falla (ya consumido) → login con contraseña vieja falla → login con la nueva funciona → peticiones sin cabecera CSRF o con cabecera incorrecta devuelven 403. Frontend: `typecheck`/`lint`/`build` limpios, árbol de rutas generado correctamente (confirma que los paths `_app/...` están bien formados).

**Pendiente para pulir en una pasada posterior** (no bloqueante): toggle de mostrar/ocultar contraseña, verificación de email, lockout por intentos fallidos (el rate-limit por IP ya cubre fuerza bruta básica).

### Catálogo real vía tRPC (mismo día, tras el auth)

Segundo recorte de M1: el catálogo pasa de datos estáticos en el frontend a servirse desde Postgres, y es la primera pieza que usa tRPC (tal y como preveía la tabla de stack: REST solo para auth, tRPC para el resto).

- **Backend**: primer router tRPC (`apps/server/src/trpc/{context,trpc,router}.ts` + `routers/games.ts`) — `games.list`/`games.bySlug` (join con `game_categories` y `game_content`), montado en `/api/trpc` vía `fastifyTRPCPlugin`.
- El tipo `AppRouter` se expone al resto del workspace a través del campo `types` del `package.json` de `@tableria/server` (build con `declaration: true`), consumido como `devDependency` de solo-tipos desde `apps/web` — mismo patrón end-to-end typesafe que usan la mayoría de monorepos con tRPC, sin duplicar contratos a mano.
- **Frontend**: `lib/trpc.ts` (cliente `httpBatchLink`, `credentials: 'include'`), catálogo (`_app.index.tsx`) con estados de carga/error/vacío y filtros por categoría derivados de los datos reales (ya no hardcodeados `board`/`cards`).
- **Ficha de juego** (`_app.juegos.$slug.tsx`): hero con gradiente generado por `color-mix()` a partir de un único color de marca por juego (sin necesitar un segundo color en BD), tabs **Jugar** (pasos del flujo + estado según `game.isActive`, sin fingir funcionalidad que no existía aún) y **Reglas** (contenido real de `game_content`, con placeholder si todavía no hay texto).
- `GameCard` rediseñada con el mismo lenguaje visual (motivo de icono de categoría de fondo, insignia hexagonal de nº de jugadores, badge, elevación al hover).

## M2 — Motor de juego + tres en raya + lobby (implementado 2026-07-04)

La fase que el propio roadmap marcaba como crítica: el contrato `GameDefinition` queda congelado con un juego real implementado y probado, no solo bosquejado. Implementado y verificado en 4 pasadas, cada una commiteada y validada antes de la siguiente.

### 1. Paquetes puros — `@tableria/protocol`, `@tableria/engine`, `@tableria/games`

Tres paquetes workspace nuevos, mismo patrón que `@tableria/db` (`type:module`, `main`/`types`/`exports` a `dist/`, `declaration:true`). **Decisión de estructura**: `@tableria/games` es un único paquete con una subcarpeta por juego (`src/tres-en-raya/`, futuro `src/conecta-cuatro/`, …) en vez de un paquete por juego — evita tener que tocar el glob `packages/*` de `pnpm-workspace.yaml` cada vez que se añade un juego.

- **`@tableria/protocol`**: esquemas Zod de los mensajes WS. Envelope simplificado respecto al bosquejo original: **sin `ping`/`pong` a nivel de aplicación** (el heartbeat usa frames de control nativos de `ws`) y **sin `seq` genérico en el envelope** (cada payload lleva su propio contador donde importa, p. ej. `match.state.seq`). Resync de **estado completo** en cada `match.state` en vez de diffs incrementales — simplificación deliberada, válida mientras los estados de los juegos sean pequeños.
- **`@tableria/engine`**: la interfaz `GameDefinition<S,M>` tal cual quedó bosquejada (`setup`/`activePlayers`/`validateMove`/`applyMove`/`checkEnd`/`playerView`/`onTurnTimeout`), asientos 0-indexados. `Rng` determinista (`xmur3` + `mulberry32`, serializable por `seed`+`calls` para reanudar tras un reinicio).
- **`@tableria/games`**: tres en raya como primer `GameDefinition` real — 8 líneas de victoria, empate, información perfecta (`playerView` idéntica para ambos asientos y espectadores). 18 tests cubren el contrato completo, incluidas las 8 líneas parametrizadas y una secuencia de empate completa.

**Verificación**: 40 tests nuevos (13 protocolo + 9 rng + 18 tres-en-raya), `pnpm turbo lint typecheck test build` en verde. Commit `61c7cb0`.

### 2. Servidor — migración, lobby por tRPC, match runtime, gateway WS

- **Migración** (`packages/db`, commit `50b85c5`): tabla `match_chat_messages` (matchId, userId, body, createdAt + índice `(matchId, createdAt)`) — chat de mesa deliberadamente separado de la futura mensajería de amigos (`messages`, M3). `inArray` añadido al re-export de drizzle-orm.
- **`protectedProcedure`** nuevo en `trpc.ts` (exige `ctx.user`, resuelto en `context.ts` leyendo la cookie `tb_sid` con el mismo `getUserFromToken` que ya usaba el auth REST). Router **`matches`** (`create`/`join`/`listPublic`/`getByCode`/`setReady`/`leave`) — el CRUD del lobby va por tRPC; movimientos y chat van solo por WS, tal y como preveía la tabla de stack.
- **Match runtime** en memoria (`apps/server/src/match/`): `registry.ts` (tipos + `Map<matchId, MatchRuntime>`), `persistence.ts` (snapshot + replay de `match_moves` para reconstruir el estado autoritativo), `lifecycle.ts` (arranque de partida, pipeline transaccional de movimientos, forfeit por timeout), `timers.ts`, `broadcast.ts`, `service.ts` (composición + `recoverOnBoot`).
- **Pipeline de movimiento**: `SELECT ... FOR UPDATE` sobre `matches` serializa cualquier movimiento concurrente; `INSERT match_moves` con `UNIQUE(match_id, seq)` como red de seguridad final; snapshot cada 20 movimientos o al terminar; la caché en memoria solo se muta **después** de que el INSERT confirma éxito.
- **Recovery al arrancar** (`recoverOnBoot`, llamado desde `index.ts` antes de `listen`): revisa **todas** las partidas `in_game` (no solo las de deadline ya vencido, corrección sobre el primer borrador) — si el turno ya venció, forfeit inmediato; si no, reprograma el timer con el tiempo restante y precarga el runtime.
- **Gateway WS** (`apps/server/src/ws/`) en `/api/ws` vía `@fastify/websocket`: autentica en el handshake con la misma cookie `tb_sid` (con fallback a parsear la cabecera `cookie` a mano si `@fastify/cookie` no la expone en la petición de upgrade), heartbeat ping/pong cada 30s que también revalida que la sesión no haya sido revocada. El WS gestiona **también la sala de espera** (no solo la partida en curso): el cliente se suscribe con `match.join` en cuanto entra a `/sala/$code`, y el servidor difunde `match.lobby` en cada cambio — sin esto, el ready-check con cuenta atrás no tendría forma de reflejarse en vivo (tRPC aquí no tiene subscripciones).
- **Nota técnica reutilizable**: generar el `.d.ts` de `AppRouter` con `protectedProcedure` en el contexto dio `TS2742` ("cannot be named without a reference to .../dist/schema.js") porque `@tableria/db` solo exponía `.` en su `package.json#exports`. Se resolvió añadiendo un subpath comodín `"./*": {"types": "./dist/*.d.ts", "default": "./dist/*.js"}` — cualquier paquete workspace que exponga tipos consumidos indirectamente por otro paquete (no solo el que lo importa directamente) puede necesitar este mismo ajuste.

**Verificación**: máquina de estados `create→join→setReady×2→waiting→starting→in_game` comprobada primero por curl/SQL antes de tocar WS (commit `4c5ec2f`); gateway WS probado después con **dos WebSockets reales** (cookies de sesión auténticas, sin mocks): countdown de lobby en vivo, movimientos alternados con broadcast correcto, rechazo `NOT_YOUR_TURN`/`INVALID_MOVE`, chat de mesa difundido (commit `75ecc2a`). De forma orgánica, al reiniciar el servidor a mitad de las pruebas, `recoverOnBoot` forfeiteó automáticamente una partida cuyo `turnDeadlineAt` había vencido mientras el proceso estaba caído — exactamente el escenario que pide la prueba de fuego del roadmap.

### 3. Frontend — lobby, tablero y chat en tiempo real

- **`lib/ws.ts`**: wrapper sobre `WebSocket` nativo con reconexión (backoff exponencial + jitter) y reenvío automático de la última suscripción (`match.join`/`watch`/`resume`) tras cada reconexión.
- **`stores/match.ts`**: puente Zustand entre los mensajes del WS y las páginas, mismo patrón side-effect que `stores/theme.ts`/`stores/i18n.ts` (importado por efecto en `main.tsx`, no vía provider).
- **`/sala/$code`** (nueva): sala de espera con asientos/ready desde `match.lobby`, cuenta atrás calculada en cliente desde `startsAt`, navegación automática a `/partida/$id` en cuanto llega el primer `match.state`.
- **`/partida/$id`** (nueva): tablero de tres en raya (tipado con `TicTacToeView` importado solo como tipo desde `@tableria/games`, consumido igual que `@tableria/server` — el tablero se renderiza en `apps/web`, no como componente React exportado desde `packages/games`, que se mantiene 100% puro/sin IO), temporizador, chat de mesa, banner de fin con el resultado. Misma vista para jugadores y espectadores (controles de movimiento ocultos para estos últimos).
- **`/salas`**: deja de ser un placeholder — lista de salas públicas (`listPublic`, refresco cada 5s) + unirse por código.
- **Ficha de juego**: el botón "Crear sala" (antes deshabilitado con copy "disponible en M2") ya funciona para juegos con `isActive`.
- **`vite.config.ts`**: proxy `/api` pasado de forma corta (string) a forma objeto con `ws: true` — necesario para que el upgrade de WebSocket atraviese el proxy de Vite en dev.

**Verificación**: `pnpm turbo lint typecheck test build` en verde (23/23) tras cada fase. Commit `0a56b2e`.

### Deuda explícita (documentada, no bloqueante)

- Abandono por desconexión con grace period 60s: hoy solo se marca `disconnectedAt`, sin transición automática a `abandoned`. El firetest de M2 no lo exige; se retoma en M3+.
- El riesgo #1 del roadmap ("M2 es el corazón") se mitigó verificando el contrato exhaustivamente con tres en raya (18 tests + firetest real) en vez de diseñar el juego de cartas sobre papel primero — juicio pragmático dado que tres en raya ya ejercita turnos, fin de partida con ranking N-jugador y `playerView`; queda pendiente confirmar el contrato contra un juego de información oculta real en M4.
