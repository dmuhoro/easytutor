/**
 * OFFLINE REASONING CACHE
 *
 * Caches reasoning results and remediation plans for offline adaptation.
 * Enables offline mastery-aware tutoring decisions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PortalType } from '../../types/canonical';

export interface CachedReasoning {
  canonical_id: string;
  portal_type: PortalType;
  reasoning_type: 'prerequisite' | 'remediation' | 'adaptation' | 'progression';
  result: unknown;
  context: {
    mastery_level: number;
    user_goal: string;
    active_path: string[];
  };
  cached_at: string;
  expires_at: string;
  hit_count: number;
}

export class OfflineReasoningCache {
  private readonly CACHE_PREFIX = 'offline_reasoning_cache';
  private readonly CACHE_DURATION = 5 * 24 * 60 * 60 * 1000; // 5 days

  async get(cacheKey: string): Promise<CachedReasoning | null> {
    try {
      const key = `${this.CACHE_PREFIX}:${cacheKey}`;
      const cached = await AsyncStorage.getItem(key);

      if (!cached) return null;

      const reasoning: CachedReasoning = JSON.parse(cached);

      // Check expiration
      if (new Date(reasoning.expires_at) < new Date()) {
        await this.remove(cacheKey);
        return null;
      }

      // Update hit count
      reasoning.hit_count += 1;
      await AsyncStorage.setItem(key, JSON.stringify(reasoning));

      return reasoning;
    } catch (error) {
      console.warn('Failed to get cached reasoning:', error);
      return null;
    }
  }

  async getReasoning(canonicalId: string): Promise<unknown> {
    const cacheKey = `reasoning:${canonicalId}`;
    const cached = await this.get(cacheKey);
    return cached?.result || null;
  }

  async store(cacheKey: string, reasoningData: unknown): Promise<void> {
    try {
      const reasoning = reasoningData as any;

      const cachedReasoning: CachedReasoning = {
        canonical_id: reasoning.canonical_id,
        portal_type: reasoning.portal_type,
        reasoning_type: reasoning.type || 'adaptation',
        result: reasoning,
        context: reasoning.context || {
          mastery_level: 0,
          user_goal: '',
          active_path: [],
        },
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.CACHE_DURATION).toISOString(),
        hit_count: 0,
      };

      const key = `${this.CACHE_PREFIX}:${cacheKey}`;
      await AsyncStorage.setItem(key, JSON.stringify(cachedReasoning));
    } catch (error) {
      console.warn('Failed to cache reasoning:', error);
    }
  }

  async remove(cacheKey: string): Promise<void> {
    try {
      const key = `${this.CACHE_PREFIX}:${cacheKey}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove cached reasoning:', error);
    }
  }

  async getContextualReasoning(
    canonicalId: string,
    masteryLevel: number,
    userGoal: string
  ): Promise<unknown> {
    const cacheKey = `reasoning:${canonicalId}`;
    const cached = await this.get(cacheKey);

    if (!cached) return null;

    // Check if context matches closely enough
    const masteryDiff = Math.abs(cached.context.mastery_level - masteryLevel);
    const goalMatch = cached.context.user_goal === userGoal;

    if (masteryDiff <= 15 && goalMatch) {
      return cached.result;
    }

    return null; // Context doesn't match well enough
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
    // No-op stub for compatibility
    return;
  }

  async clearExpired(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const reasoning: CachedReasoning = JSON.parse(cached);
          if (new Date(reasoning.expires_at) < new Date()) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clear expired reasoning cache:', error);
    }
  }
}