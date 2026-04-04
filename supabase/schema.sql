-- Schema for EasyTutor application MVP

-- 1. subjects table (Global/Seed data)
CREATE TABLE subjects (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL
);

-- 2. topics table (Global/Seed data)
CREATE TABLE topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id text REFERENCES subjects(id) ON DELETE CASCADE,
  name text NOT NULL
);

-- 3. cached_responses table (Shared cache for performance)
CREATE TABLE cached_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id text REFERENCES subjects(id) ON DELETE CASCADE,
  topic text NOT NULL,
  mode text NOT NULL,
  response_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. quiz_sessions table (User private)
CREATE TABLE quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  subject_id text REFERENCES subjects(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total integer NOT NULL,
  date timestamp with time zone DEFAULT now()
);

-- 5. user_progress table (User private)
CREATE TABLE user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  subject_id text REFERENCES subjects(id) ON DELETE CASCADE,
  topic text NOT NULL,
  completed_at timestamp with time zone DEFAULT now()
);

-- Row Level Security (RLS) Configuration
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policies: Only authenticated users can manage their own data
CREATE POLICY "Users can view their own quiz sessions" ON quiz_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quiz sessions" ON quiz_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);

