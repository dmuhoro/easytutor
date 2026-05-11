import { getAuthenticatedUser, getSupabaseClient, logSupabaseError } from './supabaseOps';

export type AnalyticsEvent = 
  | 'user_signed_up' 
  | 'onboarding_completed' 
  | 'roadmap_generated' 
  | 'task_completed' 
  | 'quiz_started' 
  | 'quiz_completed' 
  | 'user_returned'
  | 'user_shared_progress'
  | 'roadmap_generation_started'
  | 'roadmap_generation_completed'
  | 'roadmap_generation_failed'
  | 'roadmap_abandoned'
  | 'quiz_generation_failed'
  | 'time_spent'
  | 'profile_sync_started'
  | 'profile_sync_success'
  | 'profile_sync_failed';

export interface AIFeedback {
  user_id?: string;
  learning_mode?: string;
  content_type: 'roadmap' | 'quiz';
  rating: 'positive' | 'negative';
  feedback_text?: string;
  topic?: string;
}

export interface EventMetadata {
  [key: string]: any;
}

const sendEventToSupabase = async (event: AnalyticsEvent, payload: EventMetadata = {}) => {
  const { user_id, learning_mode, ...metadata } = payload;

  const eventPayload = {
    user_id,
    event_name: event,
    learning_mode: learning_mode || 'unknown',
    metadata,
    timestamp: new Date().toISOString(),
  };

  if (__DEV__) {
    console.log(`[Analytics] ${event}`, eventPayload);
  }

  // Background sync to Supabase
  try {
    const client = getSupabaseClient();
    const user = await getAuthenticatedUser();
    const { error } = await client.from('user_events').insert({
      ...eventPayload,
      user_id: user.id
    });
    if (error) {
      logSupabaseError('user_events', 'insert', error);
      throw error;
    }
  } catch (err) {
    logSupabaseError('user_events', 'insert', err);
  }
};

export const safeTrackEvent = async (event: AnalyticsEvent, payload: EventMetadata = {}) => {
  if (!payload.user_id) {
    if (__DEV__) {
      console.warn('[Analytics] Skipped event due to missing user_id');
    }
    return;
  }

  await sendEventToSupabase(event, payload);
};

export const trackEvent = async (event: AnalyticsEvent, payload: EventMetadata = {}) => {
  await safeTrackEvent(event, payload);
};

export const logAIFeedback = async (feedback: AIFeedback) => {
  const payload = {
    ...feedback,
    user_id: feedback.user_id ?? null,
    learning_mode: feedback.learning_mode || 'unknown',
    created_at: new Date().toISOString(),
  };

  try {
    const client = getSupabaseClient();
    const user = await getAuthenticatedUser();
    const { error } = await client.from('ai_feedback').insert({
      ...payload,
      user_id: user.id
    });
    if (error) {
      logSupabaseError('ai_feedback', 'insert', error);
      throw error;
    }
  } catch (err) {
    logSupabaseError('ai_feedback', 'insert', err);
  }
};
