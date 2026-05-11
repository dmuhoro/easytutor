import { logEvent } from '../lib/logEvent';
import { useSyncQueueStore, SyncQueueItem } from '../store/syncQueueStore';
import { assertRequiredWriteFields, getAuthenticatedUser, getSupabaseClient, isUuid, logSupabaseError } from '../lib/supabaseOps';
import { resolveTopicIdOrThrow } from '../lib/resolveTopicId';


const MAX_RETRIES = 5;
let isProcessing = false;

/**
 * Add item to sync queue (fire-and-forget)
 */
export function addToSyncQueue(type: SyncQueueItem['type'], payload: any): string {
  const item = useSyncQueueStore.getState().add({ type, payload });
  void logEvent('SYNC', 'queued', { type, id: item.id, fingerprint: item.fingerprint });
  // Fire-and-forget processing - never blocks UI
  void processSyncQueue();
  return item.id;
}

function nowMs(): number {
  return Date.now();
}

function computeBackoffMs(retries: number): number {
  // Exponential backoff with cap (and small jitter)
  const base = 1000 * Math.pow(2, Math.min(8, retries)); // up to ~256s
  const jitter = Math.floor(Math.random() * 300);
  return Math.min(5 * 60 * 1000, base + jitter); // cap 5m
}

function isDue(item: SyncQueueItem): boolean {
  if (!item.nextAttemptAt) return true;
  return new Date(item.nextAttemptAt).getTime() <= nowMs();
}

/**
 * Check if item has exceeded max retries
 */
function isMaxRetriesExceeded(item: SyncQueueItem): boolean {
  return item.retries >= MAX_RETRIES;
}

async function syncBatchProgress(items: SyncQueueItem[]): Promise<void> {
  const client = getSupabaseClient();
  const user = await getAuthenticatedUser();

  const rows = await Promise.all(items.map(async (it) => {
    const p = it.payload as {
      userId: string;
      topicId: string;
      topicName?: string;
      subjectId: string;
      score?: number;
      lastSeen?: string;
    };
    const topicId = await resolveTopicIdOrThrow(p.topicId || p.topicName, p.subjectId);

    const row = {
      user_id: user.id,
      topic_id: topicId,
      subject_id: p.subjectId,
      completed_at: p.lastSeen ?? new Date().toISOString(),
    };
    assertRequiredWriteFields(row);
    return row;
  }));

  // RLS: requires policy allowing user to upsert their own `user_progress` rows.
  const { error } = await client.from('user_progress').upsert(rows, { onConflict: 'user_id,topic_id' });
  if (error) {
    logSupabaseError('user_progress', 'upsert', error);
    throw error;
  }
}

async function syncBatchQuiz(items: SyncQueueItem[]): Promise<void> {
  const client = getSupabaseClient();
  const user = await getAuthenticatedUser();

  const rows = await Promise.all(items.map(async (it) => {
    const p = it.payload as {
      userId: string;
      subjectId?: string | null;
      topicId?: string | null;
      score: number;
      total: number;
      date?: string;
    };
    if (!p.userId) {
      throw new Error('user_id is required for quiz_sessions sync');
    }
    const topicId = await resolveTopicIdOrThrow(p.topicId, p.subjectId);

    const row = {
      user_id: user.id,
      subject_id: p.subjectId,
      topic_id: topicId,
      score: p.score,
      total: p.total,
      date: p.date ?? new Date().toISOString(),
    };
    assertRequiredWriteFields(row);
    return row;
  }));

  // RLS: requires policy allowing user to insert their own `quiz_sessions`.
  const { error } = await client.from('quiz_sessions').insert(rows);
  if (error) {
    logSupabaseError('quiz_sessions', 'insert', error);
    throw error;
  }
}

/**
 * Process sync queue - fire-and-forget, never blocks UI
 */
export async function processSyncQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const { items, markSynced, markFailed, prune, setNextAttempt } = useSyncQueueStore.getState();

    // Filter candidates: not synced, not exceeded max retries, and due for retry
    const candidates = items.filter((i) => {
      if (i.status === 'synced') return false;
      if (isMaxRetriesExceeded(i)) {
        // Skip permanently if max retries exceeded
        return false;
      }
      if (!isDue(i)) return false;
      return true;
    });

    if (candidates.length === 0) {
      isProcessing = false;
      return;
    }

    void logEvent('SYNC', 'process_start', { count: candidates.length });

    // Batch by type
    const byType: Record<string, SyncQueueItem[]> = {};
    for (const item of candidates) {
      byType[item.type] = byType[item.type] ? [...byType[item.type], item] : [item];
    }

    // Process all batches in parallel but catch individual batch failures
    const batchPromises = Object.entries(byType).map(async ([type, batchItems]) => {
      try {
        if (type === 'progress_update') {
          await syncBatchProgress(batchItems);
        } else if (type === 'quiz_result') {
          await syncBatchQuiz(batchItems);
        }
        
        batchItems.forEach((it) => markSynced(it.id));
        void logEvent('SYNC', 'batch_success', { type, count: batchItems.length });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        batchItems.forEach((it) => {
          markFailed(it.id, errMsg);
          const nextAttempt = new Date(nowMs() + computeBackoffMs(it.retries + 1)).toISOString();
          setNextAttempt(it.id, nextAttempt);
        });
        void logEvent('SYNC', 'batch_failed', { type, count: batchItems.length, err: errMsg });
      }
    });

    await Promise.all(batchPromises);
    
    prune();
    void logEvent('SYNC', 'process_done', { processed: candidates.length });
  } catch (err) {
    // Catch-all: never let sync errors crash the app
    void logEvent('ERROR', 'processSyncQueue_failed', { err: err instanceof Error ? err.message : String(err) });
  } finally {
    isProcessing = false;
  }
}

/**
 * Retry failed syncs - called when network becomes available
 */
export async function retryFailedSyncs(): Promise<void> {
  const { items } = useSyncQueueStore.getState();
  const anyRetryable = items.some((i) => i.status === 'failed' && !isMaxRetriesExceeded(i));
  if (!anyRetryable) return;
  await processSyncQueue();
}
