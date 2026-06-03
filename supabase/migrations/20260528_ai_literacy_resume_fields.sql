-- ============================================================
-- Migration: AI Literacy Resume Fields
-- Date: 2026-05-28
-- ============================================================

ALTER TABLE ai_literacy_progress
ADD COLUMN IF NOT EXISTS last_unit INTEGER;

ALTER TABLE ai_literacy_progress
ADD COLUMN IF NOT EXISTS last_section INTEGER;

ALTER TABLE ai_literacy_progress
ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ;

