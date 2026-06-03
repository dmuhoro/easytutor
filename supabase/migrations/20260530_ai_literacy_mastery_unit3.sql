-- ============================================================
-- Migration: AI Literacy Mastery Fields + Unit 3
-- Date: 2026-05-30
-- ============================================================

ALTER TABLE ai_literacy_progress
ADD COLUMN IF NOT EXISTS first_attempt_score INTEGER;

ALTER TABLE ai_literacy_progress
ADD COLUMN IF NOT EXISTS best_score INTEGER;

ALTER TABLE ai_literacy_progress
ADD COLUMN IF NOT EXISTS attempts_count INTEGER DEFAULT 0;

ALTER TABLE ai_literacy_progress
ADD COLUMN IF NOT EXISTS mastered BOOLEAN DEFAULT FALSE;

INSERT INTO ai_literacy_content (unit_number, title, objective, sections, quiz)
VALUES
(
  3,
  'Unit 3: AI Ethics and Responsibility',
  'Apply ethical AI principles in school, work, and community settings across Kenya.',
  '[
    {"heading":"Privacy and Consent","content":"Before sharing student essays, customer records, or clinic notes with AI tools, get consent and remove identifying details. Data privacy protects learners and customers."},
    {"heading":"Bias and Fairness","content":"AI trained on limited data can underperform for rural dialects, informal sector workers, or underrepresented communities. Always check outputs for unfair assumptions."},
    {"heading":"Accountability","content":"If AI advice leads to a wrong decision in biashara, farming, or academic work, humans remain responsible. Document who reviewed AI output before acting."},
    {"heading":"Community Impact","content":"Use AI to expand access—translation for parents, revision support for students, and business planning for SMEs—without replacing local expertise."}
  ]'::jsonb,
  '[
    {"question":"Before uploading student work to an AI tool, you should...","options":["Share everything quickly","Remove names and get consent where needed","Assume privacy is automatic","Post outputs publicly"],"correct":1,"explanation":"Consent and de-identification protect learner privacy."},
    {"question":"AI bias often appears when...","options":["Training data excludes certain communities","Internet speed is low","Phones are old","Users ask clear prompts"],"correct":0,"explanation":"Limited training data can produce unfair or incomplete outputs."},
    {"question":"Who is accountable for a bad AI recommendation?","options":["The AI vendor only","The person who acted on the output","Nobody","The network provider"],"correct":1,"explanation":"Human accountability remains even when AI assists decisions."},
    {"question":"Ethical AI in Kenyan SMEs means...","options":["Automating all decisions","Using AI drafts with human review","Ignoring customer context","Hiding AI usage"],"correct":1,"explanation":"AI should support judgment, not replace accountability."},
    {"question":"Best community use of AI?","options":["Replacing teachers entirely","Expanding revision access with oversight","Publishing private health data","Removing local languages"],"correct":1,"explanation":"AI can broaden access while keeping human oversight and local context."}
  ]'::jsonb
)
ON CONFLICT (unit_number) DO UPDATE
SET
  title = EXCLUDED.title,
  objective = EXCLUDED.objective,
  sections = EXCLUDED.sections,
  quiz = EXCLUDED.quiz,
  portal_type = EXCLUDED.portal_type;
