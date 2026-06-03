import { beforeEach, describe, expect, it, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

vi.mock('../lib/analytics', () => ({
  track: vi.fn(),
}));

vi.mock('../lib/mastery', () => ({
  getTopicMastery: vi.fn(),
  getSubjectMastery: vi.fn(),
}));

vi.mock('../lib/questionBank', () => ({
  getQuestionsByFilter: vi.fn(),
}));

import { track } from '../lib/analytics';
import { getSubjectMastery, getTopicMastery } from '../lib/mastery';
import { getQuestionsByFilter } from '../lib/questionBank';
import {
  allocateDifficultyCounts,
  buildAdaptiveQuestionSet,
  getDifficultyDistribution,
  getRecommendedDifficulty,
  getCachedAdaptiveProfile,
  trackAdaptiveDifficultyChanged,
  trackAdaptiveSessionStarted,
} from '../lib/adaptiveDifficulty';

const sampleQuestions = [
  { id: '1', subject: 'Mathematics', topic: 'Algebra', difficulty: 'easy' as const, question: 'Q1', options: ['A', 'B'], correct_answer: 'A' },
  { id: '2', subject: 'Mathematics', topic: 'Algebra', difficulty: 'easy' as const, question: 'Q2', options: ['A', 'B'], correct_answer: 'A' },
  { id: '3', subject: 'Mathematics', topic: 'Algebra', difficulty: 'easy' as const, question: 'Q3', options: ['A', 'B'], correct_answer: 'A' },
  { id: '4', subject: 'Mathematics', topic: 'Algebra', difficulty: 'medium' as const, question: 'Q4', options: ['A', 'B'], correct_answer: 'A' },
  { id: '5', subject: 'Mathematics', topic: 'Algebra', difficulty: 'medium' as const, question: 'Q5', options: ['A', 'B'], correct_answer: 'A' },
  { id: '6', subject: 'Mathematics', topic: 'Algebra', difficulty: 'hard' as const, question: 'Q6', options: ['A', 'B'], correct_answer: 'A' },
];

describe('adaptive difficulty engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTopicMastery).mockResolvedValue(null);
    vi.mocked(getSubjectMastery).mockResolvedValue([]);
    vi.mocked(getQuestionsByFilter).mockResolvedValue(sampleQuestions);
  });

  it('selects easy-heavy distribution when mastery < 50', () => {
    const dist = getDifficultyDistribution(30);
    expect(dist.easy).toBe(0.7);
    expect(dist.medium).toBe(0.25);
    expect(dist.hard).toBe(0.05);
    expect(getRecommendedDifficulty(30).primary).toBe('easy');
  });

  it('selects balanced distribution when mastery is 50-80', () => {
    const dist = getDifficultyDistribution(65);
    expect(dist.medium).toBe(0.5);
    expect(getRecommendedDifficulty(65).primary).toBe('medium');
  });

  it('selects hard-heavy distribution when mastery > 80', () => {
    const dist = getDifficultyDistribution(90);
    expect(dist.hard).toBe(0.5);
    expect(getRecommendedDifficulty(90).primary).toBe('hard');
  });

  it('allocates question counts to match session size', () => {
    const counts = allocateDifficultyCounts(10, getDifficultyDistribution(30));
    expect(counts.easy + counts.medium + counts.hard).toBe(10);
    expect(counts.easy).toBeGreaterThan(counts.hard);
  });

  it('builds adaptive question set from mastery profile', async () => {
    vi.mocked(getTopicMastery).mockResolvedValue({
      subject: 'Mathematics',
      topic: 'Algebra',
      attempts: 2,
      correct_answers: 5,
      total_answers: 20,
      mastery_percent: 25,
    });

    const result = await buildAdaptiveQuestionSet('user-1', 'Mathematics', 'Algebra', 5);

    expect(result.questions.length).toBe(5);
    expect(result.masteryPercent).toBe(25);
    expect(result.primary).toBe('easy');
    expect(getQuestionsByFilter).toHaveBeenCalledWith('Mathematics', 'Algebra', 'all');
  });

  it('transitions recommended difficulty when mastery crosses band', () => {
    expect(getRecommendedDifficulty(40).primary).toBe('easy');
    expect(getRecommendedDifficulty(60).primary).toBe('medium');
    expect(getRecommendedDifficulty(85).primary).toBe('hard');
  });

  it('caches adaptive profile offline', async () => {
    vi.mocked(getTopicMastery).mockResolvedValue({
      subject: 'Mathematics',
      topic: 'Algebra',
      attempts: 1,
      correct_answers: 9,
      total_answers: 10,
      mastery_percent: 85,
    });

    await buildAdaptiveQuestionSet('user-1', 'Mathematics', 'Algebra', 3);
    const cached = await getCachedAdaptiveProfile('user-1', 'Mathematics', 'Algebra');

    expect(cached).not.toBeNull();
    expect(cached?.masteryPercent).toBe(85);
    expect(cached?.primary).toBe('hard');
  });

  it('fires adaptive_session_started analytics', () => {
    trackAdaptiveSessionStarted({
      user_id: 'u1',
      subject: 'Biology',
      topic: 'Cells',
      mastery_percent: 45,
      primary_difficulty: 'easy',
      question_count: 10,
    });

    expect(track).toHaveBeenCalledWith(
      'adaptive_session_started',
      expect.objectContaining({ subject: 'Biology', primary_difficulty: 'easy' }),
    );
  });

  it('fires adaptive_difficulty_changed only when primary shifts', () => {
    trackAdaptiveDifficultyChanged({
      subject: 'Mathematics',
      topic: 'Algebra',
      previous_primary: 'easy',
      next_primary: 'easy',
      previous_mastery: 40,
      next_mastery: 45,
    });
    expect(track).not.toHaveBeenCalled();

    trackAdaptiveDifficultyChanged({
      subject: 'Mathematics',
      topic: 'Algebra',
      previous_primary: 'easy',
      next_primary: 'medium',
      previous_mastery: 48,
      next_mastery: 55,
    });
    expect(track).toHaveBeenCalledWith(
      'adaptive_difficulty_changed',
      expect.objectContaining({ next_primary: 'medium' }),
    );
  });
});
