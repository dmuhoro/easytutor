-- Migration: Unique constraints for deterministic seeding
-- Created: 2026-05-05
-- Purpose: Prevent duplicate subjects and topics, enabling idempotent upserts

-- 1. Add UNIQUE constraint on subjects(name, level)
--    This prevents the same subject being inserted twice for the same portal.
ALTER TABLE subjects
  ADD CONSTRAINT IF NOT EXISTS subjects_name_level_unique UNIQUE (name, level);

-- 2. Add UNIQUE constraint on topics(subject_id, title)
--    This enables ON CONFLICT upsert and prevents phantom duplicates.
ALTER TABLE topics
  ADD CONSTRAINT IF NOT EXISTS topics_subject_title_unique UNIQUE (subject_id, title);

-- 3. Fix subjects.level CHECK to match schema.sql (remove legacy 'general')
--    The migration 20260403_portal_schema.sql used 'general' which is now invalid.
ALTER TABLE subjects
  DROP CONSTRAINT IF EXISTS subjects_level_check;

ALTER TABLE subjects
  ADD CONSTRAINT subjects_level_check
  CHECK (level IN ('high_school', 'university', 'self_directed'));

-- 4. Add missing columns to cached_roadmaps that roadmapStore writes to
ALTER TABLE cached_roadmaps
  ADD COLUMN IF NOT EXISTS learning_mode   TEXT,
  ADD COLUMN IF NOT EXISTS checked_tasks   JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_opened_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completion_status TEXT
    CHECK (completion_status IN ('not_started', 'in_progress', 'completed'));

-- 5. Add missing columns to profiles that were in schema.sql but not the migration
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS xp_total          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak    INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_active_date  DATE    DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS streak_freezes    INTEGER DEFAULT 1;
