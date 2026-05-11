import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncQueueItemType = 'progress_update' | 'quiz_result';
export type SyncQueueItemStatus = 'pending' | 'synced' | 'failed';

export type SyncQueueItem = {
  id: string;
  type: SyncQueueItemType;
  fingerprint: string;
  payload: any;
  status: SyncQueueItemStatus;
  retries: number;
  lastError?: string;
  nextAttemptAt?: string;
  createdAt: string;
  updatedAt: string;
};

type SyncQueueState = {
  items: SyncQueueItem[];
  add: (item: Omit<SyncQueueItem, 'id' | 'status' | 'retries' | 'createdAt' | 'updatedAt' | 'fingerprint'>) => SyncQueueItem;
  setNextAttempt: (id: string, nextAttemptAt: string) => void;
  markSynced: (id: string) => void;
  markFailed: (id: string, err: unknown) => void;
  prune: () => void;
  clear: () => void;
};

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function asMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return typeof err === 'string' ? err : JSON.stringify(err);
}

function stableStringify(obj: any): string {
  if (obj === null || obj === undefined) return String(obj);
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

function hashDjb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function computeFingerprint(type: SyncQueueItemType, payload: any): string {
  return `${type}:${hashDjb2(stableStringify(payload))}`;
}

export const useSyncQueueStore = create<SyncQueueState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const now = new Date().toISOString();
        const fingerprint = computeFingerprint(item.type, item.payload);

        // Dedup: if same fingerprint exists and is not synced, refresh it instead of adding.
        const existing = get().items.find((it) => it.fingerprint === fingerprint && it.status !== 'synced');
        if (existing) {
          const updated = {
            ...existing,
            payload: item.payload,
            status: 'pending' as const,
            updatedAt: now,
          };
          set({ items: get().items.map((it) => (it.id === existing.id ? updated : it)) });
          return updated;
        }

        const queued: SyncQueueItem = {
          id: makeId(),
          type: item.type,
          fingerprint,
          payload: item.payload,
          status: 'pending',
          retries: 0,
          createdAt: now,
          updatedAt: now,
        };
        set({ items: [...get().items, queued] });
        return queued;
      },
      setNextAttempt: (id, nextAttemptAt) => {
        const now = new Date().toISOString();
        set({
          items: get().items.map((it) => (it.id === id ? { ...it, nextAttemptAt, updatedAt: now } : it)),
        });
      },
      markSynced: (id) => {
        const now = new Date().toISOString();
        set({
          items: get().items.map((it) => (it.id === id ? { ...it, status: 'synced', updatedAt: now } : it)),
        });
      },
      markFailed: (id, err) => {
        const now = new Date().toISOString();
        const msg = asMessage(err);
        set({
          items: get().items.map((it) =>
            it.id === id
              ? { ...it, status: 'failed', retries: it.retries + 1, lastError: msg, updatedAt: now }
              : it
          ),
        });
      },
      prune: () => {
        const items = get().items;
        const keepSynced = 50;
        const synced = items.filter((i) => i.status === 'synced').slice(-keepSynced);
        const pendingAndFailed = items.filter((i) => i.status !== 'synced');
        set({ items: [...pendingAndFailed, ...synced] });
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: 'easytutor-sync-queue-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

