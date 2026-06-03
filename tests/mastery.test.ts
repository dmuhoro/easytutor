import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateMastery, getSubjectMastery, getWeakTopics } from '../lib/mastery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { track } from '../lib/analytics';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    getAllKeys: vi.fn()
  }
}));

vi.mock('../lib/supabase', () => ({
  supabase: null // Force offline mode
}));

vi.mock('../lib/analytics', () => ({
  track: vi.fn()
}));

describe('Mastery Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates mastery percent and tracks mastery_updated', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
    
    await updateMastery('user123', 'Mathematics', 'Algebra', 4, 5); // 80%
    
    expect(AsyncStorage.setItem).toHaveBeenCalled();
    const setCallArgs = vi.mocked(AsyncStorage.setItem).mock.calls[0];
    const savedRecord = JSON.parse(setCallArgs[1]);
    
    expect(savedRecord.mastery_percent).toBe(80);
    expect(savedRecord.attempts).toBe(1);
    
    expect(track).toHaveBeenCalledWith('mastery_updated', expect.objectContaining({
      subject: 'Mathematics',
      topic: 'Algebra',
      mastery_percent: 80,
      attempts: 1
    }));
  });

  it('detects weak topic and tracks weak_topic_detected after 2 attempts', async () => {
    const existingRecord = {
      subject: 'Physics',
      topic: 'Mechanics',
      attempts: 1,
      correct_answers: 1,
      total_answers: 5,
      mastery_percent: 20
    };
    
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(existingRecord));
    
    // Second attempt, score 1/5 -> total 2/10 = 20%
    await updateMastery('user123', 'Physics', 'Mechanics', 1, 5);
    
    expect(track).toHaveBeenCalledWith('weak_topic_detected', expect.objectContaining({
      subject: 'Physics',
      topic: 'Mechanics',
      mastery_percent: 20
    }));
  });

  it('persists progress locally in offline mode', async () => {
    const records = {
      'mastery_cache_Biology_Cells': JSON.stringify({
        subject: 'Biology',
        topic: 'Cells',
        attempts: 3,
        correct_answers: 12,
        total_answers: 15,
        mastery_percent: 80
      }),
      'mastery_cache_Biology_Genetics': JSON.stringify({
        subject: 'Biology',
        topic: 'Genetics',
        attempts: 2,
        correct_answers: 3,
        total_answers: 10,
        mastery_percent: 30 // Weak
      })
    };

    vi.mocked(AsyncStorage.getAllKeys).mockResolvedValueOnce(Object.keys(records));
    vi.mocked(AsyncStorage.getItem).mockImplementation(async (key) => records[key as keyof typeof records] || null);
    
    const weakTopics = await getWeakTopics('user123');
    
    expect(weakTopics).toHaveLength(1);
    expect(weakTopics[0].topic).toBe('Genetics');
    expect(weakTopics[0].mastery_percent).toBe(30);
  });
});
