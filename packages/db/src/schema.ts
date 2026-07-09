import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  char,
  check,
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

export const users = pgTable(
  'users',
  {
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
    // Secreto TOTP cifrado en reposo (AES-256-GCM, ver auth/crypto.ts) — null = 2FA no configurado.
    totpSecret: text('totp_secret'),
    // Presencia = 2FA activo; se fija tras confirmar el primer código válido en /2fa/enable.
    totpEnabledAt: timestamptz('totp_enabled_at'),
    // Reputación de comportamiento (1-100, 100 = intachable) — independiente del rating de
    // nivel de juego. Ver `reputationEvents` para el ledger de eventos que la mueven.
    reputation: smallint('reputation').notNull().default(100),
    // Acceso al panel de administración (/admin). Un único admin conocido por ahora,
    // activado a mano en BD — no hay UI para dar de alta nuevos admins.
    isAdmin: boolean('is_admin').notNull().default(false),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [check('users_reputation_range', sql`${t.reputation} between 1 and 100`)],
);

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

export const twoFactorBackupCodes = pgTable(
  'two_factor_backup_codes',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // HMAC-SHA256(code, SESSION_PEPPER) — mismo hashToken que sesiones/reset; el código en claro
    // solo se muestra una vez, en la respuesta de /2fa/enable.
    codeHash: char('code_hash', { length: 64 }).notNull().unique(),
    usedAt: timestamptz('used_at'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [index('two_factor_backup_codes_user_idx').on(t.userId)],
);

export const trustedDevices = pgTable(
  'trusted_devices',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // HMAC-SHA256(token, SESSION_PEPPER) — el token opaco vive en la cookie `tb_trusted`.
    tokenHash: char('token_hash', { length: 64 }).notNull().unique(),
    userAgent: text('user_agent'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    lastUsedAt: timestamptz('last_used_at'),
    expiresAt: timestamptz('expires_at').notNull(),
  },
  (t) => [index('trusted_devices_user_idx').on(t.userId)],
);

export const magicLinkTokens = pgTable(
  'magic_link_tokens',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: char('token_hash', { length: 64 }).notNull().unique(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    expiresAt: timestamptz('expires_at').notNull(),
    consumedAt: timestamptz('consumed_at'),
  },
  (t) => [index('magic_link_tokens_user_idx').on(t.userId)],
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

export const matchModeEnum = pgEnum('match_mode', ['realtime', 'async']);

/** Cómo terminó una partida ya cerrada — permite reconstruir el `match.ended` original al
 * reconectar (el `state` solo distingue finished/abandoned; forfeit quedaría irrecuperable). */
export const matchEndReasonEnum = pgEnum('match_end_reason', ['completed', 'forfeit', 'abandoned']);

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
    // realtime: ambos jugadores juegan a la vez; async: puede pasar horas/días entre turnos.
    mode: matchModeEnum('mode').notNull().default('realtime'),
    rated: boolean('rated').notNull().default(false),
    turnDurationS: integer('turn_duration_s'),
    // Config específica del juego (p.ej. variante elegida): {variant: 'moving'}.
    options: jsonb('options'),
    // Motor: RNG determinista + snapshot para rehidratar tras un reinicio
    rngSeed: text('rng_seed'),
    stateSnapshot: jsonb('state_snapshot'),
    snapshotSeq: integer('snapshot_seq').notNull().default(0),
    turnDeadlineAt: timestamptz('turn_deadline_at'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    startedAt: timestamptz('started_at'),
    finishedAt: timestamptz('finished_at'),
    // Null en partidas cerradas antes de esta columna: se interpreta como 'completed'
    // (salvo state='abandoned', que ya es inequívoco por sí mismo).
    endReason: matchEndReasonEnum('end_reason'),
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

export const matchChatMessages = pgTable(
  'match_chat_messages',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [index('match_chat_messages_match_idx').on(t.matchId, t.createdAt)],
);

// ---------------------------------------------------------------------------
// Social (M3): amigos, presencia, DMs, actividad, notificaciones
// ---------------------------------------------------------------------------

export const friendshipStatusEnum = pgEnum('friendship_status', ['pending', 'accepted', 'blocked']);

// Fila única canónica por pareja (userId < friendId como texto) — evita el
// problema del modelo legacy de arista dirigida, donde cada sentido podía
// llevar un estado distinto para el mismo par de usuarios.
export const friendships = pgTable(
  'friendships',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    friendId: uuid('friend_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: friendshipStatusEnum('status').notNull().default('pending'),
    // Quién solicitó (pending) o quién bloqueó (blocked) por última vez.
    actorId: uuid('actor_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    respondedAt: timestamptz('responded_at'),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.friendId] }),
    index('friendships_friend_idx').on(t.friendId),
    index('friendships_status_idx').on(t.status),
    check('friendships_canonical_order', sql`${t.userId} < ${t.friendId}`),
  ],
);

export const conversationTypeEnum = pgEnum('conversation_type', ['direct', 'group']);

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    type: conversationTypeEnum('type').notNull(),
    name: text('name'),
    avatarInitial: varchar('avatar_initial', { length: 4 }),
    avatarColor: varchar('avatar_color', { length: 16 }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    lastMessageAt: timestamptz('last_message_at'),
  },
  (t) => [index('conversations_last_message_idx').on(t.lastMessageAt)],
);

export const conversationMemberRoleEnum = pgEnum('conversation_member_role', ['member', 'admin']);

export const conversationMembers = pgTable(
  'conversation_members',
  {
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: conversationMemberRoleEnum('role').notNull().default('member'),
    joinedAt: timestamptz('joined_at').notNull().defaultNow(),
    lastReadAt: timestamptz('last_read_at'),
    mutedAt: timestamptz('muted_at'),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.userId] }),
    index('conversation_members_user_idx').on(t.userId),
  ],
);

export const messageKindEnum = pgEnum('message_kind', ['text', 'system', 'invite']);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    // null = mensaje de sistema
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    kind: messageKindEnum('kind').notNull().default('text'),
    body: text('body').notNull(),
    // Solo para kind='invite': la mesa a la que se invita.
    inviteMatchId: uuid('invite_match_id').references(() => matches.id, { onDelete: 'set null' }),
    replyToId: uuid('reply_to_id').references((): AnyPgColumn => messages.id, { onDelete: 'set null' }),
    editedAt: timestamptz('edited_at'),
    deletedAt: timestamptz('deleted_at'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [index('messages_conversation_idx').on(t.conversationId, t.createdAt)],
);

export const activityTypeEnum = pgEnum('activity_type', [
  'friend_request',
  'friend_accepted',
  'invited',
  'your_turn',
  'tournament_round_started',
  'tournament_eliminated',
]);

export const activityFeed = pgTable(
  'activity_feed',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    actorUserId: uuid('actor_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetUserId: uuid('target_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: activityTypeEnum('type').notNull(),
    payload: jsonb('payload'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [index('activity_feed_target_idx').on(t.targetUserId, t.createdAt)],
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: activityTypeEnum('type').notNull(),
    payload: jsonb('payload'),
    readAt: timestamptz('read_at'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.readAt, t.createdAt)],
);

// ---------------------------------------------------------------------------
// Competición (M4): temporadas, rating Glicko-2, estadísticas
// ---------------------------------------------------------------------------

export const seasons = pgTable('seasons', {
  id: uuid('id').primaryKey().$defaultFn(uuidv7),
  name: text('name').notNull(),
  startsAt: timestamptz('starts_at').notNull().defaultNow(),
  endsAt: timestamptz('ends_at'),
  isActive: boolean('is_active').notNull().default(false),
});

// Rating Glicko-2 por usuario+juego+temporada. Solo se mueve en partidas `rated`
// (a diferencia de `userGameStats`, que cuenta toda partida acabada).
export const userGameRatings = pgTable(
  'user_game_ratings',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    gameId: varchar('game_id', { length: 64 })
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    seasonId: uuid('season_id')
      .notNull()
      .references(() => seasons.id, { onDelete: 'cascade' }),
    rating: real('rating').notNull().default(1500),
    rd: real('rd').notNull().default(350),
    vol: real('vol').notNull().default(0.06),
    wins: smallint('wins').notNull().default(0),
    losses: smallint('losses').notNull().default(0),
    draws: smallint('draws').notNull().default(0),
    peakRating: real('peak_rating').notNull().default(1500),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.gameId, t.seasonId] }),
    index('user_game_ratings_leaderboard_idx').on(t.gameId, t.seasonId, t.rating.desc()),
  ],
);

export const ratingHistory = pgTable(
  'rating_history',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    gameId: varchar('game_id', { length: 64 })
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    seasonId: uuid('season_id')
      .notNull()
      .references(() => seasons.id, { onDelete: 'cascade' }),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    ratingBefore: real('rating_before').notNull(),
    ratingAfter: real('rating_after').notNull(),
    rdBefore: real('rd_before').notNull(),
    rdAfter: real('rd_after').notNull(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [index('rating_history_user_game_idx').on(t.userId, t.gameId, t.createdAt)],
);

// Estadísticas de toda partida acabada (rated o casual) — a diferencia de
// `userGameRatings`, que solo refleja partidas rated.
export const userGameStats = pgTable(
  'user_game_stats',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    gameId: varchar('game_id', { length: 64 })
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    played: smallint('played').notNull().default(0),
    wins: smallint('wins').notNull().default(0),
    losses: smallint('losses').notNull().default(0),
    draws: smallint('draws').notNull().default(0),
    lastPlayedAt: timestamptz('last_played_at'),
  },
  (t) => [primaryKey({ columns: [t.userId, t.gameId] })],
);

// ---------------------------------------------------------------------------
// Reputación: eje de comportamiento, independiente del rating de nivel de juego
// ---------------------------------------------------------------------------

export const reputationReasonEnum = pgEnum('reputation_reason', [
  'match_abandoned',
  'match_forfeit_timeout',
  'match_completed_clean',
  'chat_blocked_profanity',
  'user_report',
  'passive_recovery',
  'admin_adjustment',
]);

// Ledger append-only (mismo espíritu que `ratingHistory`): cada evento que mueve
// `users.reputation` queda registrado con su before/after, tanto para poder auditar
// como para calcular ventanas rodantes (escalada de abandonos, aviso de insultos en 24h).
export const reputationEvents = pgTable(
  'reputation_events',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reason: reputationReasonEnum('reason').notNull(),
    delta: smallint('delta').notNull(),
    reputationBefore: smallint('reputation_before').notNull(),
    reputationAfter: smallint('reputation_after').notNull(),
    matchId: uuid('match_id').references(() => matches.id, { onDelete: 'set null' }),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [index('reputation_events_user_created_idx').on(t.userId, t.createdAt)],
);

export const userReportReasonEnum = pgEnum('user_report_reason', [
  'abusive_language',
  'unsportsmanlike',
  'cheating',
  'other',
]);

export const userReports = pgTable(
  'user_reports',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    reporterId: uuid('reporter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reportedUserId: uuid('reported_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    reason: userReportReasonEnum('reason').notNull(),
    comment: text('comment'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    reviewedAt: timestamptz('reviewed_at'),
    reviewedByAdminId: uuid('reviewed_by_admin_id').references(() => users.id, { onDelete: 'set null' }),
  },
  (t) => [
    // Un mismo reportador no puede reportar dos veces a la misma persona por la misma partida.
    unique('user_reports_unique').on(t.reporterId, t.reportedUserId, t.matchId),
    index('user_reports_reported_idx').on(t.reportedUserId),
  ],
);

// ---------------------------------------------------------------------------
// Torneos (M5): solo eliminación directa por ahora (formato 'swiss' pendiente)
// ---------------------------------------------------------------------------

export const tournamentFormatEnum = pgEnum('tournament_format', ['single_elim', 'swiss']);
export const tournamentStateEnum = pgEnum('tournament_state', ['registration', 'running', 'finished', 'cancelled']);
export const tournamentParticipantStatusEnum = pgEnum('tournament_participant_status', [
  'registered',
  'checked_in',
  'eliminated',
]);

export const tournaments = pgTable('tournaments', {
  id: uuid('id').primaryKey().$defaultFn(uuidv7),
  name: text('name').notNull(),
  gameId: varchar('game_id', { length: 64 })
    .notNull()
    .references(() => games.id),
  format: tournamentFormatEnum('format').notNull().default('single_elim'),
  state: tournamentStateEnum('state').notNull().default('registration'),
  hostUserId: uuid('host_user_id')
    .notNull()
    .references(() => users.id),
  rated: boolean('rated').notNull().default(true),
  turnDurationS: integer('turn_duration_s'),
  // Nº de rondas del bracket, fijado al arrancar (log2 del tamaño de bracket) — necesario para calcular placements.
  totalRounds: smallint('total_rounds'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  startedAt: timestamptz('started_at'),
  finishedAt: timestamptz('finished_at'),
});

export const tournamentParticipants = pgTable(
  'tournament_participants',
  {
    tournamentId: uuid('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: tournamentParticipantStatusEnum('status').notNull().default('registered'),
    // Asignado al arrancar el torneo (por rating del juego); posición en el bracket / orden inicial suizo.
    seed: integer('seed'),
    // 1 = campeón; empates comparten placement (misma convención que `PlayerRank` del motor).
    finalPlacement: integer('final_placement'),
    // Solo se usa en formato 'swiss': 1 punto por victoria (o bye), 0.5 por empate, acumulado ronda a ronda.
    // Sin uso en 'single_elim' (queda en 0): ahí el avance de ronda ya lo decide `finalPlacement`.
    points: real('points').notNull().default(0),
    joinedAt: timestamptz('joined_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.tournamentId, t.userId] })],
);

export const tournamentRounds = pgTable(
  'tournament_rounds',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    tournamentId: uuid('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    roundNumber: smallint('round_number').notNull(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [unique('tournament_rounds_tournament_round_uq').on(t.tournamentId, t.roundNumber)],
);

export const tournamentMatchStateEnum = pgEnum('tournament_match_state', ['pending', 'finished']);

export const tournamentMatches = pgTable(
  'tournament_matches',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    tournamentId: uuid('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    roundId: uuid('round_id')
      .notNull()
      .references(() => tournamentRounds.id, { onDelete: 'cascade' }),
    // Posición dentro de la ronda: empareja los slots [2k, 2k+1] de la ronda anterior.
    slotIndex: integer('slot_index').notNull(),
    participantAId: uuid('participant_a_id').references(() => users.id),
    // null = bye (el asiento A avanza automáticamente sin jugar).
    participantBId: uuid('participant_b_id').references(() => users.id),
    // null si fue bye (no se crea partida real) — enlace unidireccional: `matches` no sabe nada de torneos.
    matchId: uuid('match_id').references(() => matches.id),
    winnerUserId: uuid('winner_user_id').references(() => users.id),
    state: tournamentMatchStateEnum('state').notNull().default('pending'),
  },
  (t) => [
    unique('tournament_matches_round_slot_uq').on(t.roundId, t.slotIndex),
    index('tournament_matches_match_idx').on(t.matchId),
  ],
);

// ---------------------------------------------------------------------------
// Administración: ajustes globales y auditoría del panel de admin
// ---------------------------------------------------------------------------

// Fila única (id fijo 'singleton') con la configuración global de la plataforma.
export const appSettings = pgTable('app_settings', {
  id: varchar('id', { length: 16 }).primaryKey().default('singleton'),
  maintenanceMode: boolean('maintenance_mode').notNull().default(false),
  maintenanceMessage: text('maintenance_message'),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

// Registro append-only de toda acción tomada desde el panel de admin (quién, qué, sobre qué).
export const adminAuditLog = pgTable(
  'admin_audit_log',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: varchar('action', { length: 64 }).notNull(),
    targetType: varchar('target_type', { length: 32 }),
    targetId: varchar('target_id', { length: 64 }),
    detail: jsonb('detail'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [index('admin_audit_log_created_idx').on(t.createdAt)],
);
