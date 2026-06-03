import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getQuestionsBySubject, getQuestionsByTopic, getRandomQuestionSet } from '../lib/questionBank';
import AsyncStorage from '@react-native-async-storage/async-storage';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  }
}));

vi.mock('../lib/supabase', () => ({
  supabase: null // Force offline mode for tests unless explicitly mocked
}));

describe('Question Bank', () => {
  const mockQuestions = [
    { id: '1', subject: 'Mathematics', topic: 'Algebra', difficulty: 'easy', question: 'Q1', options: [], correct_answer: 'A' },
    { id: '2', subject: 'Mathematics', topic: 'Algebra', difficulty: 'hard', question: 'Q2', options: [], correct_answer: 'B' },
    { id: '3', subject: 'Mathematics', topic: 'Geometry', difficulty: 'medium', question: 'Q3', options: [], correct_answer: 'C' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves questions by subject (offline cache)', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQuestions));
    
    const result = await getQuestionsBySubject('Mathematics');
    
    expect(result).toHaveLength(3);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('qb_cache_subject_Mathematics');
  });

  it('filters questions by topic from subject cache if topic cache misses', async () => {
    // Topic cache miss
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
    // Subject cache hit
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQuestions));
    
    const result = await getQuestionsByTopic('Mathematics', 'Algebra');
    
    expect(result).toHaveLength(2);
    expect(result[0].topic).toBe('Algebra');
  });

  it('selects random questions safely', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQuestions));
    
    const result = await getRandomQuestionSet('Mathematics', 'all', 'all', 2);
    
    expect(result).toHaveLength(2);
    // Ensure all returned items actually exist in the original set
    expect(mockQuestions).toEqual(expect.arrayContaining(result));
  });

  it('filters questions by difficulty', async () => {
    // Subject cache hit
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQuestions));

    const { getQuestionsByFilter } = await import('../lib/questionBank');
    const result = await getQuestionsByFilter('Mathematics', 'all', 'hard');
    
    expect(result).toHaveLength(1);
    expect(result[0].difficulty).toBe('hard');
  });

  it('filters questions by topic and difficulty combined', async () => {
    // Topic cache hit
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQuestions.filter(q => q.topic === 'Algebra')));

    const { getQuestionsByFilter } = await import('../lib/questionBank');
    const result = await getQuestionsByFilter('Mathematics', 'Algebra', 'easy');
    
    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe('Algebra');
    expect(result[0].difficulty).toBe('easy');
  });

  it('safely handles offline practice session save', async () => {
    const { savePracticeSession } = await import('../lib/questionBank');
    // Offline mode is active since supabase is null
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await savePracticeSession({
      subject: 'Mathematics',
      topic: 'Algebra',
      difficulty: 'hard',
      score: 80
    });
    
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
