-- EasyTutor — Idempotent Deterministic Seed
-- Derived from constants/subjects.ts and constants/topics.ts
-- Requires UNIQUE(name, level) on subjects and UNIQUE(subject_id, title) on topics

-- 1. Subjects
INSERT INTO subjects (id, name, icon, level, description, kicd_ref) VALUES
  ('hs-math', 'Mathematics', '🧮', 'high_school', 'KCSE Mathematics (Form 1–4)', 'KICD/MAT/001'),
  ('hs-physics', 'Physics', '⚛️', 'high_school', 'KCSE Physics (Form 1–4)', 'KICD/PHY/002'),
  ('hs-chemistry', 'Chemistry', '🧪', 'high_school', 'KCSE Chemistry (Form 1–4)', 'KICD/CHE/003'),
  ('hs-biology', 'Biology', '🧬', 'high_school', 'KCSE Biology (Form 1–4)', 'KICD/BIO/004'),
  ('uni-engineering', 'Engineering', '⚙️', 'university', 'Degree-level Engineering', NULL),
  ('sd-automotive', 'Automotive Engineering', '🚗', 'self_directed', 'Automotive systems and engineering', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  level = EXCLUDED.level,
  description = EXCLUDED.description,
  kicd_ref = EXCLUDED.kicd_ref;

-- 2. Sample Topics (mapped to stable subject IDs)
INSERT INTO topics (subject_id, title, sort_order) VALUES
  ('hs-math', 'Algebra', 1),
  ('hs-math', 'Geometry', 2),
  ('hs-math', 'Calculus', 6),
  ('uni-engineering', 'Calculus I', 1),
  ('sd-automotive', 'Internal Combustion Engines', 1)
ON CONFLICT (subject_id, title) DO NOTHING;
