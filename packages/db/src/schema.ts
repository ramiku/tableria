import {
  boolean,
  char,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';

// citext: comparación case-insensitive para username/email
// (la extensión se crea en la migración 0000)
const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  },
});

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

// ---------------------------------------------------------------------------
// Usuarios y sesiones
// ---------------------------------------------------------------------------

export const presenceEnum = pgEnum('presence', ['online', 'away', 'in_game', 'offline']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(uuidv7),
  username: citext('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  email: citext('email').notNull().unique(),
  passwordHash: text('password_hash'),
  avatarInitial: varchar('avatar_initial', { length: 4 }),
  avatarColor: varchar('avatar_color', { length: 16 }),
  statusMessage: text('status_message'),
  presence: presenceEnum('presence').notNull().default('offline'),
  lastSeenAt: timestamptz('last_seen_at'),
  emailVerifiedAt: timestamptz('email_verified_at'),
  disabledAt: timestamptz('disabled_at'),
  disabledReason: text('disabled_reason'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Solo se guarda el SHA-256 del token opaco; el token vive en la cookie
    tokenHash: char('token_hash', { length: 64 }).notNull().unique(),
    ip: varchar('ip', { length: 45 }),
    userAgent: text('user_agent'),
    twoFactorPassed: boolean('two_factor_passed').notNull().default(false),
    persistent: boolean('persistent').notNull().default(false),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    lastUsedAt: timestamptz('last_used_at').notNull().defaultNow(),
    expiresAt: timestamptz('expires_at').notNull(),
    revokedAt: timestamptz('revoked_at'),
    revokedReason: text('revoked_reason'),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

export const passwordResets = pgTable(
  'password_resets',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // HMAC-SHA256(token, SESSION_PEPPER); el token en claro solo vive en el enlace del email
    tokenHash: char('token_hash', { length: 64 }).notNull().unique(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    expiresAt: timestamptz('expires_at').notNull(),
    consumedAt: timestamptz('consumed_at'),
  },
  (t) => [index('password_resets_user_idx').on(t.userId)],
);

// ---------------------------------------------------------------------------
// Catálogo de juegos
// ---------------------------------------------------------------------------

export const gameCategories = pgTable('game_categories', {
  slug: varchar('slug', { length: 64 }).primaryKey(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const games = pgTable('games', {
  // slug legible: 'tres-en-raya'
  id: varchar('id', { length: 64 }).primaryKey(),
  name: text('name').notNull(),
  categorySlug: varchar('category_slug', { length: 64 }).references(() => gameCategories.slug, {
    onDelete: 'set null',
  }),
  minPlayers: smallint('min_players').notNull().default(2),
  maxPlayers: smallint('max_players').notNull().default(2),
  durationMin: smallint('duration_min'),
  badge: varchar('badge', { length: 32 }),
  coverBg: varchar('cover_bg', { length: 16 }),
  coverFg: varchar('cover_fg', { length: 16 }),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(false),
  // Opciones de mesa que ofrece el juego (turnSeconds, variantes…)
  options: jsonb('options'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
});

export const gameContent = pgTable(
  'game_content',
  {
    gameId: varchar('game_id', { length: 64 })
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    sectionKey: varchar('section_key', { length: 64 }).notNull(),
    body: text('body').notNull(),
  },
  (t) => [primaryKey({ columns: [t.gameId, t.sectionKey] })],
);

// ---------------------------------------------------------------------------
// Partidas (matches)
// ---------------------------------------------------------------------------

export const matchStateEnum = pgEnum('match_state', [
  'waiting',
  'starting',
  'in_game',
  'finished',
  'cancelled',
  'abandoned',
]);

export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    code: varchar('code', { length: 8 }).notNull().unique(),
    gameId: varchar('game_id', { length: 64 })
      .notNull()
      .references(() => games.id),
    hostUserId: uuid('host_user_id').references(() => users.id, { onDelete: 'set null' }),
    state: matchStateEnum('state').notNull().default('waiting'),
    maxPlayers: smallint('max_players').notNull(),
    isPrivate: boolean('is_private').notNull().default(false),
    rated: boolean('rated').notNull().default(false),
    turnDurationS: integer('turn_duration_s'),
    options: jsonb('options'),
    // Motor: RNG determinista + snapshot para rehidratar tras un reinicio
    rngSeed: text('rng_seed'),
    stateSnapshot: jsonb('state_snapshot'),
    snapshotSeq: integer('snapshot_seq').notNull().default(0),
    turnDeadlineAt: timestamptz('turn_deadline_at'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    startedAt: timestamptz('started_at'),
    finishedAt: timestamptz('finished_at'),
  },
  (t) => [
    index('matches_game_state_idx').on(t.gameId, t.state),
    // El scheduler recupera deadlines vencidos al arrancar
    index('matches_deadline_idx').on(t.turnDeadlineAt),
  ],
);

export const matchPlayers = pgTable(
  'match_players',
  {
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    seat: smallint('seat').notNull(),
    ready: boolean('ready').notNull().default(false),
    // Clasificación final 1..N (soporta N jugadores, no solo win/lose/draw)
    placement: smallint('placement'),
    ratingBefore: real('rating_before'),
    ratingAfter: real('rating_after'),
    joinedAt: timestamptz('joined_at').notNull().defaultNow(),
    disconnectedAt: timestamptz('disconnected_at'),
    leftAt: timestamptz('left_at'),
  },
  (t) => [
    primaryKey({ columns: [t.matchId, t.userId] }),
    unique('match_players_seat_uq').on(t.matchId, t.seat),
    index('match_players_user_idx').on(t.userId),
  ],
);

export const matchMoves = pgTable(
  'match_moves',
  {
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    // seq monotónico por partida: UNIQUE hace imposible el doble movimiento
    seq: integer('seq').notNull(),
    playerSeat: smallint('player_seat').notNull(),
    move: jsonb('move').notNull(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.matchId, t.seq] })],
);

export const matchSpectators = pgTable(
  'match_spectators',
  {
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamptz('joined_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.matchId, t.userId] })],
);
