import { describe, expect, it } from 'vitest';
import { resolveTopicId } from '../../lib/resolveTopicId';
import { testLog } from '../utils/flowLogger';
import { mockSupabase } from '../utils/mockSupabase';

describe('learning flow', () => {
  it('selects a DB-backed subject and resolves the selected topic to a UUID', async () => {
    testLog('[TEST_FLOW]', 'learning:select-subject-topic', {
      subjectId: 'hs-math',
      topicName: 'Linear Equations',
    });

    const subject = mockSupabase.db.subjects.find((row) => row.id === 'hs-math');
    const topicId = await resolveTopicId('Linear Equations', 'hs-math');

    expect(subject).toBeTruthy();
    expect(topicId).toBe('22222222-2222-4222-8222-222222222222');
  });

  it('fails production contract for unknown subject/topic ids that are not present in DB', async () => {
    testLog('[TEST_FLOW]', 'learning:unknown-id-contract-check', {
      subjectId: 'unknown-subject',
      topicName: 'Unknown Topic',
    });

    const topicId = await resolveTopicId('Unknown Topic', 'unknown-subject');
    expect(topicId).toBeNull();
  });

  it('resolves when already a UUID', async () => {
    const uuid = '22222222-2222-4222-8222-222222222222';
    const resolved = await resolveTopicId(uuid, 'hs-math');
    expect(resolved).toBe(uuid);
  });
});
