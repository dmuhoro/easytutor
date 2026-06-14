import { beforeEach, describe, expect, it, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

vi.mock('../lib/supabase', () => ({
  supabase: null,
}));

vi.mock('../lib/analytics', () => ({
  track: vi.fn(),
}));

import { track } from '../lib/analytics';
import {
  buildPerformanceSessionSummary,
  calculateConfidenceScore,
  getFluencyLevel,
  getResponseFactor,
  recordPerformanceSession,
} from '../lib/performanceEngine';

describe('performance engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('captures response timing and fluency metrics from a session', () => {
    const summary = buildPerformanceSessionSummary({
      subject: 'Mathematics',
      topic: 'Algebra',
      totalQuestions: 5,
      correctAnswers: 4,
      responseTimesMs: [8000, 12000, 15000, 9000, 14000],
    });

    expect(summary.accuracy_score).toBe(80);
    expect(summary.average_response_time_ms).toBe(11600);
    expect(summary.fastest_response_time_ms).toBe(8000);
    expect(summary.slowest_response_time_ms).toBe(15000);
  });

  it('calculates confidence from accuracy and speed', () => {
    expect(getResponseFactor(9000)).toBe(100);
    expect(calculateConfidenceScore(80, 15000)).toBe(80);
  });

  it('classifies fluency bands deterministically', () => {
    expect(getFluencyLevel(35)).toBe('Emerging');
    expect(getFluencyLevel(50)).toBe('Developing');
    expect(getFluencyLevel(75)).toBe('Proficient');
    expect(getFluencyLevel(90)).toBe('Fluent');
  });

  it('persists performance profiles offline and fires analytics', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);

    const result = await recordPerformanceSession({
      userId: 'user-1',
      subject: 'Mathematics',
      topic: 'Algebra',
      totalQuestions: 5,
      correctAnswers: 5,
      responseTimesMs: [6000, 8000, 7000, 9000, 10000],
    });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
    expect(result.profile.fluency_level).toBe('Fluent');
    expect(result.trendOverview.latest_snapshot?.topic).toBe('Algebra');
    expect(track).toHaveBeenCalledWith(
      'performance_profile_updated',
      expect.objectContaining({
        subject: 'Mathematics',
        topic: 'Algebra',
        fluency_level: 'Fluent',
      }),
    );
  });

  it('detects fluency changes and updates cached profiles', async () => {
    const existingProfile = {
      user_id: 'user-1',
      subject: 'Physics',
      topic: 'Mechanics',
      session_count: 2,
      total_questions_answered: 10,
      total_correct_answers: 4,
      average_response_time_ms: 22000,
      fastest_response_time_ms: 15000,
      slowest_response_time_ms: 30000,
      accuracy_score: 40,
      confidence_score: 48,
      fluency_score: 48,
      fluency_level: 'Developing',
      updated_at: new Date().toISOString(),
    };

    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(existingProfile));

    const result = await recordPerformanceSession({
      userId: 'user-1',
      subject: 'Physics',
      topic: 'Mechanics',
      totalQuestions: 5,
      correctAnswers: 5,
      responseTimesMs: [7000, 9000, 10000, 8000, 11000],
    });

    expect(result.profile.fluency_level).toBe('Proficient');
    expect(track).toHaveBeenCalledWith(
      'fluency_level_changed',
      expect.objectContaining({
        previous_fluency_level: 'Developing',
        fluency_level: 'Proficient',
      }),
    );
  });
});
