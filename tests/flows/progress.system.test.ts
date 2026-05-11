import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recordProgress } from '../../lib/progress';
import { awardXP } from '../../lib/xp';
import { mockSupabase, TEST_USER_ID } from '../utils/mockSupabase';

// Mock the supabase client globally for these tests
vi.mock('../../lib/supabaseOps', async () => {
  const actual = await vi.importActual('../../lib/supabaseOps');
  return {
    ...actual as any,
    getSupabaseClient: () => mockSupabase.client,
  };
});

describe('Progress System', () => {
  beforeEach(() => {
    mockSupabase.reset();
  });

  describe('recordProgress', () => {
    const topicId = '22222222-2222-4222-8222-222222222222';
    const subjectId = 'hs-math';

    it('creates new progress row on first attempt', async () => {
      await recordProgress({
        userId: TEST_USER_ID,
        topicId,
        subjectId,
        isCorrect: true
      });

      const progress = mockSupabase.db.user_progress.find(
        p => p.user_id === TEST_USER_ID && p.topic_id === topicId
      );

      expect(progress).toBeTruthy();
      expect(progress?.attempts).toBe(1);
      expect(progress?.correct_answers).toBe(1);
      expect(progress?.mastery_level).toBe(20); // Per prompt: 20 for first correct
    });

    it('updates existing progress correctly on second attempt', async () => {
      // Setup: existing progress (1 attempt, 0 correct)
      mockSupabase.db.user_progress.push({
        id: '99999999-9999-9999-9999-999999999999',
        user_id: TEST_USER_ID,
        topic_id: topicId,
        subject_id: subjectId,
        attempts: 1,
        correct_answers: 0,
        mastery_level: 0
      });

      await recordProgress({
        userId: TEST_USER_ID,
        topicId,
        subjectId,
        isCorrect: true
      });

      const progress = mockSupabase.db.user_progress.find(
        p => p.user_id === TEST_USER_ID && p.topic_id === topicId
      );

      expect(progress?.attempts).toBe(2);
      expect(progress?.correct_answers).toBe(1);
      expect(progress?.mastery_level).toBe(50); // 1/2 * 100
    });

    it('calculates mastery correctly with mixed results', async () => {
      // Setup: 3 attempts, 1 correct (33% mastery)
      mockSupabase.db.user_progress.push({
        id: '99999999-9999-9999-9999-999999999999',
        user_id: TEST_USER_ID,
        topic_id: topicId,
        subject_id: subjectId,
        attempts: 3,
        correct_answers: 1,
        mastery_level: 33
      });

      await recordProgress({
        userId: TEST_USER_ID,
        topicId,
        subjectId,
        isCorrect: true
      });

      const progress = mockSupabase.db.user_progress.find(
        p => p.user_id === TEST_USER_ID && p.topic_id === topicId
      );

      expect(progress?.attempts).toBe(4);
      expect(progress?.correct_answers).toBe(2);
      expect(progress?.mastery_level).toBe(50); // 2/4 * 100
    });
  });

  describe('awardXP', () => {
    it('awards XP correctly and updates profile', async () => {
      await awardXP(TEST_USER_ID, 50);

      const profile = mockSupabase.db.profiles.find(p => p.id === TEST_USER_ID);
      expect(profile?.xp_total).toBe(50);
      expect(profile?.level).toBe(1); // floor(50/100) + 1
    });

    it('levels up correctly when crossing 100 XP threshold', async () => {
      // Setup: user has 90 XP
      const profile = mockSupabase.db.profiles.find(p => p.id === TEST_USER_ID);
      if (profile) profile.xp_total = 90;

      await awardXP(TEST_USER_ID, 20);

      const updatedProfile = mockSupabase.db.profiles.find(p => p.id === TEST_USER_ID);
      expect(updatedProfile?.xp_total).toBe(110);
      expect(updatedProfile?.level).toBe(2); // floor(110/100) + 1
    });

    it('levels up multiple times correctly', async () => {
      await awardXP(TEST_USER_ID, 250);

      const profile = mockSupabase.db.profiles.find(p => p.id === TEST_USER_ID);
      expect(profile?.xp_total).toBe(250);
      expect(profile?.level).toBe(3); // floor(250/100) + 1
    });
  });
});
