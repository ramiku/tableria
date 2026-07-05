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

- **State machine de sala**: `waiting → starting → in_game → finished | cancelled | abandoned`. (El ready-check de 20s heredado del PHP se sustituyó el 2026-07-05 por **arranque instantáneo**: en cuanto el último jugador confirma, la partida empieza en ese momento — decisión de producto del lobby estilo BGA.)
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

**M3 — Social (M). ✅ Implementado 2026-07-05.** Amigos (solicitudes/bloqueo), presencia real, DMs **persistidas en `messages`** (1:1; grupos quedan para más adelante), invitaciones a mesa por chat, activity feed, notificaciones in-app. Detalle en [«M3 — Social (implementado)»](#m3--social-implementado-2026-07-05) más abajo.
*Demo: invitar a un amigo desde el chat y que entre a tu mesa con un clic.*

**M4 — Competición + Conecta 4 + Brisca (L). ✅ Implementado 2026-07-05.** Glicko-2 por juego y temporada (escrito en la tx de fin junto a `user_game_stats`), historial de rating, perfiles con stats, leaderboards, partidas rated/casual. **Conecta 4** (valida el motor barato) y **Brisca** (baraja española, juego de cartas con info oculta 2-4 j. — ejercita `playerView`, RNG persistido y N jugadores). Detalle en [«M4 — Competición + Conecta 4 + Brisca (implementado)»](#m4--competición--conecta-4--brisca-implementado-2026-07-05) más abajo.
*Demo: jugar rated, ver subir el rating en el leaderboard, espectar con cartas ocultas.*

**M5 — Torneos de eliminación directa (M/L). ✅ Implementado 2026-07-05 (single-elim; suizo diferido explícitamente).** Inscripción, check-in, seeding por rating, generación automática de partidas por ronda (con byes), bracket visual, clasificación final. Detalle en [«M5 — Torneos de eliminación directa (implementado)»](#m5--torneos-de-eliminación-directa-implementado-2026-07-05) más abajo.
*Demo: torneo de 6-8 personas de principio a fin, con byes y reinicio del servidor a mitad de partida.*

**M6 — Endurecimiento + producción (M).** ✅ **Parte 1 (endurecimiento) implementada 2026-07-05**: 2FA TOTP + backup codes + trusted devices, magic links, auditoría a11y de tableros, E2E Playwright de flujos críticos. **Parte 2 (diferida, necesita credenciales del usuario)**: OAuth ×4 (arctic), despliegue en tableria.app, backups, monitorización. Detalle en [«M6 (parte 1) — Endurecimiento (implementado)»](#m6-parte-1--endurecimiento-implementado-2026-07-05) más abajo.
*Demo: activar 2FA, entrar con backup code o enlace mágico, navegar un tablero solo con teclado.*

**M7 — Más juegos (M). ✅ Implementado 2026-07-05.** Reversi/Othello (1v1 información perfecta) y **Pista Única**, party game cooperativo de 3-8 jugadores con pistas simultáneas (primer juego que ejercita `activePlayers` con varios asientos a la vez, y primer aforo de mesa variable elegible en el lobby). `legacy/` eliminada. Detalle en [«M7 — Reversi/Othello (implementado)»](#m7--reversiothello-implementado-2026-07-05) y [«M7 — Pista Única (implementado)»](#m7--pista-única-party-game-cooperativo-3-8-jugadores-implementado-2026-07-05) más abajo.
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

## M3 — Social (implementado 2026-07-05)

Amigos, presencia real, DMs persistidas, invitación a mesa desde el chat con un clic, activity feed y notificaciones in-app — todo sobre el mismo canal WS `/api/ws` de M2, sin abrir un segundo socket.

### Esquema (`packages/db`, migración `0003_narrow_saracen.sql`)

- **`friendships`**: decisión de diseño propia — **fila única canónica por pareja** (`userId < friendId` forzado con `CHECK`), en vez del modelo legacy de arista dirigida que permitía una fila por sentido con estados potencialmente conflictivos. `actorId` registra quién solicitó o quién bloqueó por última vez. Solicitud mutua (A pide a B mientras B ya le había pedido a A) se resuelve como aceptación automática.
- **`conversations` / `conversationMembers` / `messages`**: portadas del legacy con recorte deliberado — `messages.kind` solo `text | system | invite` (se omiten `game_start`/`game_end`, sin consumidor todavía). `messages.inviteMatchId` enlaza la invitación con la partida real.
- **`activityFeed`**: `type` acotado a `friend_request | friend_accepted | invited` — eventos de partida (`won`, `created_room`) se difieren a M4 para escribirse en la misma transacción que el rating/stats, en vez de tocar dos veces el pipeline transaccional de M2.
- **`notifications`**: `userId`, `type`, `payload jsonb`, `readAt`.
- `users.presence`/`users.lastSeenAt` ya existían desde M0 sin usarse de verdad; M3 los pone en marcha.

### Backend — `apps/server/src/social/`

- **`presence.ts`**: registro en memoria `Map<userId, Set<AuthedSocket>>` (no existía — hasta ahora solo había un `Set` plano en `ws/heartbeat.ts` para el ping/pong). Grace period de 10s antes de marcar `offline` tras el último socket de un usuario, para no parpadear en reconexiones breves. `setInGame()` se invoca desde `match/lifecycle.ts` (`startMatch` y los dos caminos de fin de partida) para reflejar `presence='in_game'` mientras se juega — único punto donde M3 toca código de M2, de forma aditiva.
- **`friends.ts` / `conversations.ts` / `notifications.ts` / `activity.ts`**: funciones puras sobre `db`. **`service.ts`** (`SocialService`, mismo patrón factory que `createMatchService`) combina persistencia + creación de notificación/actividad + broadcast WS en una sola operación por acción social (enviar solicitud, aceptar, enviar DM, etc.).
- **Protocolo** (`packages/protocol`): cliente → `dm.send {conversationId, body, kind, matchId?}`; servidor → `presence.snapshot` (al autenticar), `presence.update`, `dm.message`, `notification.new`. Ninguno necesita un mensaje `subscribe` explícito — el servidor ya sabe qué sockets pertenecen a cada `userId` autenticado y empuja directamente, sin tocar el mecanismo de `lastSubscription` (pensado solo para `match.*`).
- **`ws/send.ts`** nuevo: `sendToSocket()` extraído como helper compartido tras aparecer duplicado idéntico en `match/broadcast.ts` y `social/presence.ts`.
- **tRPC**: routers `friends` / `conversations` / `notifications` / `activity`, todos `protectedProcedure`. Como el cliente tRPC no usa transformer `superjson`, cada router serializa `Date → ISO string` a mano antes de devolver — mismo cuidado que ya aplicaba `match/broadcast.ts` para los mensajes WS.

### Frontend

- **`stores/presence.ts`** y **`stores/notifications.ts`**: mismo patrón que `stores/match.ts` (listener global registrado una vez sobre `matchSocket.onMessage`).
- **`lib/friends.ts`** (`useFriendsList`): combina la query tRPC de amigos con la presencia en vivo del store.
- **`_app.amigos.tsx`**: página real (antes placeholder "llega en M3") con amigos/solicitudes/bloqueados.
- **`_app.mensajes.tsx`** + **`_app.mensajes.$conversationId.tsx`**: página dedicada para DMs — decisión explícita del usuario frente a un dock flotante tipo v1, por coherencia con la filosofía "URLs reales" del resto de v2.
- **`_app.partida.$id.tsx`**: botón "Invitar amigo" que crea/reutiliza la conversación y manda un mensaje `kind:'invite'` con el código de la sala; el lado receptor reutiliza `matches.join` (M2) sin ningún cambio.
- **`NotificationBell.tsx`** nueva en la topbar; sidebar y perfil cableados a datos reales (sustituyen los arrays `demoFriends`/`demoRequests`).

### Hallazgo de tooling (no del producto)

El `WebSocket` global de Node (undici) descarta silenciosamente la cabecera `Cookie` pasada por `options.headers` — igual que los navegadores por seguridad — así que probar el gateway WS autenticado por cookie con `new WebSocket(...)` global falla con 4401 sin explicación aunque la cookie sea válida. Para probar desde Node hace falta el paquete `ws` (si respeta las cabeceras). Un navegador real no tiene este problema.

**Verificación**: firetest de punta a punta con dos usuarios reales (cookies de sesión reales, WebSockets reales vía paquete `ws`): solicitud de amistad → aceptar → presencia online en vivo (snapshot + `presence.update`) → DM persistida → invitación con el código real de la partida → el receptor se une con un solo `matches.join` → notificaciones `friend_accepted`/`invited` en vivo → historial persistido (no solo en memoria) → lista de conversaciones con último mensaje y no leídos → presencia a `offline` tras el grace period. `pnpm turbo lint typecheck test build` en verde (23/23).

## M4 — Competición + Conecta 4 + Brisca (implementado 2026-07-05)

Fase grande (al nivel de M2): Glicko-2 por juego/temporada escrito en la misma transacción que cierra la partida, `user_game_stats` (hasta ahora nunca escrita), leaderboards, perfiles con stats reales, partidas rated/casual, y dos juegos nuevos que validan el motor de M2 contra escenarios distintos a tres en raya — **Conecta 4** (info perfecta, barato) y **Brisca** (baraja española, primer juego con información oculta real). Implementada en 3 pasadas, cada una verificada con WebSockets reales antes de pasar a la siguiente.

### 1. Infraestructura de rating/stats

**Schema** (`packages/db`, migración `0005_smiling_nitro.sql`): `seasons` (una temporada global activa a la vez, sin UI de administración — se rota a mano en BD si hace falta); `userGameRatings` (PK `userId+gameId+seasonId`: `rating`/`rd`/`vol` Glicko-2, W/L/D, `peakRating`, índice `(gameId, seasonId, rating DESC)` para el leaderboard); `ratingHistory` (una fila por partida rated jugada); `userGameStats` (PK `userId+gameId`: contador de toda partida acabada, rated o no — a diferencia de `userGameRatings`, que solo se mueve si la partida era rated).

**Glicko-2 propio** (`apps/server/src/ratings/glicko.ts`, puro, ~110 líneas, sin IO): implementación estándar del algoritmo de Mark Glickman (conversión a escala Glicko-2, resolución de la volatilidad por el método de Illinois, vuelta a escala Glicko), validada en tests contra el ejemplo de referencia del propio paper. `updateGlickoForRanking` generaliza el algoritmo (pensado para 1v1) a un resultado de N jugadores descomponiendo la partida en enfrentamientos por parejas (todos contra todos), con el resultado de cada par derivado del `placement` relativo — todas las actualizaciones parten de los ratings previos a la partida, sin encadenarse entre sí.

**Cierre de partida unificado** (`apps/server/src/match/lifecycle.ts`): se detectó que los dos caminos de fin de partida (natural vía `checkEnd()` y forfeit por timeout) duplicaban la escritura de `placement` — se extrajo `finishMatchTx(tx, runtime, ranking, rated, seatToUserId)`, usado por ambos, que delega en `ratings.applyMatchResult` (`apps/server/src/ratings/service.ts`): escribe `userGameStats` siempre y, si la partida es `rated`, además `userGameRatings` + `ratingHistory` + `matchPlayers.ratingBefore/after` — todo en la misma transacción que ya cerraba la partida. `match.ended` (protocolo) ahora incluye `ratingDeltas` (`null` si la partida era casual) para que el cliente muestre el cambio de rating al instante.

**tRPC**: `matches.create` acepta `rated: boolean` (antes inexistente, siempre `false`); `matches.listPublic`/`listWaiting`/`getByCode` exponen `rated`. Router nuevo `ratings` (`leaderboard({gameId})`, `mySummary()`).

**Frontend**: toggle rated/casual en la ficha de juego (mismo lenguaje visual que el checkbox de sala privada ya existente); `/rankings` con tabla real por juego activo y temporada; perfil (tab «Partidas») con stats agregados reales, rating por juego, e historial de últimas partidas (`matches.recent`, nuevo) con el delta de rating visible — sustituyen los arrays demo que quedaban pendientes desde M1.

**Verificación**: firetest con dos usuarios reales por WebSocket — partida rated de tres en raya completa (rating sube/baja según Glicko-2, verificado también contra el ejemplo del paper), partida casual (actualiza `userGameStats`, no toca `userGameRatings`), y forfeit por timeout disparando el mismo `finishMatchTx`. `pnpm turbo lint typecheck test build` en verde (23/23).

### 2. Conecta 4

`packages/games/src/conecta-cuatro/`: tablero 7×6 (`board: Cell[]`, fila 0 = arriba), caída por gravedad (`lowestEmptyRow`), detección de 4 en línea en las 4 orientaciones desde la última ficha jugada. 14 tests, incluidas las 2 diagonales construidas directamente sobre el estado (en vez de por secuencias de turnos alternados, mucho más simple de razonar) y un tablero de empate matemáticamente garantizado sin 4 en línea (`value(fila,col) = ((fila + 2·col) mod 4) < 2`, con racha máxima demostrable de 2 en las 4 direcciones).

Para poder añadir un segundo juego al tablero de partida hizo falta un refactor previo: `apps/web/src/routes/_app.partida.$id.tsx` tenía el render de tres en raya (incluida la variante "mover fichas") hardcodeado inline. Se extrajo a `apps/web/src/games/TicTacToeBoard.tsx` con un contrato común (`BoardProps`: `matchId`, `seq`, `mySeat`, `myTurn`, `view`), y la página despacha por `gameId` (nuevo `matches.getById`, ya que `match.state` no llevaba el `gameId` de la partida) contra un registro `BOARD_COMPONENTS`. `ConnectFourBoard.tsx` nuevo, con la interacción de "soltar en columna" (clic en cualquier celda de la columna, no solo en la casilla concreta).

Catálogo: fila `conecta-cuatro` ya existía como placeholder (`isActive:false`) desde M0 — se activó junto con el contenido de reglas. El seed pasó de `onConflictDoNothing` a `onConflictDoUpdate` para `games`/`gameContent`: cada milestone reactiva/actualiza filas ya sembradas en pasadas anteriores en vez de dejarlas congeladas en su estado inicial.

**Verificación**: partida rated completa por WebSocket real (victoria por línea horizontal, rating actualizado) y forfeit por timeout — mismo camino genérico que tres en raya, sin ningún caso especial por juego.

### 3. Brisca

Primer juego con **información oculta real** (a diferencia de tres en raya/Conecta 4, donde `playerView` era trivialmente idéntica para todos). Reglas fijadas antes de tocar el motor: baraja española 40 cartas (4 palos × 10 rangos), reparto de 3 cartas por jugador, triunfo destapado y devuelto al fondo del mazo; sin obligación de asistir al palo (a diferencia de Tute); gana la baza el triunfo más alto jugado o, si no hay triunfo, la carta más alta del palo que abrió la mano — una tercera opción nunca gana la baza aunque su rango nominal sea alto; el ganador roba primero y abre la siguiente baza; fin cuando mazo y manos se agotan, gana quien más puntos sumó (As=11, 3=10, Rey=4, Caballo=3, Sota=2, resto=0; 120 puntos en la baraja).

`packages/games/src/brisca/`: el mazo se baraja una única vez en `setup()` con el `Rng` inyectado (Fisher-Yates); a partir de ahí el orden de robo es determinista sin necesitar aleatoriedad dentro de `applyMove` (cumple la restricción de reducer puro del motor). Única jugada posible: `{cardIndex}`; la resolución de la baza y el reparto de cartas nuevas son automáticos dentro de `applyMove`, no una jugada del jugador. `playerView(state, seatIndex)` solo rellena `hand` para el propio asiento — el resto de manos se exponen solo como `handCounts` (recuento), nunca su contenido; espectadores (`seatIndex: null`) no ven ninguna mano. 20 tests cubren reparto, resolución de baza (triunfo gana a no-triunfo pese a menor rango; un tercer palo nunca gana aunque tenga rango alto), reparto tras baza, ranking N-jugador con empates, y una partida completa jugada hasta el final que confirma que los puntos siempre suman 120.

El motor soporta oficialmente 2-4 jugadores (`GameEndResult`/ranking probado con 4 asientos), pero el lobby actual no permite elegir tamaño de mesa — Brisca se lanza con `maxPlayers:2` fijo en el catálogo hasta que una fase posterior añada esa opción (deuda explícita, no bloqueante; documentada igual que el resto de deuda de M2/M3).

`apps/web/src/games/BriscaBoard.tsx`: mano propia jugable, baza en curso (cartas boca arriba, casillas vacías para quien no ha jugado todavía), triunfo, puntuación por asiento, recuento de mazo — sin obligación de asistir al palo, cualquier carta de la mano es jugable en todo momento.

**Verificación — el hallazgo más importante de esta pasada**: firetest con 2 jugadores + 1 espectador por WebSocket real, **inspeccionando el payload crudo de `match.state`** (no solo la UI) para confirmar que la mano ajena nunca aparece en ningún mensaje recibido por el rival ni por el espectador — ni siquiera como substring del JSON. Partida completa (40 cartas) jugada hasta el ranking final con puntos sumando 120. Reinicio del servidor a mitad de partida: la mano, los puntos y el `seq` sobreviven intactos — el hallazgo de tooling de esta prueba fue que Postgres `jsonb` reordena las claves de los objetos alfabéticamente al guardar (`{suit,rank}` vuelve como `{rank,suit}`), así que una comparación ingenua por `JSON.stringify` da un falso negativo; una comparación estructural confirma que los datos son idénticos — no afecta al producto porque todo el código accede a las propiedades por nombre, nunca por igualdad de cadena JSON.

### Deuda explícita (documentada, no bloqueante)

- Brisca fijo a 2 plazas en el lobby pese a que el motor soporta 2-4 (ver arriba).
- Una sola temporada activa a la vez, sin UI de administración de temporadas.
- El leaderboard y el resumen de perfil no pagan por partidas async de larga duración de forma distinta a las realtime — mismo tratamiento para ambas.

**Verificación global**: `pnpm turbo lint typecheck test build` en verde (23/23) tras cada pasada; 42 tests nuevos (7 Glicko-2 + 14 Conecta 4 + 20 Brisca + 1 protocolo ampliado por `ratingDeltas`), 92 en total en el monorepo. No se verificó visualmente en navegador (sin herramienta de captura en este entorno) — toda la verificación end-to-end se hizo contra el WebSocket real con el paquete `ws`, inspeccionando los payloads recibidos.

## M5 — Torneos de eliminación directa (implementado 2026-07-05)

El propio roadmap marcaba el riesgo de subestimar los torneos suizos (byes, desempates) y proponía single-elim primero. Preguntado por el alcance, el usuario eligió exactamente esa mitigación: **solo eliminación directa** en esta pasada; el formato suizo queda como pasada de seguimiento explícita.

### Schema (`packages/db`, migración `0006_rainy_anita_blake.sql`)

`tournaments` (format `'single_elim'` únicamente por ahora; state `registration|running|finished|cancelled`; `rated` bool, default `true`; `totalRounds` calculado al arrancar), `tournamentParticipants` (PK `tournamentId+userId`; status `registered|checked_in|eliminated`; `seed` asignado al arrancar; `finalPlacement`), `tournamentRounds` (`roundNumber`, unique por torneo), `tournamentMatches` (`slotIndex` dentro de la ronda, `participantAId`/`participantBId` nullable = bye, `matchId` nullable, `winnerUserId`, state `pending|finished`). **Decisión clave: no se toca la tabla `matches`** — el enlace es unidireccional (`tournamentMatches.matchId` apunta a `matches.id`); el runner detecta que una partida es de torneo con un `select` por `matchId`, así M5 no modifica ninguna fila de M2/M4. Dos tipos nuevos en el `activityTypeEnum` compartido: `tournament_round_started`, `tournament_eliminated`.

### Motor puro de bracket (`apps/server/src/tournaments/bracket.ts`, sin IO)

`seedOrder(size)`: algoritmo recursivo estándar de seeding de torneos (1 vs N, 2 vs N-1, ...) — `seedOrder(8) = [1,8,4,5,2,7,3,6]`, el bracket real de un torneo de 8. `assignBracket(participantsByRatingDesc)`: mapea seeds 1..N a participantes (rating descendente) y N+1..size (potencia de 2 más próxima) a `null` (bye) — por construcción del propio algoritmo de seeding, los byes recaen siempre en los mejores sembrados, sin lógica extra. `placementForEliminationRound(round, totalRounds) = 2^(totalRounds-round)+1` da el puesto final de quien cae eliminado en cada ronda (final→2º, semifinal→3º empatado, etc.), mismo convenio de "empates comparten placement" que `PlayerRank` del motor de juego. 13 tests, incluidos los casos con bye (5 y 6 participantes) verificados a mano contra el resultado real del algoritmo.

### Runner (`apps/server/src/tournaments/service.ts`)

- **`startTournament`**: valida host + ≥2 confirmados, calcula tamaño de bracket y `totalRounds`, asigna `seed` por rating del juego (temporada activa, 1500 si no hay rating todavía) y genera la ronda 1.
- **`generateRound`**: por cada pareja de la ronda — si ambos existen, crea la partida real (mismo patrón que `matches.create` pero sin el guard de "una mesa activa por usuario" ni paso por lobby: inserta `matches`+`matchPlayers` directamente y llama `matchService.startNow(matchId)`, arranque instantáneo sin ready-check) y notifica a ambos participantes; si uno de los dos es `null`, el bye se resuelve al instante sin crear partida.
- **`onMatchFinished`**: engancha con un enfoque de evento en vez de una llamada directa — **`apps/server/src/match/events.ts`** es un módulo nuevo y minúsculo (un único listener registrable) que evita un ciclo de imports real (`match/lifecycle.ts` → `tournaments/service.ts` → `match/service.ts` para `startNow` → de vuelta a `match/lifecycle.ts`). De paso, se extrajo `finishRuntimeAndNotify` en `lifecycle.ts` — la secuencia `disarmTurnTimer`+`broadcastEnded`+`setInGameForMatch` estaba triplicada entre los dos caminos de fin de partida; ahora es una sola función que además emite el evento. Determina el ganador por `matchPlayers.placement`; en empate (los 3 juegos actuales pueden empatar), gana el mejor sembrado — sin revancha ni desempate a mejor-de-3, decisión de alcance explícita. Marca al perdedor eliminado con su `finalPlacement`, y si la ronda queda completamente resuelta, genera la siguiente o cierra el torneo si solo quedaba una partida.
- **`recoverOnBoot`**: mismo patrón que `matchService.recoverOnBoot` (M2) — para torneos `running`, si la última ronda ya está resuelta pero no existe la siguiente, la genera. Registrado junto a la llamada ya existente en `index.ts`.

### tRPC (`apps/server/src/trpc/routers/tournaments.ts`) y frontend

Router `tournaments`: `list`/`getById` (públicos, para ver brackets sin estar inscrito), `create`/`register`/`unregister`/`checkIn`/`start`/`cancel` (protegidos). El creador de un torneo se auto-inscribe como cualquier otro participante — sin privilegios especiales salvo iniciar/cancelar. `_app.torneos.index.tsx` (lista + formulario de creación) y `_app.torneos.$id.tsx` (inscripción/check-in en `registration`; bracket en columnas por ronda con polling de 3s en `running`/`finished`; clasificación final ordenada por `finalPlacement`).

**Hallazgo reutilizado de M3**: la lista se llamó deliberadamente `_app.torneos.index.tsx` y no `_app.torneos.tsx` — con este último, TanStack Router habría tratado la lista como *layout* del detalle (`_app.torneos.$id.tsx`), exactamente el bug de `_app.mensajes.tsx` ya documentado y corregido en M3. Se detectó y corrigió antes de verificar, no después.

**Hallazgo de tipos nuevo**: `NonNullable<ReturnType<typeof trpc.x.useQuery>['data']>` para derivar el tipo del payload de una query **no funciona** en este proyecto (resuelve a `{}`) — el patrón correcto en tRPC es `inferRouterOutputs<AppRouter>['tournaments']['getById']` (de `@trpc/server`, añadido como devDependency de solo-tipos en `apps/web`, mismo patrón que ya usa `@tableria/server`).

**Verificación**: firetest con 6 usuarios reales por WebSocket (bracket de 8, 2 byes) jugado de principio a fin con tres en raya — bracket generado correctamente (2 byes para los mejores sembrados, 2 partidas reales en ronda 1), avance automático de ronda en ronda 2 y ronda 3 (final), clasificación final exacta según la fórmula de placement (campeón=1º, finalista=2º, semifinalistas empatados a 3º, ronda-1 empatados a 5º). Un segundo firetest (torneo de 2, reinicio del servidor a mitad de partida) confirmó que el estado de la partida sobrevive el reinicio y que, de forma orgánica, el timer de turno (30s) venció durante los pasos manuales del reinicio — el forfeit resultante se propagó correctamente al runner de torneos (el ganador quedó campeón, el otro eliminado en 2º puesto), validando que `onMatchFinished` engancha tanto el fin natural como el forfeit.

### Notas de alcance (deuda explícita, no bloqueante)

- Empate en una partida de torneo → gana el mejor sembrado; sin revancha.
- Sin ventana de check-in con límite de tiempo ni forfeit automático por no confirmarse.
- Un participante puede tener a la vez una partida de torneo y otra suelta sin bloqueo cruzado.
- Bracket visual sin líneas de conexión SVG (columnas + tarjetas).
- Formato suizo, byes con otros formatos, y torneos multi-juego quedan fuera de esta pasada.

`pnpm turbo lint typecheck test build` en verde (23/23); 13 tests nuevos (105 en total en el monorepo).

## M6 (parte 1) — Endurecimiento (implementado 2026-07-05)

El roadmap agrupaba en M6 tanto endurecimiento (verificable en local) como despliegue real (dominio, VPS, apps OAuth por proveedor — credenciales que no existen todavía). Preguntado por el alcance, el usuario eligió **endurecimiento primero**: 2FA, dispositivos de confianza, enlaces mágicos, accesibilidad de tableros y E2E Playwright. OAuth (arctic) y producción/backups/monitorización quedan diferidos explícitamente a una pasada posterior que sí necesita esas credenciales.

### 2FA TOTP + backup codes

**Schema** (migración `0007_blue_the_twelve.sql`): `users.totpSecret` (cifrado, nullable — null = 2FA no configurado) y `users.totpEnabledAt` (nullable — presencia = activo); tabla `twoFactorBackupCodes` (`codeHash` único, `usedAt` nullable). Primer uso real de `ENCRYPTION_KEY` (existía en `config.ts` desde M0 sin consumidor): `apps/server/src/auth/crypto.ts` gana `encryptSecret`/`decryptSecret` (AES-256-GCM, IV aleatorio por llamada, `iv.authTag.ciphertext` en base64). Nueva dependencia `otpauth` para generar el secreto/URI/QR y verificar códigos (ventana ±1 paso); `qrcode` genera el QR como data URL en el servidor (evita una dependencia de QR en el cliente).

Rutas REST nuevas en `apps/server/src/auth/routes.ts`: `/2fa/setup` (genera secreto pendiente + QR), `/2fa/enable {code}` (confirma, fija `totpEnabledAt`, genera 10 backup codes `XXXX-XXXX` — texto plano devuelto **una sola vez**, igual que una contraseña), `/2fa/disable {password}` (reautentica y borra secreto+códigos). **Login con 2FA**: tras verificar la contraseña, si `totpEnabledAt` está fijado no se crea sesión todavía — se devuelve un `challengeToken` de 5 minutos guardado en un `Map` **en memoria**, deliberadamente no persistido (`apps/server/src/auth/twoFactorChallenges.ts`): el peor caso ante un reinicio del servidor a mitad del reto es reintentar el login, no justifica una tabla. `/2fa/verify {challengeToken, code}` acepta un TOTP de 6 dígitos o un backup code (de un solo uso) y solo entonces crea la sesión real.

### Dispositivos de confianza + enlaces mágicos

**Trusted devices** (migración `0008_mixed_bill_hollister.sql`, tabla `trustedDevices`): en `/2fa/verify`, marcar "confiar en este dispositivo 30 días" emite una cookie opaca adicional `tb_trusted` y guarda una fila; en login, si esa cookie coincide con una fila válida no caducada del mismo usuario, **se salta el reto de 2FA** directamente a sesión completa. `_app.perfil.tsx` lista los dispositivos con revocar individual/total.

**Magic links** (tabla `magicLinkTokens`, mismo esquema que `passwordResets`): `/magic-link/request {identifier}` con la misma anti-enumeración que `forgot-password` (respuesta idéntica exista o no la cuenta), token de 15 min de un solo uso; `/magic-link/consume {token}` crea sesión directamente. Decisión de alcance: un enlace mágico **salta el reto de 2FA** — la posesión del correo ya es un factor suficientemente fuerte, evita encadenar dos factores de posesión (mismo tratamiento que la mayoría de proveedores). Página pública nueva `apps/web/src/routes/entrar.tsx` (mismo patrón que `restablecer.tsx`: token en `search`, consumo automático al montar).

### Accesibilidad de los tableros

Los 3 tableros ya usaban `<button>` reales (foco de teclado gratis) y el `:focus-visible` global de M1 ya existía — se añadió `aria-label` por celda/carta (interpolado vía i18n), `aria-pressed` en la selección de tres en raya, `role="grid"` en los contenedores, y una región compartida `aria-live="polite"` (`role="status"`, `sr-only`) en `_app.partida.$id.tsx` que anuncia cambios de turno y el resultado final — un único `<div>` para los tres juegos, no uno por tablero. Revisión adicional: `aria-label` en el input de chat (antes solo tenía `placeholder`). i18n resultó ya estar completo (352 claves idénticas en `es`/`en`) — sin trabajo pendiente ahí.

### E2E Playwright (`e2e/`)

Carpeta nueva, entrada literal en `pnpm-workspace.yaml` (no glob), paquete propio `@tableria/e2e` con scripts `test:e2e`/`test:e2e:ui` (deliberadamente no `test`, para no ser barridos por `turbo run test`). `playwright.config.ts` reutiliza el servidor de dev ya corriendo (`webServer.reuseExistingServer: true`) en vez de levantar una segunda instancia. Cuatro specs de flujos críticos: `auth.spec.ts` (registro→logout→login), `two-factor.spec.ts` (activar 2FA leyendo el secreto de la UI, generar el código con `otpauth` en el propio test, entrar con TOTP y luego con un backup code), `magic-link.spec.ts` (solicitar, leer el correo real de la API de MailHog decodificando quoted-printable, consumir, confirmar que reutilizarlo falla), `match.spec.ts` (dos `BrowserContext` juegan una partida de tres en raya completa por la UI real hasta ver el resultado).

**Hallazgos reales de esta pasada** (no artefactos de test — bugs de producto que los E2E expusieron):
- **IDs de campo duplicados entre páginas de auth navegables por Link** (`id="identifier"` en `login.tsx` y en `entrar.tsx`): al navegar de `/login` a `/entrar` mediante un `<Link>` (transición cliente, sin recarga completa), durante la ventana de swap del DOM un selector `#identifier` puede resolver momentáneamente al nodo antiguo de `/login` a punto de desmontarse — quien escriba ahí pierde el texto sin ningún error visible (HTML inválido de fondo: dos elementos con el mismo id en el documento). Confirmado con un script de reproducción que sondeaba `el.isConnected` tras el fill: el nodo capturado se desconectaba del documento milisegundos después. Arreglado dando a cada página su propio id (`login-identifier`/`login-password`, `magic-identifier`) — no es solo un ajuste de test, es HTML inválido real que además podría confundir gestores de contraseñas o lectores de pantalla durante la transición.
- **Colisión de `getByText` con la región `aria-live`**: el mismo texto de resultado ("¡Has ganado!") aparece tanto en el panel visual como en la región `sr-only` recién añadida en esta misma pasada — `match.spec.ts` se ajustó para acotar la búsqueda a `<p>` y no chocar con `role="status"`.
- **Rate limits de producción chocan con una suite de E2E en bucle**: `/api/auth/register` (máx. 8/15 min) y `/magic-link/request` (máx. 5/15 min) son correctos para producción pero se agotan fácilmente reproduciendo fallos a mano varias veces seguidas durante el diagnóstico — una ejecución limpia y única de los 4 specs (5 registros en total) queda cómodamente dentro del límite; no se tocó el rate-limiting de producción por conveniencia de testing.

**Verificación**: `pnpm turbo lint typecheck test build` en verde (23/23, 105 tests unitarios sin cambios — el trabajo de 2FA/enlaces mágicos se verificó vía E2E, no con unitarios nuevos); los 4 specs de Playwright en verde ejecutados juntos. (Nota de una pasada posterior, 2026-07-05: al retomar el trabajo se detectó que el flujo "confiar en este dispositivo" no tenía spec propio — se añadió `trusted-device.spec.ts` como 5º spec permanente, verificado en verde junto al resto.)

### Notas de alcance (deuda explícita, no bloqueante)

- OAuth (Discord/Twitch/Google/GitHub vía `arctic`) queda completamente fuera — necesita que el usuario cree las apps en cada consola de desarrollador.
- Despliegue a producción (tableria.app), backups y monitorización quedan para una pasada posterior explícita con credenciales de dominio/VPS.
- Sin auditoría con lector de pantalla real (no hay uno instalado en este entorno) — verificado con el árbol de accesibilidad de DevTools y navegación por teclado.

## M7 — Reversi/Othello (implementado 2026-07-05)

Primer juego de M7, elegido por el usuario para ir antes que el party game simultáneo (bajo riesgo, ya que es 1v1 de información perfecta como Conecta 4, en vez de abrir terreno nuevo de turnos simultáneos N-jugador). Sigue el mismo patrón de `packages/games/src/<juego>/` que los juegos anteriores.

**Motor** (`packages/games/src/reversi/`): tablero 8×8 plano (`Cell[64]`), las 4 fichas centrales cruzadas de la apertura estándar, movimiento único `{ type: 'place', cell } | { type: 'pass' }`. Captura en las 8 direcciones: una jugada es legal solo si encierra al menos una línea de fichas rivales entre la nueva ficha y otra propia. **Pase obligatorio modelado explícitamente como movimiento** (no como transición automática del motor): si el asiento activo no tiene ninguna jugada legal, `validateMove` rechaza cualquier `place` con `MUST_PASS` y solo acepta `{type:'pass'}`; si sí tiene jugadas legales, rechaza `pass` con `MUST_PLAY`. Fin de partida quien por tablero lleno **o** dos pases consecutivos (`passStreak` en el estado) — el conteo de discos decide ganador/empate. `playerView` añade `legalMoves: number[]` calculado para el turno activo (información perfecta, así que espectadores y ambos asientos ven la misma vista) para que la UI resalte las casillas jugables y decida cuándo ofrecer el botón de pasar.

**Bug real atrapado por los tests, no por revisión manual**: la primera versión de `applyMove` colocaba la ficha en el tablero y *después* llamaba a `flipsFor` sobre ese mismo tablero ya mutado — pero `flipsFor` devuelve `[]` en cuanto la celda de origen no está vacía (primera línea de la función), así que con la ficha ya colocada la función se autorrechazaba y **ninguna captura se aplicaba nunca**. Los tests de `applyMove` (que sí comprueban el tablero resultante celda a celda, no solo el resultado de `validateMove`) lo cazaron de inmediato; arreglo: calcular los flips sobre `state.board` (antes de la mutación) y aplicar la colocación después. 24 tests (18 del motor + los ya existentes de otros juegos sin tocar).

**Catálogo**: la fila `reversi` ya existía en `packages/db/src/seed.ts` como placeholder (`isActive:false`, sin `options`) de una pasada de scaffolding anterior — se activó (`isActive:true`, `options.defaultTurnSeconds:30`, badge `Próximamente`→`Estrategia`) y se añadió su contenido de reglas (`gameContent`, sección `rules`).

**Frontend**: `apps/web/src/games/ReversiBoard.tsx`, mismo contrato `BoardProps` que los demás tableros, registrado en el `BOARD_COMPONENTS` de `_app.partida.$id.tsx`. Reutiliza los tokens de color ya establecidos para juegos de dos bandos (`bg-tb-accent`/`bg-tb-warn`, los mismos que Conecta 4) en vez de intentar un blanco/negro literal, para mantener consistencia visual con el resto del catálogo bajo ambos temas. Casillas con jugada legal llevan un anillo sutil (`ring-tb-accent/50`) y su propio texto a11y (`partida.a11y.legalMove`); cuando el jugador activo no tiene ninguna jugada legal aparece un aviso con botón "Pasar turno" (`partida.mustPass`/`partida.pass`, nuevas claves i18n `es`/`en`, en paridad). Aria-labels reutilizan literalmente la clave `partida.a11y.cell` ya usada por tres en raya (`"Fila X, columna Y: contenido"`), sin inventar un formato nuevo.

**Verificación**: `pnpm turbo lint typecheck test build` en verde (23/23, 24 tests nuevos). E2E nuevo `e2e/tests/reversi.spec.ts` (dos `BrowserContext` reales): A abre mesa, ambos listos, A juega la única apertura legal (fila 3, columna 4), la captura de la ficha diagonal (fila 4, columna 4) se refleja como "tu ficha"/"ficha rival" correctamente para ambos lados en vivo, B recibe sus propias jugadas legales resaltadas y captura de vuelta, visible también para A. No se jugó la partida completa (60+ movimientos) en el E2E — el motor ya está agotado exhaustivamente por los 18 tests unitarios (aperturas, capturas multi-dirección, pase forzado/rechazado, fin por tablero lleno, fin por doble pase, empate); el E2E cubre la parte que las unitarias no pueden, la integración real lobby→WS→UI con dos clientes.

## M7 — Pista Única: party game cooperativo 3-8 jugadores (implementado 2026-07-05)

El usuario pidió un juego "al estilo Just One": cooperativo, con pistas simultáneas de una palabra y anulación de coincidencias. Es la pieza que faltaba para ejercitar de verdad `activePlayers` devolviendo **varios asientos a la vez** — hasta ahora ningún juego real lo hacía (todos eran 1v1 por turnos) — y mesas de aforo variable (3-8), algo que tampoco existía en el lobby.

### Motor (`packages/games/src/pista-unica/`)

Tantas rondas como jugadores; cada jugador adivina exactamente una vez, rotando por orden de asiento (`guesser === round`). En cada ronda: fase `clue` (todos los asientos salvo el adivinador están activos a la vez y mandan `{type:'clue', word}`) → al llegar la última pista se resuelven duplicados (normalizados por mayúsculas/acentos vía NFD) y se invalidan las que coinciden entre sí → fase `guess` (solo el adivinador activo, manda `{type:'guess', word}`) → la ronda anota punto si acierta y rota a la siguiente. Fin de partida: el equipo gana si acierta al menos la mitad de las rondas — `checkEnd` da el mismo `placement:1` y el mismo `result` ('win'/'lose') a **todos** los asientos (cooperativo, no hay ranking interno); esto reutiliza sin cambios el banner genérico de fin de partida (lee `ranking.find(r=>r.seat===mySeat).result`) y hace que `upsertStats` cuente la victoria/derrota del equipo como propia de cada jugador. Palabras pre-sorteadas en `setup()` (única función con `rng`) y guardadas en `state.words` — igual que Brisca guarda el mazo completo — sin exponerse nunca en `playerView`. 22 tests: rotación de adivinador, invalidación de duplicados, pase de fase, victoria/derrota del equipo, y sobre todo la matriz de visibilidad (`playerView`): el adivinador nunca ve la palabra secreta ni las pistas ajenas hasta que se resuelven; los demás ven la palabra pero solo su propia pista mientras dura la fase de pistas; todo se revela (incluso al adivinador) una vez la partida termina.

### Runtime del servidor: soporte real de turnos simultáneos (`apps/server/src/match/lifecycle.ts`)

Este era el verdadero riesgo de M7, no el motor del juego: el runtime de M2 nunca había sido puesto a prueba con `activePlayers().length > 1`, y tenía dos asunciones ocultas que solo se rompen con un juego así:

1. **`applyPlayerMove` reiniciaba el `turnDeadlineAt` en cada movimiento**, asumiendo que un movimiento siempre cierra la ronda de alguien. Con varios asientos activos a la vez, el primero en mandar su pista alargaría el plazo para los que aún no han mandado la suya. Arreglo: tras aplicar un movimiento se compara `activePlayers` de antes y de después; si el conjunto de después es subconjunto del de antes (la ronda solo se ha ido vaciando), el deadline **no se toca**; si aparece un asiento nuevo (cambio real de fase/ronda, p.ej. pasa a adivinar el guesser), sí se rearma con un plazo nuevo.
2. **`handleTurnTimeout` solo forzaba `active[0]`** al vencer el plazo — con un solo asiento activo (todos los juegos anteriores) era correcto sin más; con varios, el resto se quedaría esperando un movimiento que nunca llegaría. Arreglo: itera sobre **todos** los asientos activos en el momento del disparo, recalculando qué sigue activo en cada vuelta (por si aplicar el de uno ya resolvió la ronda para los demás).
3. Combinar 1+2 abrió un bug de reentrada: al forzar el primer rezagado dentro de un timeout ya vencido, el punto 1 mantiene el deadline sin cambios (mismo round) — pero ese deadline sigue estando en el **pasado**, y el rearme automático de `applyPlayerMove` lo agendaba con `delay≈0`, disparando un `handleTurnTimeout` duplicado casi al instante mientras el bucle original todavía seguía forzando al resto. Arreglo (mismo criterio que ya usaba `recoverOnBoot` al arrancar con partidas cuyo turno venció mientras el proceso estaba caído): no rearmar ningún timer si el deadline ya pasó.

`onTurnTimeout` de Pista Única nunca hace forfeit (cooperativo: nadie debería perder la partida entera por ir lento) — rellena una pista/adivinanza en blanco por defecto y deja que la ronda siga.

### Aforo variable en el lobby (3-8 jugadores elegibles)

Hasta ahora todo juego tenía `minPlayers === maxPlayers` en el catálogo y `matches.create` fijaba `maxPlayers` directamente al valor del catálogo. `matches.create` gana un `numPlayers` opcional (validado entre `game.minPlayers` y `game.maxPlayers`); el resto del pipeline (`registry`/`service`/`broadcast`/`/sala/$code`) ya leía `maxPlayers` de la fila real de la partida, no del catálogo, así que no hizo falta tocar nada más ahí. En el frontend (`_app.juegos.$slug.tsx`), `GameLobby` añade un selector de chips "Número de jugadores" que solo aparece cuando `minPlayers !== maxPlayers` — en el resto de juegos (todos fijos a 2 hoy) la UI queda exactamente igual que antes.

### Frontend

`PistaUnicaBoard.tsx`: fase de pistas (input propio + "ya mandaste: X" tras enviar), fase de adivinanza (chips de pistas recibidas, tachadas las anuladas, input de adivinanza solo para el adivinador), historial de rondas ya resueltas (visible para todos, sin riesgo de spoiler porque son rondas cerradas) haciendo de "revelado" de cada ronda sin necesitar una fase de transición aparte. El banner genérico "Te toca a ti"/"Turno del rival" de `_app.partida.$id.tsx` se oculta para este juego en concreto (su propio tablero ya explica el turno con más matiz: "eres quien adivina", pistas pendientes, etc. — "turno del rival" no encaja en un juego cooperativo de hasta 8).

### Verificación

`pnpm turbo lint typecheck test build` en verde (23/23, 22 tests nuevos). E2E `e2e/tests/pista-unica.spec.ts` con **3 `BrowserContext` reales**, un solo test que cubre las dos rondas más delicadas: ronda 0 con B y C mandando pista de verdad **a la vez** (turnos simultáneos reales, no simulados) y verificación cruzada de visibilidad (palabra secreta oculta para A, pistas de cada uno ocultas entre sí hasta resolverse, reveladas correctamente después); ronda 1 con **ni A ni C mandando pista**, dejando vencer el deadline de 15s a propósito para demostrar que el runtime fuerza a los dos rezagados (no solo al primero) y que el reloj de la fase siguiente se rearma bien, sin quedarse colgado ni disparar timeouts duplicados.

**Hallazgo operativo (no de producto)**: con 7 specs E2E y todas registrando usuarios nuevos, la suite completa ya no cabe en una sola pasada bajo el rate-limit de producción de `/api/auth/register` (8/15 min) — hoy suma 11 registros si se cuentan todos los specs juntos. Se verificó corriendo en dos tandas con reinicio del servidor entre medias (que limpia el limitador en memoria al instante) en vez de tocar el límite de producción por conveniencia de testing, mismo criterio que ya se documentó en M6.

### `legacy/` eliminada (2026-07-05)

Cerraba M7 y el roadmap completo. `legacy/` nunca estuvo trackeada por git (vivía fuera del repo desde M0, listada en `.gitignore` por contener credenciales de BD hardcodeadas de la v1), así que borrarla del disco no toca el historial — solo se quitó la entrada ya inerte de `.gitignore`. Los esquemas SQL de referencia de la v1 (`docs/legacy-schema/`) sí siguen en el repo, son la única parte que merecía conservarse.

**Roadmap M0-M7 completo.** Próximos pasos posibles, todos fuera del roadmap original y a decidir por el usuario: M6 parte 2 (OAuth + despliegue a producción, diferida por falta de credenciales), torneos suizos (diferidos en M5), más juegos, o pulir deuda técnica acumulada (p.ej. Brisca fijo a 2 jugadores pese a soportar 2-4 en el motor).
