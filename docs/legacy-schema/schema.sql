-- ============================================================================
-- Tableria — Database schema
-- ============================================================================
-- Designed to back the public/ app (games catalog, friends, rooms, chat,
-- activity feed) and to leave room for future sockets-backed real-time play.
--
-- Conventions:
--   * UTF-8 (utf8mb4) everywhere.
--   * Surrogate PKs are BIGINT UNSIGNED AUTO_INCREMENT for tables that may
--     grow large (messages, activity). Smaller natural-key tables (games,
--     categories) use VARCHAR slugs.
--   * Every business table carries created_at / updated_at where it makes
--     sense for auditing.
--   * Foreign keys are declared with sensible ON DELETE actions so the
--     client (chat frontend) can hard-delete a user without orphaning rows.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------------------------
-- One row per registered account. The `me` identity used in the mock chat
-- is a real user row referenced by id everywhere else.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id`              BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `username`        VARCHAR(32)      NOT NULL,
    `display_name`    VARCHAR(64)      NOT NULL,
    `email`           VARCHAR(190)     NOT NULL,
    `password_hash`   VARCHAR(255)     NOT NULL,
    `avatar_initial`  VARCHAR(3)       NOT NULL DEFAULT '',
    `avatar_color`    CHAR(7)          NOT NULL DEFAULT '#0EA5E9',
    `status_message`  VARCHAR(140)     NULL,
    `presence`        ENUM('online','away','in_game','offline') NOT NULL DEFAULT 'offline',
    `last_seen_at`    DATETIME         NULL,
    `email_verified_at` DATETIME       NULL,
    `created_at`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_users_username` (`username`),
    UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. user_sessions
-- ---------------------------------------------------------------------------
-- Opaque session tokens used for cookie-based auth. Lets us invalidate
-- individual sessions on logout and detect stolen credentials.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_sessions` (
    `id`           CHAR(36)       NOT NULL,
    `user_id`      BIGINT UNSIGNED NOT NULL,
    `token_hash`   CHAR(64)       NOT NULL,
    `ip`           VARCHAR(45)    NULL,
    `user_agent`   VARCHAR(255)   NULL,
    `expires_at`   DATETIME       NOT NULL,
    `created_at`   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_user_sessions_token` (`token_hash`),
    KEY `idx_user_sessions_user` (`user_id`),
    CONSTRAINT `fk_user_sessions_user`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3. friendships
-- ---------------------------------------------------------------------------
-- Directed edge (user_id -> friend_id). To find a user's friends, query
-- WHERE user_id = :me AND status = 'accepted'. Mutual friendships are
-- represented as a single row (we treat friendship as symmetric for read
-- queries).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `friendships` (
    `user_id`     BIGINT UNSIGNED NOT NULL,
    `friend_id`   BIGINT UNSIGNED NOT NULL,
    `status`      ENUM('pending','accepted','blocked') NOT NULL DEFAULT 'pending',
    `requested_by` BIGINT UNSIGNED NOT NULL,
    `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `accepted_at` DATETIME        NULL,
    PRIMARY KEY (`user_id`, `friend_id`),
    KEY `idx_friendships_friend` (`friend_id`),
    KEY `idx_friendships_status` (`status`),
    CONSTRAINT `fk_friendships_user`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_friendships_friend`
        FOREIGN KEY (`friend_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_friendships_requester`
        FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `chk_friendships_not_self` CHECK (`user_id` <> `friend_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4. game_categories
-- ---------------------------------------------------------------------------
-- Tablero / Cartas / Estrategia / Palabras / Casual etc.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `game_categories` (
    `slug`        VARCHAR(40)  NOT NULL,
    `name`        VARCHAR(64)  NOT NULL,
    `sort_order`  INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 5. games
-- ---------------------------------------------------------------------------
-- The catalog of board games available to play. Mock data currently lives
-- in tableria_games() — this is its eventual source of truth.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `games` (
    `id`           VARCHAR(40)  NOT NULL,           -- slug, e.g. 'colonos'
    `name`         VARCHAR(80)  NOT NULL,
    `category`     VARCHAR(40)  NOT NULL,
    `initial`      VARCHAR(3)   NOT NULL,
    `min_players`  TINYINT UNSIGNED NOT NULL,
    `max_players`  TINYINT UNSIGNED NOT NULL,
    `duration_min` SMALLINT UNSIGNED NOT NULL,       -- average minutes
    `badge`        VARCHAR(40)  NULL,               -- 'Destacado', 'Popular', 'Nuevo', etc.
    `cover_bg`     CHAR(7)      NOT NULL DEFAULT '#051022',
    `cover_fg`     CHAR(7)      NOT NULL DEFAULT '#38BDF8',
    `description`  TEXT         NOT NULL,
    `is_active`    TINYINT(1)   NOT NULL DEFAULT 1,
    `sort_order`   INT          NOT NULL DEFAULT 0,
    `lobby_config` JSON         NULL,                  -- per-game lobby options: {hasRealtimeLobby, modes, turnOptions, allowPrivate, playersFixed}
    `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_games_category` (`category`),
    KEY `idx_games_active_order` (`is_active`, `sort_order`),
    CONSTRAINT `fk_games_category`
        FOREIGN KEY (`category`) REFERENCES `game_categories`(`slug`)
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 6. game_mods
-- ---------------------------------------------------------------------------
-- Optional rule packs / expansions per game. Rendered under the game page.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `game_mods` (
    `id`         VARCHAR(60)  NOT NULL,               -- composite: games.id + '-' + slug
    `game_id`    VARCHAR(40)  NOT NULL,
    `slug`       VARCHAR(40)  NOT NULL,
    `name`       VARCHAR(120) NOT NULL,
    `description` TEXT        NOT NULL,
    `sort_order` INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_game_mods_game` (`game_id`),
    CONSTRAINT `fk_game_mods_game`
        FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 7. game_content
-- ---------------------------------------------------------------------------
-- Long-form text sections shown on the game page (objetivo, pasos, etc.).
-- One row per (game_id, section_key). Keeps the page text out of the games
-- table so designers can iterate on copy without altering catalog rows.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `game_content` (
    `game_id`     VARCHAR(40) NOT NULL,
    `section_key` VARCHAR(40) NOT NULL,              -- 'objetivo', 'pasos', 'puntos', 'consejo'
    `body`        TEXT        NOT NULL,
    `sort_order`  INT         NOT NULL DEFAULT 0,
    PRIMARY KEY (`game_id`, `section_key`),
    CONSTRAINT `fk_game_content_game`
        FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 8. rooms
-- ---------------------------------------------------------------------------
-- A room is a single game session. `code` is the short, shareable code
-- (e.g. 'K3F9'). `state` drives the state-dot on the public rooms list.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rooms` (
    `id`              CHAR(36)        NOT NULL,                       -- UUID
    `code`            VARCHAR(8)      NOT NULL,                       -- short human code
    `game_id`         VARCHAR(40)     NOT NULL,
    `host_user_id`    BIGINT UNSIGNED NOT NULL,
    `state`           ENUM('waiting','starting','in_game','finished','cancelled')
                                     NOT NULL DEFAULT 'waiting',
    `mode`            ENUM('turn_based','real_time') NOT NULL DEFAULT 'turn_based',
    `turn_duration_s` INT             NULL,
    `max_players`     TINYINT UNSIGNED NOT NULL,
    `is_private`      TINYINT(1)      NOT NULL DEFAULT 0,
    `password_hash`   VARCHAR(255)    NULL,
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `started_at`      DATETIME        NULL,
    `ended_at`        DATETIME        NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_rooms_code` (`code`),
    KEY `idx_rooms_game_state` (`game_id`, `state`),
    KEY `idx_rooms_host` (`host_user_id`),
    CONSTRAINT `fk_rooms_game`
        FOREIGN KEY (`game_id`) REFERENCES `games`(`id`),
    CONSTRAINT `fk_rooms_host`
        FOREIGN KEY (`host_user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 9. room_players
-- ---------------------------------------------------------------------------
-- Membership / state per player within a room. `position` is the turn
-- order for turn-based games. `result` is set when the room ends so we
-- can compute stats without inspecting move history.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `room_players` (
    `room_id`     CHAR(36)        NOT NULL,
    `user_id`     BIGINT UNSIGNED NOT NULL,
    `position`    TINYINT UNSIGNED NOT NULL,
    `joined_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `left_at`     DATETIME        NULL,
    `result`      ENUM('active','won','lost','draw','left') NOT NULL DEFAULT 'active',
    `ready`       TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (`room_id`, `user_id`),
    KEY `idx_room_players_user` (`user_id`),
    CONSTRAINT `fk_room_players_room`
        FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_room_players_user`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 10. conversations
-- ---------------------------------------------------------------------------
-- Both 1:1 ('direct') and group chats. For direct chats `name` is null and
-- membership is exactly two users. The `initial` and `color` columns let
-- us render a chat-list avatar without re-deriving it client-side.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conversations` (
    `id`         CHAR(36)    NOT NULL,
    `type`       ENUM('direct','group') NOT NULL,
    `name`       VARCHAR(80) NULL,
    `initial`    VARCHAR(3)  NULL,
    `color`      CHAR(7)     NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_message_at` DATETIME NULL,
    PRIMARY KEY (`id`),
    KEY `idx_conversations_last_msg` (`last_message_at`),
    CONSTRAINT `fk_conversations_creator`
        FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 11. conversation_members
-- ---------------------------------------------------------------------------
-- Tracks who's in a conversation plus their per-conversation read state,
-- which the chat UI needs to compute the unread badge.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conversation_members` (
    `conversation_id` CHAR(36)        NOT NULL,
    `user_id`         BIGINT UNSIGNED NOT NULL,
    `role`            ENUM('member','admin') NOT NULL DEFAULT 'member',
    `joined_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_read_at`    DATETIME        NULL,
    `muted`           TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (`conversation_id`, `user_id`),
    KEY `idx_conv_members_user` (`user_id`),
    CONSTRAINT `fk_conv_members_conv`
        FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_conv_members_user`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 12. messages
-- ---------------------------------------------------------------------------
-- One row per chat message. `kind` lets us add system events (player
-- joined, game started) without polluting the text column.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `conversation_id` CHAR(36)        NOT NULL,
    `user_id`         BIGINT UNSIGNED NULL,        -- null for system messages
    `kind`            ENUM('text','system','invite','game_start','game_end') NOT NULL DEFAULT 'text',
    `body`            TEXT            NOT NULL,
    `reply_to_id`     BIGINT UNSIGNED NULL,
    `edited_at`       DATETIME        NULL,
    `deleted_at`      DATETIME        NULL,
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_messages_conv_time` (`conversation_id`, `created_at`),
    KEY `idx_messages_user` (`user_id`),
    CONSTRAINT `fk_messages_conv`
        FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_messages_user`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_messages_reply`
        FOREIGN KEY (`reply_to_id`) REFERENCES `messages`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 13. activity_feed
-- ---------------------------------------------------------------------------
-- Powers the right-rail activity panel. Each row is one event, optionally
-- linked to a game or room so we can deep-link from the feed later.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_feed` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `actor_user_id`   BIGINT UNSIGNED NOT NULL,
    `target_user_id`  BIGINT UNSIGNED NULL,
    `game_id`         VARCHAR(40)     NULL,
    `room_id`         CHAR(36)        NULL,
    `type`            ENUM('won','invited','created_room','joined_group','achievement','left_room','friend_request','friend_accepted')
                                     NOT NULL,
    `payload`         JSON            NULL,
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_activity_target_time` (`target_user_id`, `created_at`),
    KEY `idx_activity_actor_time` (`actor_user_id`, `created_at`),
    CONSTRAINT `fk_activity_actor`
        FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_activity_target`
        FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_activity_game`
        FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_activity_room`
        FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 14. user_game_stats
-- ---------------------------------------------------------------------------
-- Per-user, per-game aggregate counters. Updated on room completion; read
-- by the profile / leaderboard screens.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_game_stats` (
    `user_id`        BIGINT UNSIGNED NOT NULL,
    `game_id`        VARCHAR(40)     NOT NULL,
    `games_played`   INT UNSIGNED    NOT NULL DEFAULT 0,
    `wins`           INT UNSIGNED    NOT NULL DEFAULT 0,
    `losses`         INT UNSIGNED    NOT NULL DEFAULT 0,
    `draws`          INT UNSIGNED    NOT NULL DEFAULT 0,
    `last_played_at` DATETIME        NULL,
    PRIMARY KEY (`user_id`, `game_id`),
    CONSTRAINT `fk_stats_user`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_stats_game`
        FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 11. room_moves
-- ---------------------------------------------------------------------------
-- Per-room, per-user moves, shared across every game. `move` is an opaque
-- JSON blob whose shape is entirely up to each game's own PHP module (e.g.
-- tic-tac-toe stores {cell, symbol, board_after}); nothing generic ever
-- inspects its contents. Lets us reconstruct any game from scratch and
-- audit disputed plays without a per-game moves table.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `room_moves` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `room_id`        CHAR(36)        NOT NULL,
    `user_id`        BIGINT UNSIGNED NOT NULL,
    `turn_number`    INT UNSIGNED    NOT NULL,           -- 1, 2, 3, ...
    `move`           JSON            NOT NULL,
    `result`         ENUM('continue','win','draw') NOT NULL DEFAULT 'continue',
    `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_room_moves_room` (`room_id`, `turn_number`),
    KEY `idx_room_moves_user` (`user_id`),
    CONSTRAINT `fk_room_moves_room`
        FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_room_moves_user`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;