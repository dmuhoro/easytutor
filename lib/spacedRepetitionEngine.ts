// lib/spacedRepetitionEngine.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { logSupabaseError } from './supabaseOps';
/**
 * Spaced Repetition Engine
 *
 * Tracks retention metrics at Subject, Topic, and Subtopic levels.
 * Provides utilities for scheduling reviews, calculating retention scores,
 * forgetting risk, and fetching due/at‑risk knowledge items.
 */

export type KnowledgeLevel = 'subject' | 'topic' | 'subtopic';

export interface RetentionProfile {
  /** Unique identifier for the knowledge item (subject / topic / subtopic) */
  id: string;
  /** Level of the knowledge item */
  level: KnowledgeLevel;
  /** Parent identifiers for hierarchical lookup */
  subjectId?: string;
  topicId?: string;
  subtopicId?: string;
  /** Timestamp of the last review (ISO string) */
  lastReviewedAt: string;
  /** How many times the item has been reviewed */
  reviewCount: number;
  /** Retention score 0‑100 (higher = better) */
  retentionScore: number;
  /** Derived risk of forgetting (0‑100, higher = riskier) */
  forgettingRisk: number;
  /** Next scheduled review date (ISO string) */
  nextReviewDate: string;
  /** Review stage index (1‑7) */
  reviewStage: number;
}

/** Review stage intervals in days */
export const REVIEW_STAGES_DAYS = [0, 1, 3, 7, 14, 30, 60];

/**
 * Compute the next review date based on the current stage.
 * Stage 1 = same day (0 days), Stage 2 = +1 day, … Stage 7 = +60 days.
 */
export function scheduleReview(currentStage: number, fromDate: Date = new Date()): Date {
  const stageIndex = Math.max(1, Math.min(currentStage, REVIEW_STAGES_DAYS.length));
  const daysToAdd = REVIEW_STAGES_DAYS[stageIndex - 1];
  const next = new Date(fromDate);
  next.setDate(next.getDate() + daysToAdd);
  return next;
}

/**
 * Exponential decay retention calculation.
 * Simple model: retentionScore = 100 * e^( -λ * daysSinceLast )
 * where λ is derived from reviewCount (more reviews => slower decay).
 */
export function calculateRetention(
  lastReviewedAt: Date,
  reviewCount: number,
  now: Date = new Date()
): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSince = Math.max(0, (now.getTime() - lastReviewedAt.getTime()) / msPerDay);
  const lambda = 0.05 / Math.max(1, reviewCount); // more reviews reduces decay rate
  const retention = 100 * Math.exp(-lambda * daysSince);
  return Math.round(Math.max(0, Math.min(100, retention)));
}

/**
 * Forgetting risk is inversely related to retention and proportional to time until next review.
 */
export function calculateForgettingRisk(
  retentionScore: number,
  daysUntilNext: number
): number {
  // Higher retention reduces risk, longer wait increases risk.
  const risk = (100 - retentionScore) + daysUntilNext * 0.5;
  return Math.round(Math.max(0, Math.min(100, risk)));
}

/**
 * Retrieve all knowledge items whose nextReviewDate is today or earlier.
 * This function expects a storage helper (AsyncStorage or Supabase) to be injected.
 */
export async function getDueReviews(
  fetchAll: () => Promise<RetentionProfile[]>
): Promise<RetentionProfile[]> {
  const now = new Date();
  const all = await fetchAll();
  return all.filter((p) => new Date(p.nextReviewDate) <= now);
}

/**
 * Retrieve items with a forgettingRisk above a threshold (default 70).
 */
export async function getAtRiskKnowledge(
  fetchAll: () => Promise<RetentionProfile[]>,
  threshold = 70
): Promise<RetentionProfile[]> {
  const all = await fetchAll();
  return all.filter((p) => p.forgettingRisk >= threshold);
}

/**
 * Helper to update a profile after a review has occurred.
 * It increments reviewCount, updates timestamps, recalculates scores, and
 * advances the review stage (capped at stage 7).
 */
export async function recordReview(
  profile: RetentionProfile,
  save: (p: RetentionProfile) => Promise<void>
): Promise<RetentionProfile> {
  const now = new Date();
  const newStage = Math.min(profile.reviewStage + 1, REVIEW_STAGES_DAYS.length);
  const nextDate = scheduleReview(newStage, now);
  const retention = calculateRetention(now, profile.reviewCount + 1);
  const daysUntilNext = Math.round((nextDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  const forgettingRisk = calculateForgettingRisk(retention, daysUntilNext);

  const updated: RetentionProfile = {
    ...profile,
    lastReviewedAt: now.toISOString(),
    reviewCount: profile.reviewCount + 1,
    reviewStage: newStage,
    nextReviewDate: nextDate.toISOString(),
    retentionScore: retention,
    forgettingRisk,
  };
  await save(updated);
  return updated;
}

/**
 * Integration hooks – can be called from other engines (mastery, confidence, etc.)
 */
export async function integrateWithMastery(
  profile: RetentionProfile,
  getMastery: (id: string) => Promise<number>
): Promise<void> {
  const mastery = await getMastery(profile.id);
  // Example: if mastery drops below 70, reset review stage to 1 to reinforce.
  if (mastery < 70 && profile.reviewStage > 1) {
    profile.reviewStage = 1;
    profile.nextReviewDate = scheduleReview(1).toISOString();
  }
}

// Export type for external persistence layers.
export type RetentionProfileStore = {
  fetchAll: () => Promise<RetentionProfile[]>;
  save: (p: RetentionProfile) => Promise<void>;
};

// ---------- Store Implementation ----------

const RETENTION_CACHE_PREFIX = 'retention_profile_cache_v1';

/**
 * Returns a RetentionProfileStore for the given user.
 * It reads/writes from AsyncStorage first, then syncs with Supabase.
 */
export const getRetentionStore = (userId: string | undefined): RetentionProfileStore => ({
  fetchAll: async () => {
    const prefix = `${RETENTION_CACHE_PREFIX}:${userId ?? 'anon'}:`;
    try {
      const keys = await AsyncStorage.getAllKeys();
      const profileKeys = keys.filter((k) => k.startsWith(prefix));
      const records = await Promise.all(profileKeys.map((k) => AsyncStorage.getItem(k)));
      const local = records
        .map((r) => (r ? (JSON.parse(r) as RetentionProfile) : null))
        .filter((p): p is RetentionProfile => p !== null);
      if (local.length > 0) return local;
    } catch {
      // Continue to Supabase fallback.
    }
    if (!userId) return [];
    try {
if (!supabase) { return []; }
      const { data, error } = await supabase
        .from('learning_retention_profiles')
        .select('*')
        .eq('user_id', userId);
      if (error) {
        logSupabaseError('learning_retention_profiles', 'select', error);
        return [];
      }
      const dbProfiles = (data ?? []) as RetentionProfile[];
      // Cache locally for future fast reads.
      for (const p of dbProfiles) {
        const key = `${RETENTION_CACHE_PREFIX}:${userId}:${p.id}`;
        await AsyncStorage.setItem(key, JSON.stringify(p));
      }
      return dbProfiles;
    } catch {
      return [];
    }
  },
  save: async (profile) => {
    const key = `${RETENTION_CACHE_PREFIX}:${userId ?? 'anon'}:${profile.id}`;
    try {
      await AsyncStorage.setItem(key, JSON.stringify(profile));
    } catch {
      // ignore local storage errors
    }
    if (!userId) return;
    try {
if (!supabase) { return; }
      const { error } = await supabase
        .from('learning_retention_profiles')
        .upsert(profile as any, { onConflict: 'id' });
      if (error) {
        logSupabaseError('learning_retention_profiles', 'upsert', error);
      }
    } catch {
      // ignore remote errors
    }
  },
});

// ---------- End of Store Implementation ----------
