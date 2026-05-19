import { beforeEach, vi } from 'vitest';
import { clearTestLogs } from './utils/flowLogger';
import { mockSupabase } from './utils/mockSupabase';

// ─── React Native device-info mock ───────────────────────────────────────────
// deviceProfiler.ts uses require() which bypasses vitest alias resolution.
// This vi.mock intercepts both ESM and CJS imports at module-registry level.
vi.mock('react-native-device-info', () => ({
  default: {
    getTotalMemory: async () => 4 * 1024 * 1024 * 1024,
    getFreeDiskStorage: async () => 10 * 1024 * 1024 * 1024,
    getTotalDiskStorage: async () => 32 * 1024 * 1024 * 1024,
    getBatteryLevel: async () => 0.8,
    isBatteryCharging: async () => true,
    getProcessorCount: async () => 4,
  },
  getTotalMemory: async () => 4 * 1024 * 1024 * 1024,
  getFreeDiskStorage: async () => 10 * 1024 * 1024 * 1024,
  getTotalDiskStorage: async () => 32 * 1024 * 1024 * 1024,
  getBatteryLevel: async () => 0.8,
  isBatteryCharging: async () => true,
  getProcessorCount: async () => 4,
}));

process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  'eyJyb2xlIjoiYW5vbiIsImlzcyI6InRlc3QifQ',
  'fake-signature-that-is-long-enough-for-local-test-validation-only',
].join('.');

Object.defineProperty(globalThis, '__DEV__', {
  value: true,
  writable: true,
});

const storage = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      storage.delete(key);
    }),
    clear: vi.fn(async () => {
      storage.clear();
    }),
  },
}));

vi.mock('react-native-url-polyfill/auto', () => ({}));

(globalThis as any).__MOCK_SUPABASE_CLIENT__ = mockSupabase.client;

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase.client,
  isSupabaseAvailable: () => true,
  supabaseInitStatus: { available: true, urlExists: true, keyExists: true, urlValid: true, keyValid: true },
  getSupabaseInitError: () => undefined,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase.client),
}));

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      hostUri: '192.168.1.100:8081',
    },
  },
}));

beforeEach(() => {
  storage.clear();
  clearTestLogs();
  mockSupabase.reset();
});
