# Tableria

Plataforma online para jugar a juegos de mesa con amigos — mesas en tiempo real,
chat, rankings y torneos. Objetivo funcional: lo que ofrece BoardGameArena, con
una experiencia más cómoda y moderna.

## Stack (v2 — reescritura full-stack TypeScript)

- **Monorepo**: pnpm workspaces + Turborepo
- **Backend**: Node 22 + Fastify 5 (HTTP + tRPC v11 + WebSocket en un solo proceso)
- **BD**: PostgreSQL 17 (Docker) + Drizzle ORM con migraciones SQL versionadas
- **Frontend**: React 19 + Vite + TanStack Router/Query + Zustand + Tailwind CSS 4
- **Validación**: Zod en todas las fronteras (API, WS, movimientos de juego, config)
- **i18n**: i18next (`es` por defecto, `en`)
- **Tests**: Vitest + Playwright

## Estructura

```
apps/
  server/     Fastify: API + WS + workers (un único proceso)
  web/        SPA React
packages/
  db/         esquema Drizzle + migraciones + seed
  engine/     motor de juego genérico (TS puro, sin IO)
  games/      definiciones de juegos (tres-en-raya, conecta-cuatro, brisca, reversi, pista-unica)
  protocol/   contratos Zod compartidos (mensajes WS, DTOs)
  config/     tsconfig/eslint compartidos
docs/
  legacy-schema/   esquemas SQL de la v1 (referencia)
```

La v1 (PHP + XAMPP) vivió en `legacy/` como referencia durante la migración; se eliminó del disco al cerrar M7 (nunca estuvo trackeada por git, así que no queda en el historial).

## Desarrollo

Requisitos: Node >= 22, pnpm >= 10, Docker Desktop.

```powershell
# 1. Infraestructura (Postgres 17 + MailHog)
docker compose up -d

# 2. Dependencias
pnpm install

# 3. Entorno
Copy-Item .env.example .env    # y ajustar si hace falta

# 4. Migraciones + seed
pnpm db:migrate
pnpm db:seed

# 5. Arrancar todo (server :3000 + web :5173)
pnpm dev
```

- App: http://localhost:5173
- API: http://localhost:3000 (health: `/health`)
- MailHog (correo de dev): http://localhost:8025

## Roadmap

| Fase | Contenido | Estado |
|------|-----------|--------|
| M0 | Esqueleto monorepo, BD, CI, shell SPA | ✅ |
| M1 | Auth (registro/login/recuperación) + catálogo real vía tRPC | ✅ |
| M2 | Motor de juego genérico + tres-en-raya + lobby N jugadores en tiempo real | ✅ |
| M3 | Social: amigos, presencia, chat persistente, notificaciones | ✅ |
| M4 | Ratings Glicko-2, leaderboards + Conecta 4 + Brisca | ✅ |
| M5 | Torneos (single-elim, suizo) | ✅ |
| M6 | 2FA, dispositivos de confianza, magic links, a11y, E2E (parte 1) | ✅ |
| M7 | Reversi + Pista Única (party 3-8 jugadores); retirar legacy | ✅ |

**Roadmap M0-M7 completo.** Post-roadmap (en curso, sin fecha de cierre): Brisca a 2-4 jugadores,
prototipo visual 3D con Three.js (Conecta 4), rediseño del lobby de partida (mesas de amigos,
salas públicas agrupadas, partidas "sin tiempo"), y un sistema de reputación de usuarios.
Pendiente y sin credenciales aún: M6 parte 2 (OAuth, despliegue a producción).

El detalle completo de cada fase (decisiones, bugs encontrados, verificación) está en
`docs/architecture.md`.
