CREATE TABLE IF NOT EXISTS public.learning_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    recommendation_key TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    title TEXT NOT NULL,
    reason TEXT NOT NULL,
    action_label TEXT NOT NULL,
    recommendation_type TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    confidence_score NUMERIC NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, recommendation_key)
);

ALTER TABLE public.learning_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own learning recommendations"
    ON public.learning_recommendations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own learning recommendations"
    ON public.learning_recommendations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning recommendations"
    ON public.learning_recommendations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
