/**
 * OFFLINE QUIZ CACHE
 *
 * Caches quiz questions and answers for offline execution.
 * Maintains mastery-aware question selection.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PortalType } from '../../types/canonical';

export interface CachedQuiz {
  canonical_id: string;
  portal_type: PortalType;
  questions: any[];
  mastery_level: number;
  cached_at: string;
  expires_at: string;
}

export class OfflineQuizCache {
  private readonly CACHE_PREFIX = 'offline_quiz_cache';
  private readonly CACHE_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days

  async get(cacheKey: string): Promise<CachedQuiz | null> {
    try {
      const key = `${this.CACHE_PREFIX}:${cacheKey}`;
      const cached = await AsyncStorage.getItem(key);

      if (!cached) return null;

      const quiz: CachedQuiz = JSON.parse(cached);

      // Check expiration
      if (new Date(quiz.expires_at) < new Date()) {
        await this.remove(cacheKey);
        return null;
      }

      return quiz;
    } catch (error) {
      console.warn('Failed to get cached quiz:', error);
      return null;
    }
  }

  async getQuiz(canonicalId: string): Promise<any[] | null> {
    const cacheKey = `quiz:${canonicalId}`;
    const cached = await this.get(cacheKey);
    return cached?.questions || null;
  }

  async store(cacheKey: string, quizData: unknown): Promise<void> {
    try {
      const quiz = quizData as any;

      const cachedQuiz: CachedQuiz = {
        canonical_id: quiz.canonical_id,
        portal_type: quiz.portal_type,
        questions: quiz.questions,
        mastery_level: quiz.mastery_level || 0,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.CACHE_DURATION).toISOString(),
      };

      const key = `${this.CACHE_PREFIX}:${cacheKey}`;
      await AsyncStorage.setItem(key, JSON.stringify(cachedQuiz));
    } catch (error) {
      console.warn('Failed to cache quiz:', error);
    }
  }

  async remove(cacheKey: string): Promise<void> {
    try {
      const key = `${this.CACHE_PREFIX}:${cacheKey}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove cached quiz:', error);
    }
  }

  async getMasteryAppropriateQuiz(canonicalId: string, masteryLevel: number): Promise<any[] | null> {
    const cacheKey = `quiz:${canonicalId}`;
    const cached = await this.get(cacheKey);

    if (!cached) return null;

    // Filter questions appropriate for mastery level
    const appropriateQuestions = cached.questions.filter((q: any) => {
      const questionLevel = q.mastery_level || 0;
      return Math.abs(questionLevel - masteryLevel) <= 20; // Within 20 points
    });

    return appropriateQuestions.length > 0 ? appropriateQuestions : cached.questions;
  }

  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(key => key.startsWith(this.CACHE_PREFIX)).length;
    } catch (err) {
      return 0;
    }
  }

  async prefetch(canonicalId: string): Promise<void> {
    // No-op stub for prefetch compatibility
    return;
  }

  async clearExpired(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const quiz: CachedQuiz = JSON.parse(cached);
          if (new Date(quiz.expires_at) < new Date()) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clear expired quizzes:', error);
    }
  }
}