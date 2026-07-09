# Plan: experiencia de fin de partida (estilo BoardGameArena)

> Estado vivo del plan — marcar cada fase al completarla y desplegarla. Si una sesión de
> trabajo se corta a mitad, este documento dice exactamente por dónde retomar.

## Objetivo

Hoy el fin de partida es un modal mínimo (medalla, "has ganado/perdido", delta de rating propio,
enlace al catálogo). Queremos una experiencia completa inspirada en BoardGameArena (referencia,
no copia): panel de resultados con pestañas, clasificación completa de la mesa, desglose de
puntos por juego (por pareja/grupo cuando aplique), estadísticas de los jugadores en ese juego,
y acciones de revancha / jugar otra vez / volver al lobby. Además, un fondo de mesa más
atractivo. Debe funcionar en los 10 juegos actuales y aplicar automáticamente a los futuros
(estructura genérica + hueco opcional por juego).

## Hallazgos de la exploración (2026-07-07)

- **Bug de base**: al recargar `/partida/$id` de una partida `finished`, el servidor reenvía
  `match.state` (vista final) pero nunca `match.ended` → el resultado desaparece con un F5
  (`apps/server/src/match/service.ts` — `syncAfterAttach` no reenvía ended; `broadcastEnded`
  solo se emite en vivo desde `lifecycle.ts`). Una partida `abandoned` ni siquiera rehidrata el
  engine (`ensureRuntime` solo cubre `in_game|finished`) → la página queda en el esqueleto de
  carga para siempre.
- Todo lo necesario para reconstruir el resultado ya está persistido:
  `matchPlayers.placement/ratingBefore/ratingAfter`, `matches.stateSnapshot`, `finishedAt`,
  `options`. Estadísticas por usuario+juego: `userGameStats` (played/wins/losses/draws) y
  `userGameRatings` (rating/peakRating); `ratings.mySummary` ya las expone.
- Invitaciones: backend completo (`dm.send kind:'invite'`, notificación `'invited'` con
  `{matchId, code}`; `NotificationBell.tsx` ya la renderiza con botón de unirse). Falta solo el
  emisor — reutilizable para la revancha.
- `matches.create` acepta todos los campos para clonar una mesa; `variant` vive en
  `matches.options.variant`. No existe endpoint `rematch`.
- CSS: tema por variables `--tb-*` con `data-theme`; no existe textura de fondo de mesa.

## Fases

### [x] Fase 0 — Rehidratación del resultado (fundación, obligatoria) — desplegada 2026-07-07

Sin esto, cualquier panel de resultados se rompe con un F5.

- `matches.endReason` nueva columna (enum `completed|forfeit|abandoned`, nullable; históricos
  sin valor → `completed`), escrita en los tres cierres (`finishRuntimeAndNotify` /
  `forfeitMatch` / `requestMutualAbandon` en `apps/server/src/match/lifecycle.ts`).
- `apps/server/src/match/service.ts`:
  - `ensureRuntime`: rehidratar engine también para `abandoned`.
  - `syncAfterAttach` (y el camino de `match.watch`): si `state ∈ {finished, abandoned}`,
    tras `broadcastState` enviar también `match.ended` a ese socket, reconstruyendo el payload
    desde BD: `ranking` desde `matchPlayers.placement` (empate arriba = draw, igual que los
    engines), `ratingDeltas` desde `ratingBefore/After` (null si no rated o abandono),
    `reason` desde `endReason`.
- Sin cambios de protocolo (el mensaje `match.ended` ya existe).
- Verificación: F5 sobre partida acabada → el resultado sigue visible; partida abandonada →
  ya no se queda en blanco.

**Nota de implementación**: en el abandono mutuo (`requestMutualAbandon`), el código ponía
`runtime.engine = null` tras cerrar — eso dejaba el runtime cacheado en memoria sin motor para
siempre (hasta un reinicio del proceso), así que quien reconectaba en la misma sesión del server
seguía viendo una página en blanco pese al fix. Se quitó esa línea: como `state` ya pasa a
`'abandoned'` en BD, `applyPlayerMove` sigue rechazando cualquier movimiento posterior igual que
antes, y ahora el runtime se comporta como en `finishRuntimeAndNotify` (engine conservado).
Verificado con Playwright (spec temporal, borrado tras la verificación): partida por forfeit y
partida por abandono mutuo, ambas sobreviven a F5 y a navegar fuera y volver por URL directa.

### [x] Fase 1 — Panel de fin de partida con pestañas (genérico, todos los juegos) — desplegada 2026-07-10

- Nuevo `apps/web/src/components/MatchEndPanel.tsx`, montado desde `_app.partida.$id.tsx`
  cuando `ended` existe (reemplaza el modal actual y la píldora "Ver resultado"):
  - Pestañas: **Resultado** | **Situación final**. La segunda oculta el panel y muestra el
    tablero final (ya queda inerte); la barra de pestañas queda fija para volver.
  - Pestaña Resultado: titular (ganador/es + motivo, caso especial cronolito conservado),
    **clasificación completa** (una fila por asiento: avatar+nombre, placement, resultado,
    rating before→after con delta — de todos, no solo el propio; en tute agrupado por pareja),
    hueco `<GameSummary/>` (se rellena en Fase 2) y bloque de acciones (Fase 3 activa
    revancha/jugar otra vez; en esta fase "volver a la ficha del juego" + "jugar otra vez"
    como enlace simple al lobby del juego).
  - El chat de mesa sigue disponible al lado, como en BGA.
- i18n ES/EN completo.

### [x] Fase 2 — Desglose por juego + estadísticas de los jugadores — desplegada 2026-07-10

- Mapa `SUMMARY_COMPONENTS[gameId]` (patrón `BOARD_COMPONENTS`) con componente opcional por
  juego que recibe la vista final: Brisca (rondas ganadas + puntos última ronda), Tute/Cabrón
  (por pareja/individual), Escoba (marcador + desglose última mano), Reversi (fichas),
  Timbiriche (casillas), Pista Única (rondas acertadas), Cronolito (línea temporal /
  estabilizadores). Sin componente → no se pinta nada (fallback para juegos futuros).
- Nuevo `ratings.gameStats({ gameId, userIds })`: por jugador de la mesa → partidas jugadas,
  V/D/E, rating actual y pico en ese juego. Bloque "Vuestro historial en {juego}" con
  mini-tabla comparativa.

### [x] Fase 3 — Revancha y jugar otra vez — desplegada 2026-07-10

- tRPC `matches.rematch({ matchId, invite })`: valida que el llamante jugó la partida y que
  está `finished/abandoned`; clona la config (`gameId, isPrivate, mode, turnDurationS,
  options.variant, maxPlayers`); sienta al llamante en seat 0; con `invite: true` notifica
  `'invited'` a los demás jugadores de la partida original (campana existente con botón de
  unirse). Devuelve `{matchId, code}` → el front navega a `/sala/$code`.
- Botones del panel: "Proponer revancha" (con invitaciones) y "Jugar otra vez" (mesa pública
  sin invitaciones). Tras proponer, el botón pasa a "Esperando a los rivales…".
- Edge cubierto por lógica existente: rival sentado en otra mesa → `join` devuelve su error.

**Nota de implementación**: "Jugar otra vez" pasó de ser un `<Link>` estático al catálogo del
juego a llamar también a `matches.rematch` (con `invite: false`) y navegar directo a la mesa
nueva — clona la configuración exacta (variante, reloj, privacidad) en vez de obligar a
reconfigurar desde cero. El estado "Esperando a los rivales…" es local al panel (no hay
polling ni WS en vivo de quién ha aceptado la invitación todavía): al proponer, el botón se
convierte en un enlace directo a `/sala/$code` de la mesa nueva, que ya muestra en vivo quién
se ha ido sentando — no hizo falta duplicar ese estado aquí. La notificación `'invited'`
reutiliza el mecanismo interno de `SocialService` (`activity.record` + `notify`/push por WS)
a través de un método nuevo, `notifyMatchInvite`, en vez de forzar el envío por `dm.send
kind:'invite'` (que exige una conversación de DM existente entre los jugadores, algo que no
siempre hay).

### [x] Fase 4 — Estética de la mesa — desplegada 2026-07-10

- Fondo "tapete" para la página de partida con CSS puro (gradientes/patrón SVG inline en
  `app.css`, sin assets externos), variables `--tb-table-*` con variantes clara/oscura.
  Tablero y tarjetas con marco/sombra que las separe del tapete.
- Pulido del panel (medallas por placement, jerarquía, animaciones con `.tb-modal-in` /
  `.tb-fade-in-up`).
- Verificación visual con Playwright en tema claro y oscuro.

**Nota de implementación**: el tapete (`.tb-table-felt` en `app.css`) reutiliza el azul de marca
en vez de un verde de casino genérico, con un patrón de fichas hexagonales (mismo perfil que
`.tb-hex`, la firma visual ya establecida del logo/tokens) a muy baja opacidad — sin asset
externo, todo vía SVG embebido en `background-image`. Solo envuelve tablero+chat (dentro de
`_app.partida.$id.tsx`); la cabecera (jugadores, zoom, reloj, botones de abandono) se quedó
fuera del tapete a propósito, porque los tonos de texto `--tb-text`/`--tb-muted` están afinados
para fondos neutros y perderían contraste sobre el azul oscuro del tapete en tema claro. Tablero
y chat ahora son tarjetas `bg-tb-surface/95` con `backdrop-blur-sm` y sombra para leerse como
objetos sobre la mesa. Medallas: barra de acento a la izquierda de la fila (oro/plata/bronce, vía
`.tb-medal-1/2/3`) independiente del resaltado de "eres tú" (acento de marca), para que ambas
señales convivan. Verificado visualmente con una ruta de depuración + Playwright (borradas tras
la verificación) en ambos temas — sin tocar el backend real en ningún momento.

## Verificación y despliegue (tras cada fase)

- `pnpm typecheck && pnpm lint && pnpm test` (vía SSH en el 101).
- E2E con Playwright (spec temporal + dev server aislado en el 101, BD dev con
  `docker compose -p tableria-dev`): partida completa → panel con ranking → F5 → panel sigue →
  "Situación final" muestra el tablero → revancha con dos navegadores (Fase 3).
- Deploy: `docker --context tableria-101 compose -f docker-compose.prod.yml up -d --build`.
