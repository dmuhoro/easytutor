import { beforeEach, describe, expect, it, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

const insert = vi.fn().mockResolvedValue({ error: null });
const order = vi.fn().mockResolvedValue({ data: [], error: null });
const eq = vi.fn(() => ({ order }));
const select = vi.fn(() => ({ eq }));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert,
      select,
    })),
  },
}));

vi.mock('../lib/supabaseOps', () => ({
  logSupabaseError: vi.fn(),
}));

import {
  buildLearningTrendOverview,
  loadCachedLearningTrendOverview,
  recordLearningTrendSnapshot,
} from '../lib/trendEngine';

const makeSnapshot = (overrides: Partial<Parameters<typeof buildLearningTrendOverview>[1][number]> = {}) => ({
  user_id: 'user-1',
  subject: 'Mathematics',
  topic: 'Algebra',
  accuracy_score: 70,
  confidence_score: 72,
  fluency_score: 72,
  fluency_level: 'Proficient' as const,
  average_response_time_ms: 18000,
  fastest_response_time_ms: 12000,
  slowest_response_time_ms: 24000,
  response_speed_score: 80,
  session_completed: true,
  session_count: 3,
  total_questions_answered: 15,
  total_correct_answers: 11,
  completed_at: new Date('2026-06-03T10:00:00.000Z').toISOString(),
  ...overrides,
});

describe('trend engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records a snapshot locally and remotely after a completed session', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
    vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);

    const result = await recordLearningTrendSnapshot(
      {
        userId: 'user-1',
        subject: 'Mathematics',
        topic: 'Algebra',
        totalQuestions: 5,
        correctAnswers: 4,
        responseTimesMs: [9000, 11000, 10000, 12000, 8000],
      },
      {
        accuracy_score: 80,
        average_response_time_ms: 10000,
        fastest_response_time_ms: 8000,
        slowest_response_time_ms: 12000,
        confidence_score: 82,
        fluency_score: 82,
        fluency_level: 'Fluent',
      },
      {
        user_id: 'user-1',
        subject: 'Mathematics',
        topic: 'Algebra',
        session_count: 1,
        total_questions_answered: 5,
        total_correct_answers: 4,
        average_response_time_ms: 10000,
        fastest_response_time_ms: 8000,
        slowest_response_time_ms: 12000,
        accuracy_score: 80,
        confidence_score: 82,
        fluency_score: 82,
        fluency_level: 'Fluent',
        updated_at: '2026-06-03T10:00:00.000Z',
      },
    );

    expect(insert).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      expect.stringContaining('learning_trend_snapshots_cache_v1:user-1'),
      expect.any(String),
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      expect.stringContaining('learning_trend_overview_cache_v1:user-1'),
      expect.any(String),
    );
    expect(result.snapshot.response_speed_score).toBe(100);
    expect(result.overview.weekly?.session_completion_count).toBe(1);
    expect(result.overview.weekly?.trend_summary).toContain('increased');
  });

  it('calculates trend improvements and the strongest metric across windows', () => {
    const overview = buildLearningTrendOverview('user-1', [
      makeSnapshot({
        completed_at: '2026-06-02T10:00:00.000Z',
        accuracy_score: 50,
        confidence_score: 50,
        fluency_score: 50,
        average_response_time_ms: 30000,
        response_speed_score: 60,
      }),
      makeSnapshot({
        completed_at: '2026-06-03T10:00:00.000Z',
        accuracy_score: 70,
        confidence_score: 95,
        fluency_score: 76,
        average_response_time_ms: 12000,
        response_speed_score: 80,
      }),
    ]);

    expect(overview.weekly?.most_improved_metric).toBe('confidence_score');
    expect(overview.weekly?.best_performing_metric).toBe('confidence_score');
    expect(overview.weekly?.trend_summary).toContain('increased');
    expect(overview.weekly?.session_completion_change).toBe(2);
  });

  it('detects multi-day stagnation and surfaces a plateau message', () => {
    const snapshots = Array.from({ length: 10 }, (_, index) =>
      makeSnapshot({
        completed_at: new Date(Date.UTC(2026, 5, index + 1, 10, 0, 0)).toISOString(),
        accuracy_score: 65,
        confidence_score: 65,
        fluency_score: 65,
        average_response_time_ms: 20000,
        response_speed_score: 80,
      }),
    );

    const overview = buildLearningTrendOverview('user-1', snapshots);

    expect(overview.stagnation_streak_days).toBe(10);
    expect(overview.daily?.stagnation_detected).toBe(true);
    expect(overview.daily?.trend_summary).toContain('plateaued');
  });

  it('loads cached trend overviews when they are available offline', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(
      JSON.stringify({
        user_id: 'user-1',
        latest_snapshot: makeSnapshot(),
        daily: null,
        weekly: null,
        monthly: null,
        best_performing_metric: 'confidence_score',
        most_improved_metric: 'confidence_score',
        most_concerning_metric: 'accuracy_score',
        stagnation_streak_days: 0,
        trend_summary: 'Confidence increased by 12% this week.',
        reinforcement_message: 'Keep going.',
        generated_at: new Date().toISOString(),
      }),
    );

    const cached = await loadCachedLearningTrendOverview('user-1');

    expect(cached?.trend_summary).toContain('Confidence increased');
  });
});
