/**
 * OFFLINE LESSON CACHE
 *
 * Caches lesson content for offline delivery.
 * Maintains canonical ID mapping and portal isolation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PortalType } from '../../types/canonical';

export interface CachedLesson {
  canonical_id: string;
  portal_type: PortalType;
  content: string;
  metadata: Record<string, unknown>;
  cached_at: string;
  expires_at: string;
}

export class OfflineLessonCache {
  private readonly CACHE_PREFIX = 'offline_lesson_cache';
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  async get(cacheKey: string): Promise<CachedLesson | null> {
    try {
      const key = `${this.CACHE_PREFIX}:${cacheKey}`;
      const cached = await AsyncStorage.getItem(key);

      if (!cached) return null;

      const lesson: CachedLesson = JSON.parse(cached);

      // Check expiration
      if (new Date(lesson.expires_at) < new Date()) {
        await this.remove(cacheKey);
        return null;
      }

      return lesson;
    } catch (error) {
      console.warn('Failed to get cached lesson:', error);
      return null;
    }
  }

  async getLesson(canonicalId: string): Promise<unknown> {
    const cacheKey = `lesson:${canonicalId}`;
    const cached = await this.get(cacheKey);
    return cached?.content || null;
  }

  async store(cacheKey: string, lessonData: unknown): Promise<void> {
    try {
      // Assume lessonData has the required fields
      const lesson = lessonData as any;

      const cachedLesson: CachedLesson = {
        canonical_id: lesson.canonical_id,
        portal_type: lesson.portal_type,
        content: lesson.content,
        metadata: lesson.metadata || {},
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.CACHE_DURATION).toISOString(),
      };

      const key = `${this.CACHE_PREFIX}:${cacheKey}`;
      await AsyncStorage.setItem(key, JSON.stringify(cachedLesson));
    } catch (error) {
      console.warn('Failed to cache lesson:', error);
    }
  }

  async remove(cacheKey: string): Promise<void> {
    try {
      const key = `${this.CACHE_PREFIX}:${cacheKey}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove cached lesson:', error);
    }
  }

  async clearExpired(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const lesson: CachedLesson = JSON.parse(cached);
          if (new Date(lesson.expires_at) < new Date()) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clear expired lessons:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(key => key.startsWith(this.CACHE_PREFIX)).length;
    } catch (error) {
      return 0;
    }
  }

  async prefetch(canonicalId: string): Promise<void> {
    // No-op stub for prefetch compatibility; real implementation would fetch and store
    return;
  }
}