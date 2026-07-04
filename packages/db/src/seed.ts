/**
 * Seed de desarrollo: categorías y catálogo de juegos.
 * (Los usuarios demo llegan en M1, cuando exista el hashing de contraseñas.)
 *
 * Ejecutar: pnpm db:seed
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createDb, gameCategories, games, gameContent } from './index.js';

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
    badge: 'Próximamente',
    coverBg: '#26466e',
    coverFg: '#e8f0fb',
    description: 'Deja caer tus fichas y alinea cuatro antes que tu oponente.',
    isActive: false,
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
];

async function main() {
  await db.insert(gameCategories).values(categories).onConflictDoNothing();
  await db.insert(games).values(catalog).onConflictDoNothing();
  await db.insert(gameContent).values(content).onConflictDoNothing();
  console.log(`Seed OK: ${categories.length} categorías, ${catalog.length} juegos.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed FALLÓ:', err);
  process.exit(1);
});
