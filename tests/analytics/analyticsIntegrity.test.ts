import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const insertSpy = vi.fn();

vi.mock('../../lib/supabaseOps', () => ({
  getSupabaseClient: () => ({
    from: () => ({
      insert: insertSpy,
    }),
  }),
  getAuthenticatedUser: async () => ({ id: '11111111-1111-4111-8111-111111111111' }),
  logSupabaseError: vi.fn(),
}));

import { flushAnalyticsQueue, track } from '../../lib/analytics';
import { getQueuedAnalytics, seedOfflineBurst, simulateDelayedFlush } from './replaySimulation';

const QUEUE_KEY = 'analytics_queue';

async function readQueue() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

describe('analytics integrity queue', () => {
  beforeEach(async () => {
    insertSpy.mockReset();
    await AsyncStorage.clear();
  });

  it('queues events with event_id and created_at when insert fails', async () => {
    insertSpy.mockResolvedValue({ error: new Error('network down') });
    track('session_started', { user_id: 'u1', learning_mode: 'high_school' });
    await new Promise((r) => setTimeout(r, 0));

    const queued = await readQueue();
    expect(queued).toHaveLength(1);
    expect(typeof queued[0].event_id).toBe('string');
    expect(queued[0].event_id.length).toBeGreaterThan(0);
    expect(typeof queued[0].created_at).toBe('string');
    expect(queued[0].event).toBe('session_started');
  });

  it('flush preserves only failed events on partial failure', async () => {
    const queueSeed = [
      {
        event_id: 'a3e7cba8-1be8-4978-8ce6-7688e88e3b61',
        created_at: '2026-05-27T01:00:00.000Z',
        event: 'session_started',
        payload: { user_id: 'u1', learning_mode: 'high_school' },
      },
      {
        event_id: '4bbde463-f53c-4b61-9119-5cbc4ff5f67d',
        created_at: '2026-05-27T01:01:00.000Z',
        event: 'roadmap_generated',
        payload: { user_id: 'u1', learning_mode: 'high_school', duration_ms: 1000 },
      },
    ];

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queueSeed));
    insertSpy
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: new Error('temporary outage') });

    await flushAnalyticsQueue();

    const queued = await readQueue();
    expect(queued).toHaveLength(1);
    expect(queued[0].event_id).toBe('4bbde463-f53c-4b61-9119-5cbc4ff5f67d');
  });

  it('deduplicates same event_id during flush', async () => {
    const duplicate = {
      event_id: '0fc5bb3d-e9ee-4b06-bce8-bcb54795a241',
      created_at: '2026-05-27T02:00:00.000Z',
      event: 'quiz_completed',
      payload: { user_id: 'u1', learning_mode: 'high_school', score: 8, total_questions: 10 },
    };

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([duplicate, duplicate]));
    insertSpy.mockResolvedValue({ error: null });

    await flushAnalyticsQueue();

    expect(insertSpy).toHaveBeenCalledTimes(1);
    const queued = await readQueue();
    expect(queued).toHaveLength(0);
  });

  it('enforces queue cap at 100 and drops oldest first', async () => {
    insertSpy.mockResolvedValue({ error: new Error('offline') });

    for (let i = 0; i < 120; i++) {
      track('session_started', { user_id: 'u1', learning_mode: 'high_school', sequence: i });
    }
    await new Promise((r) => setTimeout(r, 10));

    const queued = await readQueue();
    expect(queued).toHaveLength(100);
    expect(queued[0].payload.sequence).toBe(20);
    expect(queued[99].payload.sequence).toBe(119);
  });

  it('preserves replay ordering for failed events', async () => {
    const queueSeed = [
      {
        event_id: '11111111-1111-4111-8111-111111111111',
        created_at: '2026-05-27T01:00:00.000Z',
        event: 'session_started',
        payload: { user_id: 'u1', learning_mode: 'high_school', sequence: 1 },
      },
      {
        event_id: '22222222-2222-4222-8222-222222222222',
        created_at: '2026-05-27T01:00:01.000Z',
        event: 'quiz_started',
        payload: { user_id: 'u1', learning_mode: 'high_school', sequence: 2 },
      },
    ];

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queueSeed));
    insertSpy.mockResolvedValue({ error: new Error('still offline') });

    await flushAnalyticsQueue();
    const queued = await readQueue();
    expect(queued).toHaveLength(2);
    expect(queued[0].payload.sequence).toBe(1);
    expect(queued[1].payload.sequence).toBe(2);
  });

  it('flush is idempotent when invoked repeatedly on empty queue', async () => {
    insertSpy.mockResolvedValue({ error: null });
    await flushAnalyticsQueue();
    await flushAnalyticsQueue();
    await flushAnalyticsQueue();

    const queued = await readQueue();
    expect(queued).toHaveLength(0);
    expect(insertSpy).toHaveBeenCalledTimes(0);
  });

  it('survives replay storm simulation with bounded queue and delayed flush', async () => {
    insertSpy.mockResolvedValue({ error: new Error('offline storm') });
    await seedOfflineBurst(300, 'quiz_started');
    const queuedBefore = await getQueuedAnalytics();
    expect(queuedBefore.length).toBe(100);

    insertSpy.mockResolvedValue({ error: null });
    await simulateDelayedFlush(5);
    const queuedAfter = await getQueuedAnalytics();
    expect(queuedAfter.length).toBe(0);
  });
});
