import { describe, it, expect, vi, beforeEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { track } from '../lib/analytics';
import {
  getStreakData,
  updateStreak,
  logPracticeTimestamp,
  getPracticeFrequency,
  computeMomentum,
  getMomentumCategory,
  recordPracticeMomentum,
} from '../lib/streaks';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    getAllKeys: vi.fn(),
  },
}));

vi.mock('../lib/supabase', () => ({
  supabase: null,
}));

vi.mock('../lib/analytics', () => ({
  track: vi.fn(),
}));

// Helper: produce a YYYY-MM-DD string for "today minus N days"
const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

const today = (): string => new Date().toISOString().split('T')[0];

describe('Streak Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default zero streak when nothing cached', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
    const data = await getStreakData();
    expect(data.current_streak).toBe(0);
    expect(data.longest_streak).toBe(0);
    expect(data.last_activity_date).toBe('');
  });

  it('starts a new streak on first activity', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null); // getStreakData
    await updateStreak();

    const setCall = vi.mocked(AsyncStorage.setItem).mock.calls[0];
    const saved = JSON.parse(setCall[1]);

    expect(saved.current_streak).toBe(1);
    expect(saved.longest_streak).toBe(1);
    expect(saved.last_activity_date).toBe(today());
  });

  it('does not increment streak on same-day activity', async () => {
    const existing = {
      current_streak: 3,
      longest_streak: 5,
      last_activity_date: today(),
    };
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(existing));
    const result = await updateStreak();

    // Should return same data without writing
    expect(result.current_streak).toBe(3);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('increments streak on consecutive day', async () => {
    const existing = {
      current_streak: 4,
      longest_streak: 4,
      last_activity_date: daysAgo(1),
    };
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(existing));
    await updateStreak();

    const setCall = vi.mocked(AsyncStorage.setItem).mock.calls[0];
    const saved = JSON.parse(setCall[1]);

    expect(saved.current_streak).toBe(5);
    expect(saved.longest_streak).toBe(5);
  });

  it('shows zero current streak when last activity was more than one day ago', async () => {
    const existing = {
      current_streak: 10,
      longest_streak: 10,
      last_activity_date: daysAgo(2),
    };
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(existing));
    const data = await getStreakData();
    expect(data.current_streak).toBe(0);
    expect(data.longest_streak).toBe(10);
  });

  it('resets streak after missing a day', async () => {
    const existing = {
      current_streak: 10,
      longest_streak: 10,
      last_activity_date: daysAgo(2), // 2 days ago — gap!
    };
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(existing));
    await updateStreak();

    const setCall = vi.mocked(AsyncStorage.setItem).mock.calls[0];
    const saved = JSON.parse(setCall[1]);

    expect(saved.current_streak).toBe(1);
    expect(saved.longest_streak).toBe(10); // longest preserved
  });

  it('tracks streak_updated analytics event', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
    await updateStreak();

    expect(track).toHaveBeenCalledWith(
      'streak_updated',
      expect.objectContaining({
        current_streak: 1,
        longest_streak: 1,
      }),
    );
  });
});

describe('Practice Frequency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs a practice timestamp', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
    await logPracticeTimestamp();
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('counts sessions within the last 7 days', async () => {
    const now = new Date();
    const recent = [
      new Date(now.getTime() - 1 * 86_400_000).toISOString(), // 1 day ago
      new Date(now.getTime() - 3 * 86_400_000).toISOString(), // 3 days ago
      new Date(now.getTime() - 10 * 86_400_000).toISOString(), // 10 days ago (excluded)
    ];
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(recent));

    const count = await getPracticeFrequency(7);
    expect(count).toBe(2);
  });
});

describe('Momentum Score', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('categorises scores correctly', () => {
    expect(getMomentumCategory(0)).toBe('Starting');
    expect(getMomentumCategory(25)).toBe('Starting');
    expect(getMomentumCategory(26)).toBe('Building');
    expect(getMomentumCategory(50)).toBe('Building');
    expect(getMomentumCategory(51)).toBe('Consistent');
    expect(getMomentumCategory(75)).toBe('Consistent');
    expect(getMomentumCategory(76)).toBe('Elite');
    expect(getMomentumCategory(100)).toBe('Elite');
  });

  it('computes momentum with zero data', async () => {
    // getStreakData → null
    // getPracticeFrequency → null
    // getSubjectMastery → empty (getAllKeys → [])
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    vi.mocked(AsyncStorage.getAllKeys).mockResolvedValue([]);

    const result = await computeMomentum(undefined);

    expect(result.score).toBe(0);
    expect(result.category).toBe('Starting');
    expect(result.streak).toBe(0);
    expect(result.masteryGrowth).toBe(0);
    expect(result.practiceFrequency).toBe(0);
  });

  it('fires momentum_score_updated analytics', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    vi.mocked(AsyncStorage.getAllKeys).mockResolvedValue([]);

    await computeMomentum(undefined);

    expect(track).toHaveBeenCalledWith(
      'momentum_score_updated',
      expect.objectContaining({
        score: expect.any(Number),
        category: expect.any(String),
      }),
    );
  });

  it('recordPracticeMomentum updates streak and momentum', async () => {
    vi.mocked(AsyncStorage.getItem).mockImplementation(async (key) => {
      if (key === 'learning_streak') return null;
      if (key === 'practice_log') return JSON.stringify([]);
      return null;
    });
    vi.mocked(AsyncStorage.getAllKeys).mockResolvedValue([]);

    const result = await recordPracticeMomentum('user-1');

    expect(result.category).toBeDefined();
    expect(AsyncStorage.setItem).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('streak_updated', expect.any(Object));
    expect(track).toHaveBeenCalledWith('momentum_score_updated', expect.any(Object));
  });

  it('offline persistence — streak survives across calls', async () => {
    const streakData = {
      current_streak: 5,
      longest_streak: 5,
      last_activity_date: today(),
    };
    // First call for getStreakData
    vi.mocked(AsyncStorage.getItem).mockImplementation(async (key) => {
      if (key === 'learning_streak') return JSON.stringify(streakData);
      if (key === 'practice_log') return JSON.stringify([]);
      return null;
    });
    vi.mocked(AsyncStorage.getAllKeys).mockResolvedValue([]);

    const result = await computeMomentum(undefined);
    // 5/30 * 40 ≈ 6.67 → streak component
    expect(result.streak).toBe(5);
    expect(result.score).toBeGreaterThan(0);
  });
});
