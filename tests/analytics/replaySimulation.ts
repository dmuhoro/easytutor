import AsyncStorage from '@react-native-async-storage/async-storage';
import { flushAnalyticsQueue, track } from '../../lib/analytics';

export async function seedOfflineBurst(count: number, baseEvent = 'session_started') {
  for (let i = 0; i < count; i++) {
    track(baseEvent as any, { user_id: 'u1', learning_mode: 'high_school', sequence: i });
  }
  await new Promise((r) => setTimeout(r, 10));
}

export async function simulateDelayedFlush(delayMs = 100) {
  await new Promise((r) => setTimeout(r, delayMs));
  await flushAnalyticsQueue();
}

export async function getQueuedAnalytics() {
  const raw = await AsyncStorage.getItem('analytics_queue');
  return raw ? JSON.parse(raw) : [];
}

