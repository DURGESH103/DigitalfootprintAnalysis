-- ============================================================
-- Digital Footprint Analyzer - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS digital_footprint CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE digital_footprint;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)        NOT NULL,
  email         VARCHAR(255)        NOT NULL UNIQUE,
  password_hash VARCHAR(255)        NOT NULL,
  created_at    TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token      TEXT         NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- ============================================================
-- CONNECTED ACCOUNTS
-- ============================================================
CREATE TABLE connected_accounts (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  platform     ENUM('github','gitlab','leetcode','codeforces','codechef','hackerrank','geeksforgeeks','linkedin','twitter','stackoverflow') NOT NULL,
  username     VARCHAR(100) NOT NULL,
  access_token TEXT         DEFAULT NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_platform (user_id, platform),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- ============================================================
-- PLATFORM RAW DATA
-- ============================================================
CREATE TABLE platform_data (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  platform   VARCHAR(50)  NOT NULL,
  raw_data   JSON         NOT NULL,
  fetched_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_platform (user_id, platform),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_platform (platform)
);

-- ============================================================
-- NORMALIZED DATA
-- ============================================================
CREATE TABLE normalized_data (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           INT UNSIGNED   NOT NULL,
  platform          VARCHAR(50)    NOT NULL,
  activity_score    DECIMAL(5,2)   DEFAULT 0,
  consistency_score DECIMAL(5,2)   DEFAULT 0,
  skill_tags        JSON           DEFAULT (JSON_ARRAY()),
  engagement_score  DECIMAL(5,2)   DEFAULT 0,
  growth_score      DECIMAL(5,2)   DEFAULT 0,
  updated_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_platform (user_id, platform),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE reports (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  insights   JSON         NOT NULL,
  scores     JSON         NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  type       VARCHAR(50)  NOT NULL,  -- 'analysis_complete' | 'analysis_failed' | 'tip'
  title      VARCHAR(200) NOT NULL,
  message    TEXT         NOT NULL,
  meta       JSON         DEFAULT NULL,
  read_at    TIMESTAMP    DEFAULT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, read_at),
  INDEX idx_created_at (created_at)
);

CREATE TABLE activity_logs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  action     VARCHAR(100) NOT NULL,
  meta       JSON         DEFAULT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
