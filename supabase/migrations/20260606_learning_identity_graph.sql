-- Learning Identity & Knowledge Graph Migrations

-- 1. learning_identities
CREATE TABLE IF NOT EXISTS learning_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learner_type TEXT NOT NULL CHECK (learner_type IN ('secondary', 'university', 'self_directed', 'professional', 'researcher')),
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_learning_style TEXT NOT NULL CHECK (preferred_learning_style IN ('visual', 'auditory', 'kinesthetic', 'text')),
  target_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE learning_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own learning identity"
  ON learning_identities
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. knowledge_nodes
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('domain', 'subject', 'topic', 'concept')),
  prerequisites JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_mastery_time_mins INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;

-- Knowledge nodes are publicly readable
CREATE POLICY "Knowledge nodes are publicly readable"
  ON knowledge_nodes
  FOR SELECT
  USING (true);

-- 3. knowledge_paths
CREATE TABLE IF NOT EXISTS knowledge_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_goal TEXT NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb, -- Ordered list of node IDs
  current_node_id TEXT REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE knowledge_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own knowledge paths"
  ON knowledge_paths
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_category ON knowledge_nodes(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_paths_user_id ON knowledge_paths(user_id);
