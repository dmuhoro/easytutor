-- Learning Coach Reports Migration

-- 1. Create learning_coach_reports table
CREATE TABLE IF NOT EXISTS learning_coach_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  coaching_summary TEXT NOT NULL,
  learner_state TEXT NOT NULL DEFAULT 'unknown',
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  root_causes JSONB NOT NULL DEFAULT '[]'::jsonb,
  opportunities TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  risks TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  recommendations TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  next_actions TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  learning_health_trajectory TEXT NOT NULL CHECK (learning_health_trajectory IN ('improving', 'stable', 'declining', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, analysis_date)
);

ALTER TABLE learning_coach_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coach reports"
  ON learning_coach_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own coach reports"
  ON learning_coach_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coach reports"
  ON learning_coach_reports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_coach_reports_user_id ON learning_coach_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_coach_reports_analysis_date ON learning_coach_reports(analysis_date DESC);
