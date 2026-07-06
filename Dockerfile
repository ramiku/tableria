# Imagen de producción: un solo contenedor que sirve la API (Fastify/tRPC/WS)
# y los estáticos ya compilados del frontend desde el mismo origen — ver
# `apps/server/src/app.ts` (WEB_DIST_PATH) y docs/deploy.md.
#
# Deliberadamente NO se usa `pnpm deploy` para podar node_modules: esta imagen
# copia el monorepo entero ya construido tal cual. Es más pesada, pero no
# depende de las reglas de empaquetado de cada paquete del workspace — con un
# monorepo con varios `packages/*` enlazados, esa vía es más difícil de
# verificar que de simplemente copiarlo todo.
FROM node:22-slim AS build

WORKDIR /repo

# Mismo pnpm que fija "packageManager" en package.json — reproducible.
RUN corepack enable && corepack prepare pnpm@10.34.4 --activate

# El .dockerignore ya excluye node_modules/dist/.turbo/.git del contexto.
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build

ENV NODE_ENV=production
ENV WEB_DIST_PATH=/repo/apps/web/dist
EXPOSE 3000

CMD ["node", "apps/server/dist/index.js"]
