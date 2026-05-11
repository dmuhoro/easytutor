import { logError } from '../lib/logEvent';
import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProgressStore } from '../store/progressStore';
import { getAuthenticatedUser, getSupabaseClient, logSupabaseError } from '../lib/supabaseOps';
import { resolveTopicIdOrThrow } from '../lib/resolveTopicId';

export interface TopicProgress {
  topic_id: string;
  subject_id: string;
  completed_at: string;
}

export const useTopicProgress = (subjectId: string) => {
  const { user } = useAuthStore();
  const { awardXP } = useProgressStore();
  const [progress, setProgress] = useState<Record<string, TopicProgress>>({});
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user || !subjectId) return;
    setLoading(true);

    try {
      const client = getSupabaseClient();
      const authUser = await getAuthenticatedUser();
      
      const { data, error } = await client
        .from('user_progress')
        .select('topic_id, subject_id, completed_at')
        .eq('user_id', authUser.id)
        .eq('subject_id', subjectId);

      if (error) {
        logSupabaseError('user_progress', 'select', error);
        throw error;
      }

      const progressMap = (data || []).reduce((acc, item) => {
        acc[item.topic_id] = item;
        return acc;
      }, {} as Record<string, TopicProgress>);

      setProgress(progressMap);
    } catch (err) {
      logError('fetchProgress_Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, subjectId]);

  const completeTopic = async (topicId: string, topicTitle: string, score: number) => {
    if (!user || !subjectId) return;

    // Threshold check
    if (score < 80) return;

    try {
      const client = getSupabaseClient();
      const authUser = await getAuthenticatedUser();

      // Bulletproof topic resolution
      const resolvedTopicId = await resolveTopicIdOrThrow(topicId || topicTitle, subjectId);

      if (!resolvedTopicId) {
        throw new Error('[FATAL] topic_id resolution failed');
      }

      // Mark as completed in user_progress
      const { error: progressError } = await client.from('user_progress').upsert({
        user_id: authUser.id,
        subject_id: subjectId,
        topic_id: resolvedTopicId,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,topic_id' });

      if (progressError) {
        logSupabaseError('user_progress', 'upsert', progressError);
        throw progressError;
      }

      // Award XP
      await awardXP(20);

      await fetchProgress(); // Refresh local state
    } catch (err) {
      logError('completeTopic_Error:', err);
      throw err; // Fail loudly
    }
  };

  return {
    progress,
    loading,
    fetchProgress,
    completeTopic
  };
};
