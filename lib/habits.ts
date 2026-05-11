import { getSupabaseClient } from './supabaseOps';

export const updateStreak = async (userId: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const supabase = getSupabaseClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('last_active_date, streak_days')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return;

    const lastDate = profile.last_active_date;
    let newStreak = profile.streak_days || 0;

    if (!lastDate) {
      newStreak = 1;
    } else {
      const diff =
        (new Date(today).getTime() - new Date(lastDate).getTime()) /
        (1000 * 60 * 60 * 24);

      if (diff === 1) newStreak += 1;
      else if (diff > 1) newStreak = 1;
    }

    await supabase.from('profiles').update({
      last_active_date: today,
      streak_days: newStreak
    }).eq('id', userId);

    console.log('[HABIT] streak:', newStreak);
  } catch (err) {
    console.error('[HABIT ERROR]', err);
  }
};
