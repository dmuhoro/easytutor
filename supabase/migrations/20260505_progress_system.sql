-- Migration: Progress System Schema Updates
-- Created: 2026-05-05
-- Purpose: Add columns for granular progress tracking and leveling

-- 1. Update user_progress with granular tracking columns
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS attempts         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_answers  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mastery_level    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity    TIMESTAMPTZ DEFAULT now();

-- 2. Update profiles with level column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
