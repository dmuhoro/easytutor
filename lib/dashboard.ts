import { getSupabaseClient } from './supabaseOps';

export const getXPTrend = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('user_events')
      .select('created_at, payload')
      .eq('user_id', userId)
      .eq('event_type', 'xp_earned')
      .order('created_at', { ascending: true });

    return (data || []).map((e: any) => ({
      date: e.created_at,
      xp: e.payload?.xp || 0
    }));
  } catch (err) {
    console.error('[DASHBOARD ERROR]', err);
    return [];
  }
};

export const getMasteryDistribution = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('user_progress')
      .select('mastery_level')
      .eq('user_id', userId);

    let weak = 0, developing = 0, strong = 0;

    (data || []).forEach((t: any) => {
      if (t.mastery_level < 40) weak++;
      else if (t.mastery_level < 70) developing++;
      else strong++;
    });

    return { weak, developing, strong };
  } catch (err) {
    console.error('[DASHBOARD ERROR]', err);
    return { weak: 0, developing: 0, strong: 0 };
  }
};

export const getStreak = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_days')
      .eq('id', userId)
      .maybeSingle();

    return profile?.streak_days || 0;
  } catch (err) {
    console.error('[DASHBOARD ERROR]', err);
    return 0;
  }
};
