/**
 * Seed de desarrollo: categorías y catálogo de juegos.
 * (Los usuarios demo llegan en M1, cuando exista el hashing de contraseñas.)
 *
 * Ejecutar: pnpm db:seed
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createDb, eq, gameCategories, games, gameContent, seasons, sql } from './index.js';

config({ path: resolve(import.meta.dirname, '../../../.env') });

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgres://tableria:tableria_dev@localhost:5432/tableria';

const db = createDb(databaseUrl);

const categories = [
  { slug: 'clasicos', name: 'Clásicos', sortOrder: 1 },
  { slug: 'estrategia', name: 'Estrategia', sortOrder: 2 },
  { slug: 'cartas', name: 'Cartas', sortOrder: 3 },
  { slug: 'party', name: 'Party', sortOrder: 4 },
];

const catalog = [
  {
    id: 'tres-en-raya',
    name: '3 en raya',
    categorySlug: 'clasicos',
    minPlayers: 2,
    maxPlayers: 2,
    durationMin: 5,
    badge: 'Rápido',
    coverBg: '#2f6f4f',
    coverFg: '#eaf6ef',
    description: 'El clásico de siempre: consigue tres en línea antes que tu rival.',
    isActive: true,
    options: { defaultTurnSeconds: 30 },
  },
  {
    id: 'conecta-cuatro',
    name: 'Conecta 4',
    categorySlug: 'clasicos',
    minPlayers: 2,
    maxPlayers: 2,
    durationMin: 10,
    badge: 'Rápido',
    coverBg: '#26466e',
    coverFg: '#e8f0fb',
    description: 'Deja caer tus fichas y alinea cuatro antes que tu oponente.',
    isActive: true,
    options: { defaultTurnSeconds: 30 },
  },
  {
    id: 'brisca',
    name: 'Brisca',
    categorySlug: 'cartas',
    // El motor soporta 2-4 (ver packages/games/src/brisca), pero el lobby aún no
    // permite elegir tamaño de mesa: se lanza fijo a 2 hasta que M5+ añada esa opción.
    minPlayers: 2,
    maxPlayers: 2,
    durationMin: 15,
    badge: 'Cartas',
    coverBg: '#7a2f3a',
    coverFg: '#fbe9ec',
    description: 'Baraja española, palo de triunfo y bazas: consigue más puntos que tu rival.',
    isActive: true,
    options: { defaultTurnSeconds: 30 },
  },
  {
    id: 'reversi',
    name: 'Reversi',
    categorySlug: 'estrategia',
    minPlayers: 2,
    maxPlayers: 2,
    durationMin: 20,
    badge: 'Próximamente',
    coverBg: '#1d3a2f',
    coverFg: '#e9f4ee',
    description: 'Voltea las fichas de tu rival y domina el tablero.',
    isActive: false,
  },
];

const content = [
  {
    gameId: 'tres-en-raya',
    sectionKey: 'rules',
    body: 'Cada jugador coloca por turnos una ficha en una casilla libre del tablero de 3×3. Gana quien consigue alinear tres fichas propias en horizontal, vertical o diagonal. Si el tablero se llena sin línea, la partida termina en empate.',
  },
  {
    gameId: 'conecta-cuatro',
    sectionKey: 'rules',
    body: 'Cada jugador deja caer por turnos una ficha en una de las 7 columnas del tablero; la ficha cae hasta la posición más baja libre de esa columna. Gana quien consigue alinear cuatro fichas propias en horizontal, vertical o diagonal. Si el tablero (7×6) se llena sin línea, la partida termina en empate.',
  },
  {
    gameId: 'brisca',
    sectionKey: 'rules',
    body: 'Baraja española de 40 cartas. Cada jugador recibe 3 cartas; se destapa la siguiente como palo de triunfo. Por turnos, cada jugador juega cualquier carta de su mano (no hay obligación de asistir al palo). Gana la baza el triunfo más alto jugado; si nadie juega triunfo, la carta más alta del palo que abrió la mano. Quien gana la baza se lleva los puntos (As=11, 3=10, Rey=4, Caballo=3, Sota=2, resto=0), roba primero del mazo y abre la siguiente baza. La partida termina cuando el mazo y las manos se agotan; gana quien más puntos ha sumado.',
  },
];

async function main() {
  await db.insert(gameCategories).values(categories).onConflictDoNothing();

  // Upsert (no doNothing): cada milestone reactiva/actualiza filas ya sembradas
  // en pasadas anteriores (p.ej. conecta-cuatro pasa de isActive:false a true en M4).
  await db
    .insert(games)
    .values(catalog)
    .onConflictDoUpdate({
      target: games.id,
      set: {
        name: sql`excluded.name`,
        categorySlug: sql`excluded.category_slug`,
        minPlayers: sql`excluded.min_players`,
        maxPlayers: sql`excluded.max_players`,
        durationMin: sql`excluded.duration_min`,
        badge: sql`excluded.badge`,
        coverBg: sql`excluded.cover_bg`,
        coverFg: sql`excluded.cover_fg`,
        description: sql`excluded.description`,
        isActive: sql`excluded.is_active`,
        options: sql`excluded.options`,
      },
    });
  await db
    .insert(gameContent)
    .values(content)
    .onConflictDoUpdate({ target: [gameContent.gameId, gameContent.sectionKey], set: { body: sql`excluded.body` } });

  const [existingSeason] = await db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);
  if (!existingSeason) {
    await db.insert(seasons).values({ name: 'Temporada 1', isActive: true });
  }

  console.log(`Seed OK: ${categories.length} categorías, ${catalog.length} juegos.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed FALLÓ:', err);
  process.exit(1);
});
