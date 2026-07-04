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
  games/      definiciones de juegos (tres-en-raya, conecta-cuatro, …)
  protocol/   contratos Zod compartidos (mensajes WS, DTOs)
  config/     tsconfig/eslint compartidos
docs/
  legacy-schema/   esquemas SQL de la v1 (referencia)
legacy/       implementación v1 (PHP + XAMPP) — solo referencia local, fuera de git
```

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
| M0 | Esqueleto monorepo, BD, CI, shell SPA | 🔨 |
| M1 | Auth (registro/login/verificación) + catálogo | ⬜ |
| M2 | Motor de juego genérico + tres-en-raya + lobby N jugadores | ⬜ |
| M3 | Social: amigos, presencia, chat persistente, notificaciones | ⬜ |
| M4 | Ratings Glicko-2, leaderboards + Conecta 4 + juego de cartas | ⬜ |
| M5 | Torneos (single-elim, suizo) | ⬜ |
| M6 | 2FA, OAuth, magic links, a11y, i18n en, producción | ⬜ |
| M7 | Reversi + party game; retirar legacy | ⬜ |

El plan de arquitectura completo está en `docs/architecture.md`.
