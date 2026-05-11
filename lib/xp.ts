import { getSupabaseClient, logSupabaseError } from './supabaseOps';

/**
 * Awards XP to a user and updates their level.
 * Level is calculated as floor(xp / 100) + 1.
 */
export const awardXP = async (userId: string, amount: number) => {
  try {
    const supabase = getSupabaseClient();

    // 1. Fetch current XP and level
    const { data, error } = await supabase
      .from('profiles')
      .select('xp_total, level')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logSupabaseError('profiles', 'select', error);
      return;
    }

    if (!data) {
      console.error('[ERROR] [XP] Profile not found for user', userId);
      return;
    }

    const currentXP = data.xp_total || 0;
    const newXP = currentXP + amount;
    const newLevel = Math.floor(newXP / 100) + 1;

    console.log('[XP] awarding xp', { userId, amount, newXP, newLevel });

    // 2. Update profile with new XP and level
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        xp_total: newXP,
        level: newLevel
      })
      .eq('id', userId);

    if (updateError) {
      logSupabaseError('profiles', 'update', updateError);
    }

  } catch (err) {
    console.error('[ERROR] [XP]', err);
  }
};
