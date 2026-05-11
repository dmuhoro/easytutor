import { describe, expect, it } from 'vitest';
import { useProgressStore } from '../../store/progressStore';
import { testLog } from '../utils/flowLogger';
import { mockSupabase } from '../utils/mockSupabase';

describe('progress flow', () => {
  it('persists user_progress before awarding XP and local completion state', async () => {
    useProgressStore.setState({
      userId: mockSupabase.user.id,
      topicsStudied: {},
      xpTotal: 0,
      xpEvents: [],
      lastOpenedDate: new Date().toISOString().split('T')[0],
    });

    testLog('[TEST_FLOW]', 'progress:mark-topic-complete-success');
    await useProgressStore
      .getState()
      .markTopicDone('hs-math', '22222222-2222-4222-8222-222222222222', 'Linear Equations');

    expect(mockSupabase.db.user_progress).toContainEqual(
      expect.objectContaining({
        user_id: mockSupabase.user.id,
        subject_id: 'hs-math',
        topic_id: '22222222-2222-4222-8222-222222222222',
      }),
    );
    expect(useProgressStore.getState().xpTotal).toBe(10);
  });

  it('rolls back local topic completion and XP when user_progress persistence fails', async () => {
    useProgressStore.setState({
      userId: mockSupabase.user.id,
      topicsStudied: {},
      xpTotal: 0,
      xpEvents: [],
      lastOpenedDate: new Date().toISOString().split('T')[0],
    });
    mockSupabase.failNext('user_progress', 'upsert', 'user_progress write rejected');

    testLog('[TEST_FLOW]', 'progress:mark-topic-complete-db-failure');
    await expect(
      useProgressStore
        .getState()
        .markTopicDone('hs-math', '22222222-2222-4222-8222-222222222222', 'Linear Equations'),
    ).rejects.toThrow('user_progress write rejected');

    expect(useProgressStore.getState().xpTotal).toBe(0);
    expect(useProgressStore.getState().topicsStudied['hs-math'] ?? []).not.toContain('22222222-2222-4222-8222-222222222222');
  });
});
