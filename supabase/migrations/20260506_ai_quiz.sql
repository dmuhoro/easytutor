-- Migration: Quiz Generation Engine
-- Created: 2026-05-06

-- Add ai_generated flag to quiz_sessions
ALTER TABLE quiz_sessions
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;

-- Add granular question tracking to quiz_sessions (optional but recommended for persistence)
ALTER TABLE quiz_sessions
ADD COLUMN IF NOT EXISTS question_text TEXT,
ADD COLUMN IF NOT EXISTS options TEXT[],
ADD COLUMN IF NOT EXISTS correct_index INTEGER,
ADD COLUMN IF NOT EXISTS explanation TEXT;
