import { beforeEach, describe, expect, it, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

vi.mock('../lib/performanceEngine', () => ({
  getAllPerformanceProfiles: vi.fn(),
  getResponseFactor: vi.fn((averageResponseTimeMs: number) => {
    const seconds = averageResponseTimeMs / 1000;
    if (seconds <= 10) return 100;
    if (seconds <= 20) return 80;
    if (seconds <= 30) return 60;
    return 40;
  }),
}));

vi.mock('../lib/mastery', () => ({
  getWeakTopics: vi.fn(),
  getSubjectMastery: vi.fn(),
}));

vi.mock('../lib/trendEngine', () => ({
  getLearningTrendOverview: vi.fn().mockResolvedValue({ latest_snapshot: null })
}));

vi.mock('../lib/weaknessPredictionEngine', () => ({
  predictWeaknesses: vi.fn().mockResolvedValue([]),
  getWeaknessPredictionStore: vi.fn().mockReturnValue({ save: vi.fn() })
}));

vi.mock('../lib/spacedRepetitionEngine', () => ({
  getRetentionStore: vi.fn().mockReturnValue({ fetchAll: vi.fn().mockResolvedValue([]) }),
  getDueReviews: vi.fn().mockResolvedValue([]),
  getAtRiskKnowledge: vi.fn().mockResolvedValue([])
}));

vi.mock('../lib/interventionEngine', () => ({
  generateInterventions: vi.fn().mockReturnValue([]),
  prioritizeInterventions: vi.fn().mockReturnValue([]),
  rankNextBestActions: vi.fn().mockReturnValue([])
}));

vi.mock('../lib/learningPlanEngine', () => ({
  computeAndPersistLearningPlan: vi.fn().mockResolvedValue({ dailyTasks: [], weeklyPlan: {} })
}));

vi.mock('../lib/learningIdentityEngine', () => ({
  getIdentity: vi.fn().mockResolvedValue(null)
}));

vi.mock('../lib/knowledgeGraphEngine', () => ({
  getActiveKnowledgePath: vi.fn().mockResolvedValue(null),
  getAllKnowledgeNodes: vi.fn().mockResolvedValue(new Map())
}));

const upsert = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert,
    })),
  },
}));

import { getWeakTopics } from '../lib/mastery';
import { getAllPerformanceProfiles } from '../lib/performanceEngine';
import {
  buildStudentLearningDashboard,
  loadCachedLearningDashboard,
} from '../lib/recommendations';

describe('student learning dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates personalized strengths, weaknesses, and recommendations', async () => {
    vi.mocked(getAllPerformanceProfiles).mockResolvedValue([
      {
        user_id: 'user-1',
        subject: 'Mathematics',
        topic: 'Algebra',
        session_count: 2,
        total_questions_answered: 10,
        total_correct_answers: 9,
        average_response_time_ms: 15000,
        fastest_response_time_ms: 9000,
        slowest_response_time_ms: 20000,
        accuracy_score: 90,
        confidence_score: 88,
        fluency_score: 88,
        fluency_level: 'Fluent',
        updated_at: new Date().toISOString(),
      },
      {
        user_id: 'user-1',
        subject: 'Physics',
        topic: 'Mechanics',
        session_count: 2,
        total_questions_answered: 10,
        total_correct_answers: 4,
        average_response_time_ms: 28000,
        fastest_response_time_ms: 22000,
        slowest_response_time_ms: 34000,
        accuracy_score: 40,
        confidence_score: 48,
        fluency_score: 48,
        fluency_level: 'Developing',
        updated_at: new Date().toISOString(),
      },
    ]);
    vi.mocked(getWeakTopics).mockResolvedValue([
      {
        subject: 'Chemistry',
        topic: 'Mole Concept',
        attempts: 3,
        correct_answers: 6,
        total_answers: 15,
        mastery_percent: 40,
        updated_at: new Date().toISOString(),
      },
    ]);

    const dashboard = await buildStudentLearningDashboard('user-1');

    expect(dashboard.strengths[0].topic).toBe('Algebra');
    expect(dashboard.weaknesses.map((item) => item.topic)).toEqual(
      expect.arrayContaining(['Mechanics', 'Mole Concept']),
    );
    expect(dashboard.recommendations[0].action_label).toBe('Review now');
    expect(dashboard.recommendations[0].reason).toContain('Accuracy is at 40%');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      expect.stringContaining('learning_dashboard_cache_v1:user-1'),
      expect.any(String),
    );
    expect(upsert).toHaveBeenCalled();
  });

  it('falls back to cached dashboard when live data is unavailable', async () => {
    const cachedDashboard = {
      user_id: 'user-1',
      accuracy_score: 72,
      confidence_score: 70,
      fluency_score: 70,
      fluency_level: 'Proficient',
      average_response_time_ms: 18000,
      strengths: [],
      weaknesses: [],
      recommendations: [],
      generated_at: new Date().toISOString(),
      learning_health_score: 75,
      learning_health_classification: 'Stable',
    } as any;

    vi.mocked(getAllPerformanceProfiles).mockResolvedValue([]);
    vi.mocked(getWeakTopics).mockResolvedValue([]);
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(cachedDashboard));

    const cached = await loadCachedLearningDashboard('user-1');

    expect(cached?.accuracy_score).toBe(72);
  });
});
