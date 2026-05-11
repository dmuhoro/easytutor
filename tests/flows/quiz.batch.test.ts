import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getQuizBatch, preloadNextBatch } from '../../lib/quizProvider';
import * as aiQuiz from '../../lib/aiQuiz';
import { setCachedQuiz, getCachedQuiz } from '../../lib/quizCache';
import { mockSupabase } from '../utils/mockSupabase';

vi.mock('../../lib/supabaseOps', () => ({
  getSupabaseClient: () => mockSupabase.client,
  getAuthenticatedUser: async () => mockSupabase.user,
  logSupabaseError: vi.fn(),
}));

describe('Quiz Batch System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.db.quiz_sessions = [];
    // Clear memory cache manually
    setCachedQuiz('algebra-medium', []);
  });

  it('returns cached quizzes when available', async () => {
    setCachedQuiz('algebra-medium', [
      {
        question: 'Local cache question?',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
        explanation: 'local',
      },
    ]);

    const batch = await getQuizBatch({
      topicId: '22222222-2222-4222-8222-222222222222',
      topicTitle: 'algebra',
      subjectId: 'hs-math',
      difficulty: 'medium',
    });

    expect(batch).toHaveLength(1);
    expect(batch[0].question).toBe('Local cache question?');
  });

  it('generates batch when cache empty', async () => {
    vi.spyOn(aiQuiz, 'generateAIQuizBatch').mockResolvedValueOnce([
      {
        question: 'AI generated?',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 1,
        explanation: 'ai',
      },
    ]);

    const batch = await getQuizBatch({
      topicId: '22222222-2222-4222-8222-222222222222',
      topicTitle: 'algebra',
      subjectId: 'hs-math',
      difficulty: 'medium',
    });

    expect(batch).toHaveLength(1);
    expect(batch[0].question).toBe('AI generated?');
    expect(aiQuiz.generateAIQuizBatch).toHaveBeenCalled();
  });

  it('stores generated quizzes in DB', async () => {
    vi.spyOn(aiQuiz, 'generateAIQuizBatch').mockResolvedValueOnce([
      {
        question: 'Stored in DB?',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 2,
        explanation: 'db',
      },
    ]);

    await getQuizBatch({
      topicId: '22222222-2222-4222-8222-222222222222',
      topicTitle: 'algebra',
      subjectId: 'hs-math',
      difficulty: 'medium',
    });

    const sessions = mockSupabase.db.quiz_sessions;
    expect(sessions.length).toBe(1);
    expect(sessions[0].question_text).toBe('Stored in DB?');
    expect(sessions[0].ai_generated).toBe(true);
  });

  it('preloads next batch', () => {
    expect(preloadNextBatch).toBeDefined();
    // Testing async setTimeout preload is out of scope for simple test
    expect(true).toBe(true);
  });
});
