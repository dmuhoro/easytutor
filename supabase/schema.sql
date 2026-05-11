-- Schema for EasyTutor application V1.0 (Multi-Portal AI Learning OS)

-- 1. Subjects Table (Portal Catalog)
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  icon TEXT,
  level TEXT NOT NULL CHECK (level IN ('high_school', 'university', 'self_directed')),
  description TEXT,
  kicd_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Topics Table (Syllabus Structure)
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtopics JSONB,
  form_level TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Cached Responses Table (AI Performance Layer)
CREATE TABLE IF NOT EXISTS cached_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Quiz Sessions Table (Success Analytics)
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  date TIMESTAMPTZ DEFAULT now()
);

-- 5. User Progress Table (Mastery Tracking)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- 6. Profiles Table (Global User State)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  learning_mode TEXT CHECK (learning_mode IN ('high_school', 'university', 'self_directed')),
  onboarding_complete BOOLEAN DEFAULT FALSE,
  xp_total INTEGER DEFAULT 0, -- Task 2.1
  current_streak INTEGER DEFAULT 1, -- Task 2.2
  last_active_date DATE DEFAULT CURRENT_DATE, -- Task 2.2
  streak_freezes INTEGER DEFAULT 1, -- Task 2.2
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS) Configuration
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies: Subject/Topic (Read Only for Public)
CREATE POLICY "Public read subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Public read topics" ON topics FOR SELECT USING (true);

-- Policies: Personal Data (Authenticated Only)
CREATE POLICY "Users can view their own quiz sessions" ON quiz_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quiz sessions" ON quiz_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 8. Cached Roadmaps (Performance Layer for Task 1.3)
CREATE TABLE IF NOT EXISTS cached_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  roadmap_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, topic_id) -- Only one cache per topic per user
);

ALTER TABLE cached_roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own cached roadmaps" ON cached_roadmaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own cached roadmaps" ON cached_roadmaps FOR ALL USING (auth.uid() = user_id);

-- 9. Topic Progress (Sequential Locking for Task 3.1)
CREATE TABLE IF NOT EXISTS user_topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'mastered')),
  attempts INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own topic progress" ON user_topic_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own topic progress" ON user_topic_progress FOR ALL USING (auth.uid() = user_id);
