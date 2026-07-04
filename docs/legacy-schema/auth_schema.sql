-- ============================================================================
-- Tableria — Authentication schema
-- ============================================================================
-- Tables and column extensions required to support the full auth lifecycle:
--
--   * Registration       (email_verifications + users.email_verified_at)
--   * Login / logout     (user_sessions + audit_log)
--   * Brute-force lock   (login_attempts + users.failed_login_count/locked_until)
--   * Password recovery  (password_resets)
--   * Passwordless login (magic_link_tokens)
--   * Two-factor auth    (users.two_factor_* + two_factor_backup_codes)
--   * SSO / OAuth        (user_oauth_providers — Discord/Twitch/Google/etc.)
--   * Auditing           (audit_log)
--
-- Conventions (same as schema.sql):
--   * utf8mb4 everywhere.
--   * Token tables store SHA-256 hashes of the tokens; the raw token is only
--     ever emailed/included in the cookie and never persisted in cleartext.
--   * Encrypted-at-rest blobs (*_enc) are AES-256-GCM at the app layer. The
--     DB never sees the key.
--   * *_at columns for timestamps, *_count for counters, *_id for FKs.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- 0. ALTER existing tables (idempotent via IF NOT EXISTS)
-- ---------------------------------------------------------------------------

-- users: lockout state, last-login info, 2FA flag, soft-disable.
ALTER TABLE `users`
    ADD COLUMN IF NOT EXISTS `failed_login_count` INT UNSIGNED NOT NULL DEFAULT 0
        AFTER `email_verified_at`,
    ADD COLUMN IF NOT EXISTS `locked_until` DATETIME NULL
        AFTER `failed_login_count`,
    ADD COLUMN IF NOT EXISTS `locked_reason` VARCHAR(120) NULL
        AFTER `locked_until`,
    ADD COLUMN IF NOT EXISTS `last_login_at` DATETIME NULL
        AFTER `locked_reason`,
    ADD COLUMN IF NOT EXISTS `last_login_ip` VARCHAR(45) NULL
        AFTER `last_login_at`,
    ADD COLUMN IF NOT EXISTS `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0
        AFTER `last_login_ip`,
    ADD COLUMN IF NOT EXISTS `two_factor_secret_enc` VARBINARY(255) NULL
        AFTER `two_factor_enabled`,
    ADD COLUMN IF NOT EXISTS `disabled_at` DATETIME NULL
        AFTER `two_factor_secret_enc`,
    ADD COLUMN IF NOT EXISTS `disabled_reason` VARCHAR(120) NULL
        AFTER `disabled_at`;

-- user_sessions: track usage, allow revocation, distinguish step-up auth.
ALTER TABLE `user_sessions`
    ADD COLUMN IF NOT EXISTS `last_used_at` DATETIME NULL AFTER `created_at`,
    ADD COLUMN IF NOT EXISTS `revoked_at`  DATETIME NULL AFTER `last_used_at`,
    ADD COLUMN IF NOT EXISTS `revoked_reason` VARCHAR(80) NULL AFTER `revoked_at`,
    ADD COLUMN IF NOT EXISTS `two_factor_passed` TINYINT(1) NOT NULL DEFAULT 1 AFTER `revoked_reason`,
    ADD COLUMN IF NOT EXISTS `persistent` TINYINT(1) NOT NULL DEFAULT 0 AFTER `two_factor_passed`;

-- Indexes that didn't make the initial cut and are cheap to add now.
ALTER TABLE `user_sessions`
    ADD INDEX IF NOT EXISTS `idx_user_sessions_expires` (`expires_at`),
    ADD INDEX IF NOT EXISTS `idx_user_sessions_revoked` (`revoked_at`);

-- ---------------------------------------------------------------------------
-- 1. email_verifications
-- ---------------------------------------------------------------------------
-- Short-lived tokens sent to the user's email to confirm ownership. Covers:
--   - Initial signup confirmation.
--   - Re-verification after email change.
-- A row is "active" if `consumed_at IS NULL AND expires_at > NOW()`.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `email_verifications` (
    `id`           BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `user_id`      BIGINT UNSIGNED    NOT NULL,
    `email`        VARCHAR(190)       NOT NULL,
    `token_hash`   CHAR(64)           NOT NULL, -- SHA-256 hex of the raw token
    `ip_address`   VARCHAR(45)        NULL,
    `user_agent`   VARCHAR(255)       NULL,
    `created_at`   DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at`   DATETIME           NOT NULL,
    `consumed_at`  DATETIME           NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_email_verifications_token` (`token_hash`),
    KEY `idx_email_verifications_user` (`user_id`),
    KEY `idx_email_verifications_active` (`expires_at`, `consumed_at`),
    CONSTRAINT `fk_email_verifications_user`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. password_resets
-- ---------------------------------------------------------------------------
-- Token-based password recovery. Same shape as email_verifications; kept
-- separate so the audit trail is unambiguous.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_resets` (
    `id`           BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `user_id`      BIGINT UNSIGNED    NOT NULL,
    `token_hash`   CHAR(64)           NOT NULL,
    `ip_address`   VARCHAR(45)        NULL,
    `user_agent`   VARCHAR(255)       NULL,
    `created_at`   DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at`   DATETIME           NOT NULL, -- typically +1 hour
    `consumed_at`  DATETIME           NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_password_resets_token` (`token_hash`),
    KEY `idx_password_resets_user` (`user_id`),
    KEY `idx_password_resets_active` (`expires_at`, `consumed_at`),
    CONSTRAINT `fk_password_resets_user`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3. magic_link_tokens
-- ---------------------------------------------------------------------------
-- Passwordless login links. Same lifecycle as password_resets but tagged
-- differently so abuse can be detected.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `magic_link_tokens` (
    `id`                 BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `user_id`            BIGINT UNSIGNED  NOT NULL,
    `token_hash`         CHAR(64)         NOT NULL,
    `ip_address`         VARCHAR(45)      NULL,
    `user_agent`         VARCHAR(255)     NULL,
    `redirect_after`     VARCHAR(255)     NULL,
    `created_at`         DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at`         DATETIME         NOT NULL, -- typically +15 min
    `consumed_at`        DATETIME         NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_magic_link_token` (`token_hash`),
    KEY `idx_magic_link_user` (`user_id`),
    KEY `idx_magic_link_active` (`expires_at`, `consumed_at`),
    CONSTRAINT `fk_magic_link_user`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4. login_attempts
-- ---------------------------------------------------------------------------
-- Append-only ledger of every login attempt, successful or not, identified
-- either by user_id (when the email matched) or just by `identifier` (when
-- it didn't). Lets us:
--   * Detect brute-force on a single account.
--   * Detect credential-stuffing across many accounts from one IP.
--   * Honor GDPR-friendly retention by purging rows older than N days.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `login_attempts` (
    `id`             BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    `user_id`        BIGINT UNSIGNED   NULL,                -- NULL when the email is unknown
    `identifier`     VARCHAR(190)      NOT NULL,            -- the email or username tried
    `ip_address`     VARCHAR(45)       NOT NULL,
    `user_agent`     VARCHAR(255)      NULL,
    `succeeded`      TINYINT(1)        NOT NULL DEFAULT 0,
    `failure_reason` ENUM(
        'unknown_user','bad_credentials','account_locked',
        'account_disabled','two_factor_required','two_factor_failed',
        'rate_limited','session_invalid'
    ) NULL,
    `attempted_at`   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_login_attempts_user`     (`user_id`, `attempted_at`),
    KEY `idx_login_attempts_ip`       (`ip_address`, `attempted_at`),
    KEY `idx_login_attempts_id`       (`identifier`, `attempted_at`),
    KEY `idx_login_attempts_outcome`  (`succeeded`, `attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 5. two_factor_backup_codes
-- ---------------------------------------------------------------------------
-- One-time recovery codes generated when the user enables 2FA. Stored as
-- bcrypt hashes (code_hash); the raw code is shown to the user exactly once.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `two_factor_backup_codes` (
    `id`           BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `user_id`      BIGINT UNSIGNED    NOT NULL,
    `code_hash`    VARCHAR(60)        NOT NULL,    -- bcrypt format $2y$...
    `used_at`      DATETIME           NULL,
    `created_at`   DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_two_factor_backup_codes_user` (`user_id`, `used_at`),
    CONSTRAINT `fk_two_factor_backup_codes_user`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 6. user_oauth_providers
-- ---------------------------------------------------------------------------
-- Linkage between Tableria accounts and third-party identities (Discord,
-- Twitch, Google, ...). The unique constraint is on (provider, provider_user_id)
-- so the same third-party identity can only be linked to one Tableria user.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_oauth_providers` (
    `id`                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `user_id`             BIGINT UNSIGNED NOT NULL,
    `provider`            ENUM('google','discord','twitch','apple','github','facebook') NOT NULL,
    `provider_user_id`    VARCHAR(190)    NOT NULL,
    `provider_email`      VARCHAR(190)    NULL,
    `provider_username`   VARCHAR(64)     NULL,
    `access_token_enc`    VARBINARY(2048) NULL,        -- AES-256-GCM at app layer
    `refresh_token_enc`   VARBINARY(2048) NULL,
    `id_token_enc`        VARBINARY(4096) NULL,
    `scopes`              VARCHAR(255)    NULL,
    `token_expires_at`    DATETIME        NULL,
    `linked_at`           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_used_at`        DATETIME        NULL,
    `revoked_at`          DATETIME        NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_oauth_provider_user` (`provider`, `provider_user_id`),
    KEY `idx_oauth_user` (`user_id`, `provider`),
    CONSTRAINT `fk_oauth_user`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 7. audit_log
-- ---------------------------------------------------------------------------
-- Append-only security trail. Captures every relevant event (signup, login,
-- logout, password reset request/complete, OAuth link/unlink, 2FA changes,
-- account lock/unlock) with actor, target, IP, UA and a free-form JSON
-- payload. Drives the "Actividad de seguridad" panel and forensics.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_log` (
    `id`            BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `user_id`       BIGINT UNSIGNED    NULL,           -- actor; NULL for system events
    `target_user_id` BIGINT UNSIGNED   NULL,           -- subject (rarely differs from actor)
    `action`        ENUM(
        'signup','login','logout','login_failed',
        'password_reset_requested','password_reset_completed','password_changed',
        'email_verification_sent','email_verified','email_changed',
        'two_factor_enabled','two_factor_disabled','two_factor_challenged',
        'two_factor_backup_used','two_factor_method_changed',
        'account_locked','account_unlocked','account_disabled','account_enabled',
        'oauth_linked','oauth_unlinked','oauth_login',
        'session_revoked','session_created',
        'magic_link_sent','magic_link_consumed',
        'profile_updated','terms_accepted'
    ) NOT NULL,
    `ip_address`    VARCHAR(45)        NULL,
    `user_agent`    VARCHAR(255)       NULL,
    `metadata`      JSON               NULL,
    `created_at`    DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_audit_actor`   (`user_id`, `created_at`),
    KEY `idx_audit_target`  (`target_user_id`, `created_at`),
    KEY `idx_audit_action`  (`action`, `created_at`),
    KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 8. trusted_devices
-- ---------------------------------------------------------------------------
-- "Remember this device" — users can mark a browser as trusted to skip the
-- 2FA prompt for a configurable period (default 30 days). The fingerprint
-- combines a user-agent hash + first-8-octets IP for coarse matching; we
-- never store the raw UA/IP here (already in user_sessions/audit_log).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `trusted_devices` (
    `id`              BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `user_id`         BIGINT UNSIGNED    NOT NULL,
    `device_hash`     CHAR(64)           NOT NULL,
    `device_label`    VARCHAR(120)       NULL,           -- user-supplied "Mi portátil"
    `first_seen_at`   DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_seen_at`    DATETIME           NULL,
    `expires_at`      DATETIME           NOT NULL,
    `revoked_at`      DATETIME           NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_trusted_device_user_hash` (`user_id`, `device_hash`),
    KEY `idx_trusted_devices_user_active` (`user_id`, `revoked_at`, `expires_at`),
    CONSTRAINT `fk_trusted_devices_user`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
