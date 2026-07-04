-- ============================================================================
-- Tableria — Seed data
-- ============================================================================
-- Mirrors the current mock data in includes/data.php so the app boots with
-- the same content. Idempotent: safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
INSERT INTO `game_categories` (`slug`, `name`, `sort_order`) VALUES
    ('Todos',      'Todos',      0),
    ('Tablero',    'Tablero',    1),
    ('Cartas',     'Cartas',     2),
    ('Estrategia', 'Estrategia', 3),
    ('Palabras',   'Palabras',   4),
    ('Casual',     'Casual',     5)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `sort_order` = VALUES(`sort_order`);

-- ---------------------------------------------------------------------------
-- Demo users (password for every account: 'tableria' — bcrypt placeholder)
-- ---------------------------------------------------------------------------
-- All demo users use the same hash for the password 'tableria'. Generated
-- with PHP password_hash('tableria', PASSWORD_BCRYPT) — keep it as a
-- placeholder until we wire real signup.
INSERT INTO `users` (`id`, `username`, `display_name`, `email`, `password_hash`, `avatar_initial`, `avatar_color`, `presence`, `last_seen_at`) VALUES
    (1,  'me',     'Tú',         'me@tableria.local',     '$2y$10$hNFcSl7tj7l3hDjP9g9h1uV6gjyhVkRlpA8o7Bv2bF0S3n.AAAAAG', 'T',  '#0EA5E9', 'online',  NOW()),
    (2,  'marta',  'Marta',      'marta@tableria.local',  '$2y$10$hNFcSl7tj7l3hDjP9g9h1uV6gjyhVkRlpA8o7Bv2bF0S3n.AAAAAG', 'M',  '#0EA5E9', 'in_game', NOW()),
    (3,  'didac',  'Dídac',      'didac@tableria.local',  '$2y$10$hNFcSl7tj7l3hDjP9g9h1uV6gjyhVkRlpA8o7Bv2bF0S3n.AAAAAG', 'D',  '#0B1936', 'online',  NOW()),
    (4,  'lucia',  'Lucía',      'lucia@tableria.local',  '$2y$10$hNFcSl7tj7l3hDjP9g9h1uV6gjyhVkRlpA8o7Bv2bF0S3n.AAAAAG', 'L',  '#142649', 'in_game', NOW()),
    (5,  'bruno',  'Bruno',      'bruno@tableria.local',  '$2y$10$hNFcSl7tj7l3hDjP9g9h1uV6gjyhVkRlpA8o7Bv2bF0S3n.AAAAAG', 'B',  '#5C7BAA', 'away',    NOW()),
    (6,  'aitor',  'Aitor',      'aitor@tableria.local',  '$2y$10$hNFcSl7tj7l3hDjP9g9h1uV6gjyhVkRlpA8o7Bv2bF0S3n.AAAAAG', 'A',  '#9DB5D8', 'offline', NULL),
    (7,  'nuria',  'Nuria',      'nuria@tableria.local',  '$2y$10$hNFcSl7tj7l3hDjP9g9h1uV6gjyhVkRlpA8o7Bv2bF0S3n.AAAAAG', 'N',  '#0B1936', 'in_game', NOW()),
    (8,  'ivan',   'Iván',       'ivan@tableria.local',   '$2y$10$hNFcSl7tj7l3hDjP9g9h1uV6gjyhVkRlpA8o7Bv2bF0S3n.AAAAAG', 'I',  '#0EA5E9', 'online',  NOW())
ON DUPLICATE KEY UPDATE
    `display_name` = VALUES(`display_name`),
    `avatar_color` = VALUES(`avatar_color`),
    `presence`     = VALUES(`presence`);

-- ---------------------------------------------------------------------------
-- Games catalog
-- ---------------------------------------------------------------------------
INSERT INTO `games` (`id`, `name`, `category`, `initial`, `min_players`, `max_players`, `duration_min`, `badge`, `cover_bg`, `cover_fg`, `description`, `sort_order`) VALUES
    ('colonos',      'Colonos',       'Estrategia', 'C', 3, 4, 45, 'Destacado', '#051022', '#38BDF8', 'Comercia, construye carreteras y ciudades, y hazte con la isla antes que nadie. Estrategia por turnos donde negociar con tus amigos lo es todo.', 10),
    ('ajedrez',      'Ajedrez',       'Tablero',    'A', 2, 2, 15, NULL,        '#0B1936', '#38BDF8', 'El clásico de estrategia pura. Reta a un amigo a una partida rápida o a una lenta con reloj de torneo.', 20),
    ('cartas-locas', 'Cartas Locas',  'Cartas',     'U', 2, 8, 15, 'Popular',   '#0EA5E9', '#051022', 'Deshazte de todas tus cartas antes que el resto. Cambios de color, robos y giros de última hora para 2 a 8 jugadores.', 30),
    ('parchis',      'Parchís',       'Tablero',    'P', 2, 4, 20, NULL,        '#1F3666', '#FFD200', 'El de toda la vida. Saca fichas, come las de tus rivales y llega a casa. Caos garantizado entre amigos.', 40),
    ('trivial',      'Trivial',       'Casual',     'T', 2, 6, 25, 'Nuevo',     '#38BDF8', '#051022', 'Demuestra quién sabe más. Preguntas de cultura, deporte, cine y más, por categorías y a contrarreloj.', 50),
    ('poker',        'Póker',         'Cartas',     'K', 2, 8, 30, NULL,        '#0B1936', '#FFD200', 'Texas Hold’em con fichas virtuales. Farolea, sube la apuesta y llévate el bote en mesas privadas con tus amigos.', 60),
    ('damas',        'Damas',         'Tablero',    'D', 2, 2, 10, NULL,        '#E0F2FE', '#051022', 'Sencillo de aprender, difícil de dominar. Captura todas las fichas del rival en partidas rápidas 1 contra 1.', 70),
    ('palabras',     'Palabras',      'Palabras',   'W', 2, 4, 30, NULL,        '#142649', '#FFFFFF', 'Forma palabras en el tablero y suma el máximo de puntos. Un duelo de vocabulario para las mentes más ágiles.', 80),
    ('batalla-naval','Batalla Naval', 'Tablero',    'B', 2, 2, 15, NULL,        '#051022', '#0EA5E9', 'Coloca tu flota y hunde la del rival antes de que hunda la tuya. Tocado y hundido, en versión online.', 90),
    ('domino',       'Dominó',        'Casual',     'D', 2, 4, 20, NULL,        '#BAE6FD', '#051022', 'Enlaza fichas, bloquea a tus rivales y quédate sin piezas el primero. Clásico de mesa para 2 a 4.', 100)
ON DUPLICATE KEY UPDATE
    `name`         = VALUES(`name`),
    `category`     = VALUES(`category`),
    `cover_bg`     = VALUES(`cover_bg`),
    `cover_fg`     = VALUES(`cover_fg`),
    `description`  = VALUES(`description`),
    `badge`        = VALUES(`badge`),
    `sort_order`   = VALUES(`sort_order`);

-- ---------------------------------------------------------------------------
-- Friendships — symmetric edges. me (1) is friends with everyone else.
-- ---------------------------------------------------------------------------
INSERT INTO `friendships` (`user_id`, `friend_id`, `status`, `requested_by`, `accepted_at`) VALUES
    (1, 2, 'accepted', 2, NOW()), (2, 1, 'accepted', 2, NOW()),
    (1, 3, 'accepted', 3, NOW()), (3, 1, 'accepted', 3, NOW()),
    (1, 4, 'accepted', 4, NOW()), (4, 1, 'accepted', 4, NOW()),
    (1, 5, 'accepted', 5, NOW()), (5, 1, 'accepted', 5, NOW()),
    (1, 6, 'accepted', 1, NOW()), (6, 1, 'accepted', 1, NOW()),
    (2, 3, 'accepted', 2, NOW()), (3, 2, 'accepted', 2, NOW()),
    (2, 4, 'accepted', 2, NOW()), (4, 2, 'accepted', 2, NOW()),
    (3, 4, 'accepted', 4, NOW()), (4, 3, 'accepted', 4, NOW())
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- ---------------------------------------------------------------------------
-- Public rooms — current listings from the mock data
-- ---------------------------------------------------------------------------
INSERT INTO `rooms` (`id`, `code`, `game_id`, `host_user_id`, `state`, `mode`, `max_players`, `created_at`) VALUES
    ('11111111-1111-1111-1111-111111111111', 'K3F9', 'colonos',      2, 'waiting',  'turn_based', 4, NOW()),
    ('22222222-2222-2222-2222-222222222222', 'ZP21', 'cartas-locas', 3, 'waiting',  'real_time',  8, NOW()),
    ('33333333-3333-3333-3333-333333333333', 'QW77', 'trivial',      4, 'starting', 'real_time',  6, NOW()),
    ('44444444-4444-4444-4444-444444444444', 'MN04', 'parchis',      5, 'waiting',  'turn_based', 4, NOW()),
    ('55555555-5555-5555-5555-555555555555', 'HJ88', 'poker',        7, 'in_game',  'real_time',  8, NOW()),
    ('66666666-6666-6666-6666-666666666666', 'RT55', 'ajedrez',      8, 'waiting',  'turn_based', 2, NOW())
ON DUPLICATE KEY UPDATE
    `state` = VALUES(`state`),
    `host_user_id` = VALUES(`host_user_id`);

-- Add host as the first player in each room.
INSERT INTO `room_players` (`room_id`, `user_id`, `position`) VALUES
    ('11111111-1111-1111-1111-111111111111', 2, 1),
    ('22222222-2222-2222-2222-222222222222', 3, 1),
    ('33333333-3333-3333-3333-333333333333', 4, 1),
    ('44444444-4444-4444-4444-444444444444', 5, 1),
    ('55555555-5555-5555-5555-555555555555', 7, 1),
    ('66666666-6666-6666-6666-666666666666', 8, 1)
ON DUPLICATE KEY UPDATE `position` = VALUES(`position`);

-- ---------------------------------------------------------------------------
-- Conversations — group chat + DMs to Marta, Dídac and Bruno
-- ---------------------------------------------------------------------------
INSERT INTO `conversations` (`id`, `type`, `name`, `initial`, `color`, `created_by`, `last_message_at`) VALUES
    ('aaaaaaaa-1111-1111-1111-111111111111', 'group',  'Noche de juegos', 'NJ', '#0EA5E9', 1, NOW()),
    ('bbbbbbbb-2222-2222-2222-222222222222', 'direct', NULL,              'M',  '#0EA5E9', 2, NOW()),
    ('cccccccc-3333-3333-3333-333333333333', 'direct', NULL,              'D',  '#0B1936', 3, NOW()),
    ('dddddddd-4444-4444-4444-444444444444', 'direct', NULL,              'B',  '#5C7BAA', 5, NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `initial` = VALUES(`initial`);

-- Membership
INSERT INTO `conversation_members` (`conversation_id`, `user_id`, `role`, `last_read_at`) VALUES
    -- group: me + Marta + Dídac + Lucía
    ('aaaaaaaa-1111-1111-1111-111111111111', 1, 'admin',  NOW()),
    ('aaaaaaaa-1111-1111-1111-111111111111', 2, 'member', NOW()),
    ('aaaaaaaa-1111-1111-1111-111111111111', 3, 'member', NULL),
    ('aaaaaaaa-1111-1111-1111-111111111111', 4, 'member', NULL),
    -- DMs
    ('bbbbbbbb-2222-2222-2222-222222222222', 1, 'member', NULL),
    ('bbbbbbbb-2222-2222-2222-222222222222', 2, 'member', NOW()),
    ('cccccccc-3333-3333-3333-333333333333', 1, 'member', NOW()),
    ('cccccccc-3333-3333-3333-333333333333', 3, 'member', NOW()),
    ('dddddddd-4444-4444-4444-444444444444', 1, 'member', NULL),
    ('dddddddd-4444-4444-4444-444444444444', 5, 'member', NULL)
ON DUPLICATE KEY UPDATE `role` = VALUES(`role`);

-- Messages
INSERT INTO `messages` (`conversation_id`, `user_id`, `kind`, `body`, `created_at`) VALUES
    ('aaaaaaaa-1111-1111-1111-111111111111', 2, 'text', '¿Jugamos a Colonos esta noche?',             DATE_SUB(NOW(), INTERVAL 25 MINUTE)),
    ('aaaaaaaa-1111-1111-1111-111111111111', 3, 'text', 'Yo me apunto sin duda',                       DATE_SUB(NOW(), INTERVAL 23 MINUTE)),
    ('aaaaaaaa-1111-1111-1111-111111111111', 1, 'text', 'Va, creo la sala y os paso el código',        DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
    ('aaaaaaaa-1111-1111-1111-111111111111', 4, 'text', 'Perfecto, avisad cuando esté',                DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
    ('bbbbbbbb-2222-2222-2222-222222222222', 2, 'text', 'Te toca en Colonos, ¿sigues ahí?',           DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
    ('bbbbbbbb-2222-2222-2222-222222222222', 2, 'text', 'No tardes, que se enfría la partida',         DATE_SUB(NOW(), INTERVAL  8 MINUTE)),
    ('cccccccc-3333-3333-3333-333333333333', 1, 'text', '¿Una de Cartas Locas luego?',                 DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
    ('cccccccc-3333-3333-3333-333333333333', 3, 'text', 'Cuando quieras, monta la sala',               DATE_SUB(NOW(), INTERVAL 28 MINUTE)),
    ('dddddddd-4444-4444-4444-444444444444', 5, 'text', 'Ayer casi gano al Parchís',                   DATE_SUB(NOW(), INTERVAL  3 HOUR)),
    ('dddddddd-4444-4444-4444-444444444444', 5, 'text', 'La próxima caes',                             DATE_SUB(NOW(), INTERVAL  2 HOUR));

-- ---------------------------------------------------------------------------
-- Activity feed — mirrors the mock panel
-- ---------------------------------------------------------------------------
INSERT INTO `activity_feed` (`actor_user_id`, `target_user_id`, `game_id`, `type`, `created_at`) VALUES
    (2, 1, 'ajedrez',      'won',           DATE_SUB(NOW(), INTERVAL  2 MINUTE)),
    (5, 1, 'parchis',      'invited',       DATE_SUB(NOW(), INTERVAL  5 MINUTE)),
    (4, NULL, 'trivial',    'created_room',  DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
    (3, 1, NULL,           'joined_group',  DATE_SUB(NOW(), INTERVAL  1 HOUR));