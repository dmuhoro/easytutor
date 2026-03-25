-- Schema for EasyTutor application MVP

-- 1. subjects table
CREATE TABLE subjects (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL
);

-- 2. topics table
CREATE TABLE topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id text REFERENCES subjects(id) ON DELETE CASCADE,
  name text NOT NULL
);

-- 3. cached_responses table
CREATE TABLE cached_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id text REFERENCES subjects(id) ON DELETE CASCADE,
  topic text NOT NULL,
  mode text NOT NULL,
  response_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. quiz_sessions table
CREATE TABLE quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id text REFERENCES subjects(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total integer NOT NULL,
  date timestamp with time zone DEFAULT now()
);

-- 5. user_progress table
CREATE TABLE user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id text REFERENCES subjects(id) ON DELETE CASCADE,
  topic text NOT NULL,
  completed_at timestamp with time zone DEFAULT now()
);
