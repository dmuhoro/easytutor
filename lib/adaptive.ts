import { getSupabaseClient, logSupabaseError } from './supabaseOps';
import { generateExplanation, logAIEvent } from './ai';

/**
 * Detects topics where the user's mastery is below the focus threshold.
 */
export const getWeakTopics = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    
    // RLS: user_id filter is critical
    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        topic_id,
        mastery_level,
        topics ( title, subject_id )
      `)
      .eq('user_id', userId)
      .lt('mastery_level', 50);

    if (error) {
      logSupabaseError('user_progress', 'select', error);
      return [];
    }

    console.log('[ADAPTIVE] fetched weak topics', { count: data?.length || 0 });
    return data || [];
  } catch (err) {
    console.error('[ERROR] [ADAPTIVE] FATAL in getWeakTopics', err);
    return [];
  }
};

/**
 * Recommends the next topic to focus on within a subject.
 * Prioritizes lowest mastery and then fewest attempts.
 */
export const recommendNextTopic = async (
  userId: string,
  subjectId: string
) => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        topic_id,
        mastery_level,
        attempts,
        topics ( title, subject_id )
      `)
      .eq('user_id', userId)
      .eq('subject_id', subjectId) // Using subject_id directly in user_progress
      .order('mastery_level', { ascending: true })
      .order('attempts', { ascending: true })
      .limit(1);

    if (error) {
      logSupabaseError('user_progress', 'select', error);
      return null;
    }

    const recommendation = data?.[0] || null;
    if (recommendation) {
      console.log('[ADAPTIVE] recommended next topic', { 
        topicId: recommendation.topic_id, 
        mastery: recommendation.mastery_level 
      });
    }

    return recommendation;

  } catch (err) {
    console.error('[ERROR] [ADAPTIVE] FATAL in recommendNextTopic', err);
    return null;
  }
};

/**
 * Fetches a weak topic and generates an AI explanation for it.
 * Bridges the gap between detection and learning.
 */
export const getWeakTopicWithExplanation = async (userId: string) => {
  try {
    const weakTopics = await getWeakTopics(userId);

    if (!weakTopics || weakTopics.length === 0) {
      return null;
    }

    // Select the weakest topic
    const topic = weakTopics[0];

    // Generate personalized AI explanation
    const explanation = await generateExplanation({
      topicTitle: (topic.topics as any)?.title || 'Topic',
      masteryLevel: topic.mastery_level,
      subjectId: (topic.topics as any)?.subject_id || 'general'
    });

    // Task 6.1: Log AI interaction
    await logAIEvent({
      userId,
      type: 'ai_explanation_generated',
      payload: {
        topicId: topic.topic_id,
        topicTitle: (topic.topics as any)?.title,
        mastery: topic.mastery_level
      }
    });

    return {
      ...topic,
      explanation
    };
  } catch (err) {
    console.error('[ERROR] [ADAPTIVE] FATAL in getWeakTopicWithExplanation', err);
    return null;
  }
};
