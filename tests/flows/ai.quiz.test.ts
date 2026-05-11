import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeParseQuiz, generateAIQuiz, getQuizQuestion, getStaticQuestion } from '../../lib/aiQuiz';

// Mock AI API
vi.mock('../../lib/api', () => ({
  askTutor: vi.fn(async () => ({ 
    success: true, 
    data: JSON.stringify({
      question: 'What is 2+2?',
      options: ['3', '4', '5', '6'],
      correctIndex: 1,
      explanation: 'Basic math.'
    }) 
  })),
}));

describe('AI Quiz System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('safeParseQuiz', () => {
    it('validates a correct quiz structure', () => {
      const raw = JSON.stringify({
        question: 'Test?',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
        explanation: 'Exp'
      });
      const result = safeParseQuiz(raw);
      expect(result).not.toBeNull();
      expect(result?.correctIndex).toBe(0);
    });

    it('rejects invalid option counts', () => {
      const raw = JSON.stringify({
        question: 'Test?',
        options: ['A', 'B'],
        correctIndex: 0,
        explanation: 'Exp'
      });
      expect(safeParseQuiz(raw)).toBeNull();
    });

    it('rejects invalid correctIndex', () => {
      const raw = JSON.stringify({
        question: 'Test?',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 5,
        explanation: 'Exp'
      });
      expect(safeParseQuiz(raw)).toBeNull();
    });
  });

  describe('generateAIQuiz', () => {
    it('returns a validated quiz object from AI', async () => {
      const result = await generateAIQuiz({
        topicTitle: 'Math',
        difficulty: 'easy',
        subjectId: 'hs-math'
      });
      expect(result).not.toBeNull();
      expect(result?.question).toBe('What is 2+2?');
    });
  });

  describe('Fallback Logic', () => {
    it('returns static question when AI fails', async () => {
      // Temporarily override the mock to simulate failure
      const { askTutor } = await import('../../lib/api');
      vi.mocked(askTutor).mockResolvedValueOnce({ success: false, error: 'API Down' });

      const result = await getQuizQuestion({
        topicTitle: 'Physics',
        difficulty: 'hard',
        subjectId: 'hs-physics'
      });

      expect(result.question).toContain('Physics');
      expect(result.explanation).toContain('Fallback');
    });
  });

  describe('Static Questions', () => {
    it('generates valid static structure', () => {
      const result = getStaticQuestion('Chemistry');
      expect(result.options.length).toBe(4);
      expect(result.correctIndex).toBe(0);
    });
  });
});
