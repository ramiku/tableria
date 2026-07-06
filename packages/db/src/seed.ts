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
    // El motor soporta 2-4 desde M4; el lobby ganó el selector de aforo variable en M7 (Pista Única).
    minPlayers: 2,
    maxPlayers: 4,
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
    badge: 'Estrategia',
    coverBg: '#1d3a2f',
    coverFg: '#e9f4ee',
    description: 'Voltea las fichas de tu rival y domina el tablero.',
    isActive: true,
    options: { defaultTurnSeconds: 30 },
  },
  {
    id: 'pista-unica',
    name: 'Pista Única',
    categorySlug: 'party',
    minPlayers: 3,
    maxPlayers: 8,
    durationMin: 15,
    badge: 'Cooperativo',
    coverBg: '#5b3a7a',
    coverFg: '#f3ecfb',
    description: 'Da una pista de una palabra para que el adivinador acierte la palabra secreta — pero si alguien más piensa lo mismo que tú, ambas pistas se anulan.',
    isActive: true,
    options: { defaultTurnSeconds: 60 },
  },
  {
    id: 'timbiriche',
    name: 'Timbiriche',
    categorySlug: 'clasicos',
    minPlayers: 2,
    maxPlayers: 4,
    durationMin: 15,
    badge: 'Clásico',
    coverBg: '#6e3b1f',
    coverFg: '#fbeee3',
    description: 'Traza líneas entre puntos y cierra casillas para hacerlas tuyas — completar una te da otro turno.',
    isActive: true,
    options: { defaultTurnSeconds: 30 },
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
  {
    gameId: 'reversi',
    sectionKey: 'rules',
    body: 'Tablero de 8×8. Empiezan 4 fichas cruzadas en el centro y mueven las oscuras. Por turnos, cada jugador coloca una ficha en una casilla vacía que encierre, en línea recta (horizontal, vertical o diagonal), una o más fichas rivales entre la nueva ficha y otra propia; todas las fichas encerradas se voltean al color del jugador. Si no tienes ninguna jugada legal, pasas turno. La partida termina cuando el tablero se llena o ambos jugadores pasan seguido; gana quien tiene más fichas de su color en el tablero.',
  },
  {
    gameId: 'pista-unica',
    sectionKey: 'rules',
    body: 'Juego cooperativo de 3 a 8 jugadores. Cada partida tiene tantas rondas como jugadores: en cada ronda, uno de vosotros es el adivinador y ve todo menos la palabra secreta; el resto la ve y, a la vez y en secreto, escribe una pista de una sola palabra para ayudar a adivinarla. Antes de mostrarlas, se anulan las pistas que coincidan entre sí (aunque sea con distinto acento o mayúsculas) — si dos personas piensan lo mismo, ninguna de las dos pistas cuenta. El adivinador ve las pistas que sobrevivieron e intenta acertar la palabra. Ganáis todos juntos si aciertan al menos la mitad de las rondas.',
  },
  {
    gameId: 'timbiriche',
    sectionKey: 'rules',
    body: 'De 2 a 4 jugadores sobre una rejilla de puntos (8×8, 9×9 o 10×10 casillas, a elegir). Por turnos, cada jugador traza una línea entre dos puntos adyacentes libres. Si al trazarla completas el cuarto lado de una casilla, la casilla pasa a ser tuya y juegas otra vez; si no completas ninguna, el turno pasa al siguiente jugador. La partida termina cuando todas las casillas tienen dueño; gana quien más casillas ha reclamado.',
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
