-- ============================================================
-- Migration: AI Literacy Weakest Section Tracking
-- Date: 2026-05-30
-- ============================================================

ALTER TABLE ai_literacy_progress
ADD COLUMN IF NOT EXISTS weakest_section TEXT;

ALTER TABLE ai_literacy_progress
ADD COLUMN IF NOT EXISTS weakest_score INTEGER;
