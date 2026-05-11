import { getSupabaseClient } from './supabaseOps';
import { LearningMode } from '../store/roadmapStore';
import { logError } from './logEvent';

/**
 * Updates the user's active learning mode (portal) in Supabase.
 */
export const updateLearningMode = async (userId: string, mode: LearningMode) => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({ learning_mode: mode })
      .eq('id', userId);

    if (error) {
      logError('PROFILE_updateLearningMode_failed', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    logError('PROFILE_updateLearningMode_fatal', err);
    return { success: false, error: err };
  }
};
