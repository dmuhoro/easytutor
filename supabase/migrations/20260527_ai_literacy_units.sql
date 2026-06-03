-- ============================================================
-- Migration: AI Literacy Units 1 and 2
-- Date: 2026-05-27
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_literacy_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  quiz JSONB NOT NULL DEFAULT '[]'::jsonb,
  portal_type TEXT NOT NULL DEFAULT 'ai_literacy',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_literacy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_number INTEGER NOT NULL,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  portal_type TEXT NOT NULL DEFAULT 'ai_literacy',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_unit INTEGER,
  last_section INTEGER,
  last_opened_at TIMESTAMPTZ,
  UNIQUE(user_id, unit_number)
);

CREATE INDEX IF NOT EXISTS ai_literacy_progress_user_id_idx ON ai_literacy_progress(user_id);
CREATE INDEX IF NOT EXISTS ai_literacy_content_unit_number_idx ON ai_literacy_content(unit_number);

ALTER TABLE ai_literacy_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_literacy_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_literacy_content'
      AND policyname = 'Authenticated read ai_literacy_content'
  ) THEN
    CREATE POLICY "Authenticated read ai_literacy_content"
    ON ai_literacy_content
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_literacy_progress'
      AND policyname = 'Users manage own ai_literacy_progress'
  ) THEN
    CREATE POLICY "Users manage own ai_literacy_progress"
    ON ai_literacy_progress
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END;
$$;

INSERT INTO ai_literacy_content (unit_number, title, objective, sections, quiz)
VALUES
(
  1,
  'Unit 1: What Is AI?',
  'Understand what AI is, where it helps, and where it fails.',
  '[
    {"heading":"What AI Is","content":"AI is software that learns patterns from data and uses them to make predictions or generate outputs. It is not magic; it is pattern-based decision support."},
    {"heading":"What AI Can Do","content":"AI can flag suspicious M-Pesa transactions, help detect crop disease from leaf photos, optimize matatu route timing, and support rural clinic triage prioritization."},
    {"heading":"What AI Cannot Do","content":"AI cannot replace human judgment, cannot guarantee truth, and can fail badly when data is incomplete, biased, or outdated."}
  ]'::jsonb,
  '[
    {"question":"Which example best shows AI pattern detection?","options":["Guessing lottery numbers","Flagging unusual M-Pesa transactions","Replacing all doctors","Predicting weather with no data"],"correct":1,"explanation":"Fraud detection is a classic AI pattern-recognition use case."},
    {"question":"Why can AI fail in rural healthcare triage?","options":["Because AI is always offline","Because data may be incomplete","Because clinics do not use phones","Because AI cannot classify anything"],"correct":1,"explanation":"Poor or incomplete data reduces AI reliability."},
    {"question":"What is a realistic AI use in transport?","options":["Eliminating all traffic","Optimizing matatu dispatch timing","Driving all cars today","Making roads wider"],"correct":1,"explanation":"AI can optimize schedules; it cannot instantly remove structural constraints."},
    {"question":"AI decisions should be...","options":["Final and unquestioned","Reviewed by humans in high-stakes cases","Used without context","Hidden from users"],"correct":1,"explanation":"Human oversight is critical in high-risk decisions."},
    {"question":"Best description of AI?","options":["Magic intelligence","Pattern-based software","A human brain","A legal authority"],"correct":1,"explanation":"AI systems learn and apply data patterns."}
  ]'::jsonb
),
(
  2,
  'Unit 2: How To Use AI Properly',
  'Learn prompting, verification, hallucination checks, and practical ethical usage.',
  '[
    {"heading":"Prompting Clearly","content":"Good prompts are specific. For KCSE revision, request syllabus scope, output format, and difficulty level."},
    {"heading":"Verify AI Outputs","content":"Cross-check AI answers with trusted notes, lecturers, official references, and business records before acting."},
    {"heading":"Hallucinations and Limits","content":"AI can sound confident while wrong. Treat output as draft guidance, not final truth."},
    {"heading":"AI + Human Collaboration","content":"Use AI to draft ideas, then apply your judgment for context, accuracy, and ethics."},
    {"heading":"Practical Workflows","content":"Use AI for university research outlines, biashara stock planning, chapati inventory forecasts, and CV drafting with human review."}
  ]'::jsonb,
  '[
    {"question":"Best KCSE prompt style?","options":["Teach me everything","Summarize Form 3 acids and bases with 10 exam-style questions","Just do my homework","Any notes?"],"correct":1,"explanation":"Specific prompts improve relevance and usefulness."},
    {"question":"When AI gives a business recommendation, you should...","options":["Act immediately","Verify with your sales and expense records","Ignore all data","Post it online first"],"correct":1,"explanation":"Always validate against your real operational data."},
    {"question":"A hallucination is...","options":["A network timeout","An AI output that sounds right but is false","A good summary","A chart type"],"correct":1,"explanation":"Hallucinations are confidently incorrect outputs."},
    {"question":"Good AI collaboration means...","options":["Removing humans from decisions","Combining AI speed with human judgment","Accepting every output","Avoiding verification"],"correct":1,"explanation":"AI works best as a co-pilot, not a replacement for judgment."},
    {"question":"Chapati inventory planning with AI should include...","options":["Only yesterday sales","Demand assumptions plus manual adjustment","No constraints","Random estimates"],"correct":1,"explanation":"Use AI forecasts and then adjust with real local context."}
  ]'::jsonb
)
ON CONFLICT (unit_number) DO UPDATE
SET
  title = EXCLUDED.title,
  objective = EXCLUDED.objective,
  sections = EXCLUDED.sections,
  quiz = EXCLUDED.quiz,
  portal_type = EXCLUDED.portal_type;
