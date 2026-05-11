import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateStreak } from '../../lib/habits';
import { getXPTrend, getMasteryDistribution } from '../../lib/dashboard';
import { mockSupabase } from '../utils/mockSupabase';

vi.mock('../../lib/supabaseOps', () => ({
  getSupabaseClient: () => mockSupabase.client,
}));

describe('Dashboard & Habits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.db.profiles = [
      { id: 'user-1', last_active_date: '2023-01-01', streak_days: 1 }
    ];
    mockSupabase.db.user_events = [];
    mockSupabase.db.user_progress = [];
  });

  it('updates streak correctly', async () => {
    vi.useFakeTimers();
    // Simulate one day later
    vi.setSystemTime(new Date('2023-01-02T10:00:00Z'));
    
    await updateStreak('user-1');
    
    expect(mockSupabase.db.profiles[0].streak_days).toBe(2);
    expect(mockSupabase.db.profiles[0].last_active_date).toBe('2023-01-02');
    vi.useRealTimers();
  });

  it('aggregates XP trend', async () => {
    mockSupabase.db.user_events = [
      { user_id: 'user-1', event_type: 'xp_earned', payload: { xp: 10 }, created_at: '2023-01-01' },
      { user_id: 'user-1', event_type: 'xp_earned', payload: { xp: 20 }, created_at: '2023-01-02' }
    ];

    const trend = await getXPTrend('user-1');
    expect(trend).toHaveLength(2);
    expect(trend[0].xp).toBe(10);
    expect(trend[1].xp).toBe(20);
  });

  it('calculates mastery distribution', async () => {
    mockSupabase.db.user_progress = [
      { user_id: 'user-1', mastery_level: 20 }, // weak
      { user_id: 'user-1', mastery_level: 50 }, // developing
      { user_id: 'user-1', mastery_level: 80 }, // strong
      { user_id: 'user-1', mastery_level: 90 }, // strong
    ];

    const dist = await getMasteryDistribution('user-1');
    expect(dist.weak).toBe(1);
    expect(dist.developing).toBe(1);
    expect(dist.strong).toBe(2);
  });
});
