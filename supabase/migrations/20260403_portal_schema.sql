-- Migration: Portal Schema Update
-- Created: 2026-04-03
-- Purpose: Implement Phase 1 of the EasyTutor v1.0 Build Directive

-- 1. Create Profiles table (Section 3.1)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  learning_mode TEXT CHECK (learning_mode IN ('high_school', 'university', 'self_directed')),
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Migrate Subjects & Topics to new structure (Section 3.2 & 3.3)
-- First, rename legacy tables if they exist to avoid data loss
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subjects' AND table_schema = 'public') THEN
        ALTER TABLE subjects RENAME TO legacy_subjects;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'topics' AND table_schema = 'public') THEN
        ALTER TABLE topics RENAME TO legacy_topics;
    END IF;
END $$;

-- Create New Subjects Table
CREATE TABLE subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  icon TEXT,
  level TEXT NOT NULL CHECK (level IN ('high_school', 'university', 'general')),
  description TEXT,
  kicd_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON subjects;
CREATE POLICY "Public read" ON subjects FOR SELECT USING (true);

-- Create New Topics Table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtopics JSONB,
  form_level TEXT,
  sort_order INTEGER
);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON topics;
CREATE POLICY "Public read" ON topics FOR SELECT USING (true);

-- 3. Cleanup Legacy Tables (Optional - or just leave them renamed)
-- We will migrate legacy automotive data in a separate script or manual step in seeding
