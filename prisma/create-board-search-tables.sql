-- Run in Supabase Dashboard → SQL Editor → New query → Run
-- Creates board search tables for felovy-search integration (platforms, tokens, meta).
-- Safe to re-run: uses IF NOT EXISTS.

-- ─── board_jobs (public job board listings) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS board_jobs (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ats                 TEXT NOT NULL,
  board_token         TEXT NOT NULL,
  external_job_id     TEXT NOT NULL,
  title               TEXT,
  company_name        TEXT,
  location_name       TEXT,
  absolute_url        TEXT,
  first_published     TIMESTAMPTZ,
  source_updated_at   TIMESTAMPTZ,
  content_html        TEXT,
  content_text        TEXT,
  departments_json    TEXT,
  offices_json        TEXT,
  metadata_json       TEXT,
  remote_status       TEXT,
  language            TEXT,
  employment_type     TEXT,
  country_code        TEXT,
  region              TEXT,
  logo_url            TEXT,
  scraped_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen_in_last_scrape BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT board_jobs_ats_board_token_external_job_id_key
    UNIQUE (ats, board_token, external_job_id)
);

CREATE INDEX IF NOT EXISTS board_jobs_first_published_idx ON board_jobs (first_published);
CREATE INDEX IF NOT EXISTS board_jobs_source_updated_at_idx ON board_jobs (source_updated_at);
CREATE INDEX IF NOT EXISTS board_jobs_ats_idx ON board_jobs (ats);
CREATE INDEX IF NOT EXISTS board_jobs_remote_status_idx ON board_jobs (remote_status);
CREATE INDEX IF NOT EXISTS board_jobs_region_idx ON board_jobs (region);
CREATE INDEX IF NOT EXISTS board_jobs_scraped_at_idx ON board_jobs (scraped_at);

-- ─── board_platforms ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS board_platforms (
  slug                  TEXT PRIMARY KEY,
  label                 TEXT NOT NULL,
  domain                TEXT,
  integration           TEXT,
  list_url_template     TEXT,
  headers_json          TEXT NOT NULL DEFAULT '{"User-Agent":"Felovy/1.0"}',
  pagination_json       TEXT,
  jobs_path             TEXT,
  response_format       TEXT,
  description_from_list BOOLEAN NOT NULL DEFAULT FALSE,
  scrapeable            BOOLEAN NOT NULL DEFAULT FALSE,
  concurrency           INTEGER NOT NULL DEFAULT 10,
  agent_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order            INTEGER NOT NULL DEFAULT 0,
  catalog_json          TEXT
);

-- ─── board_tokens ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS board_tokens (
  ats               TEXT NOT NULL,
  board_token       TEXT NOT NULL,
  enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  last_scraped_at   TIMESTAMPTZ,
  last_status       TEXT,
  last_error        TEXT,
  last_job_count    INTEGER,
  logo_url          TEXT,
  logo_fetched_at   TIMESTAMPTZ,
  opened_count      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ats, board_token),
  CONSTRAINT board_tokens_ats_fkey
    FOREIGN KEY (ats) REFERENCES board_platforms (slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS board_tokens_ats_idx ON board_tokens (ats);
CREATE INDEX IF NOT EXISTS board_tokens_board_token_idx ON board_tokens (board_token);

-- ─── app_meta (catalog import flags, etc.) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
