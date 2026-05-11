import { getSupabaseClient, logSupabaseError } from './supabaseOps';

export interface RecordProgressParams {
  userId: string;
  topicId: string;
  subjectId: string; // Required for schema consistency
  isCorrect: boolean;
}

/**
 * Records topic-level progress, tracking attempts and mastery.
 * Idempotent: upserts or updates existing progress rows.
 */
export const recordProgress = async ({
  userId,
  topicId,
  subjectId,
  isCorrect
}: RecordProgressParams) => {
  try {
    const supabase = getSupabaseClient();
    
    // 1. Fetch existing progress
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .maybeSingle();

    if (error) {
      logSupabaseError('user_progress', 'select', error);
      return;
    }

    if (!data) {
      // 2a. Create new progress row if none exists
      console.log('[PROGRESS] creating new progress row', { userId, topicId });
      const { error: insertError } = await supabase.from('user_progress').insert({
        user_id: userId,
        topic_id: topicId,
        subject_id: subjectId,
        attempts: 1,
        correct_answers: isCorrect ? 1 : 0,
        mastery_level: isCorrect ? 20 : 5,
        last_activity: new Date().toISOString()
      });

      if (insertError) {
        logSupabaseError('user_progress', 'insert', insertError);
      }
      return;
    }

    // 2b. Update existing progress
    const attempts = (data.attempts || 0) + 1;
    const correct = (data.correct_answers || 0) + (isCorrect ? 1 : 0);

    // Mastery calculation: percentage of correct answers capped at 100
    const mastery = Math.min(
      100,
      Math.round((correct / attempts) * 100)
    );

    console.log('[PROGRESS] updating existing progress', { 
      userId, 
      topicId, 
      attempts, 
      mastery 
    });

    const { error: updateError } = await supabase
      .from('user_progress')
      .update({
        attempts,
        correct_answers: correct,
        mastery_level: mastery,
        last_activity: new Date().toISOString()
      })
      .eq('id', data.id);

    if (updateError) {
      logSupabaseError('user_progress', 'update', updateError);
    }

  } catch (err) {
    console.error('[ERROR] [PROGRESS]', err);
  }
};
