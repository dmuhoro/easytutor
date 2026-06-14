CREATE TABLE IF NOT EXISTS public.learning_trend_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    accuracy_score NUMERIC NOT NULL DEFAULT 0,
    confidence_score NUMERIC NOT NULL DEFAULT 0,
    fluency_score NUMERIC NOT NULL DEFAULT 0,
    fluency_level TEXT NOT NULL DEFAULT 'Emerging',
    average_response_time_ms INTEGER NOT NULL DEFAULT 0,
    fastest_response_time_ms INTEGER NOT NULL DEFAULT 0,
    slowest_response_time_ms INTEGER NOT NULL DEFAULT 0,
    response_speed_score NUMERIC NOT NULL DEFAULT 0,
    session_completed BOOLEAN NOT NULL DEFAULT TRUE,
    session_count INTEGER NOT NULL DEFAULT 0,
    total_questions_answered INTEGER NOT NULL DEFAULT 0,
    total_correct_answers INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_trend_snapshots_user_completed_at
    ON public.learning_trend_snapshots (user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_trend_snapshots_user_subject_topic
    ON public.learning_trend_snapshots (user_id, subject, topic);

ALTER TABLE public.learning_trend_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own learning trend snapshots"
    ON public.learning_trend_snapshots FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own learning trend snapshots"
    ON public.learning_trend_snapshots FOR SELECT
    USING (auth.uid() = user_id);
