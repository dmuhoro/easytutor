import { beforeEach, describe, expect, it } from 'vitest';
import { processSyncQueue } from '../../services/syncEngine';
import { useSyncQueueStore } from '../../store/syncQueueStore';
import { testLogs, testLog } from '../utils/flowLogger';
import { mockSupabase } from '../utils/mockSupabase';

describe('sync flow', () => {
  beforeEach(() => {
    useSyncQueueStore.getState().clear();
  });

  it('replays valid offline progress queue items into user_progress', async () => {
    testLog('[TEST_FLOW]', 'sync:valid-progress-replay');

    useSyncQueueStore.getState().add({
      type: 'progress_update',
      payload: {
        userId: mockSupabase.user.id,
        subjectId: 'hs-math',
        topicId: '22222222-2222-4222-8222-222222222222',
        topicName: 'Linear Equations',
      },
    });
    await processSyncQueue();

    expect(
      mockSupabase.db.user_progress.some(
        (row) =>
          row.user_id === mockSupabase.user.id &&
          row.subject_id === 'hs-math' &&
          row.topic_id === '22222222-2222-4222-8222-222222222222',
      ),
    ).toBe(true);
  });

  it('rejects invalid quiz payloads before attempting DB writes', async () => {
    testLog('[TEST_FLOW]', 'sync:invalid-quiz-payload');

    useSyncQueueStore.getState().add({
      type: 'quiz_result',
      payload: {
        user_id: mockSupabase.user.id,
        subject_id: 'hs-math',
        topic_id: '99999999-9999-4999-8999-999999999999',
        userId: mockSupabase.user.id,
        subjectId: 'hs-math',
        topicId: '99999999-9999-4999-8999-999999999999',
        score: 7,
        total: 10,
      },
    });
    await processSyncQueue();

    const quizWriteAttempts = testLogs.filter(
      (entry) => entry.tag === '[TEST_DB_WRITE]' && entry.message === 'insert:quiz_sessions',
    );
    const failed = useSyncQueueStore.getState().items.find((item) => item.type === 'quiz_result');

    expect(quizWriteAttempts).toHaveLength(1);
    expect(failed?.status).toBe('failed');
    expect(failed?.retries).toBe(1);
    expect(mockSupabase.db.quiz_sessions).toHaveLength(0);
  });
});
