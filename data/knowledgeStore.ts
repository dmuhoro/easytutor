/**
 * Local Storage Layer for Offline-First Knowledge System
 * Handles caching, sync, and progress tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { kcseSubjects, KCSESubject, KCSETopic } from './kcseSubjects';
import { logEvent, logError } from '../lib/logEvent';
import { addToSyncQueue, processSyncQueue } from '../services/syncEngine';

// Storage keys
const STORAGE_KEYS = {
  SUBJECTS: 'knowledge_subjects',
  PROGRESS: 'user_progress',
  LAST_SYNC: 'last_sync_timestamp',
  SYNC_QUEUE: 'sync_queue',
  WEAK_TOPICS: 'weak_topics',
  STRONG_TOPICS: 'strong_topics',
  RECOMMENDATIONS: 'recommendations',
  USER_PREFERENCES: 'user_preferences'
} as const;

// Types for progress tracking
export interface TopicProgress {
  topicId: string;
  subjectId: string;
  attempts: number;
  lastSeen: string;
  score?: number;
  mastered: boolean;
}

export interface UserKnowledgeState {
  progress: Record<string, TopicProgress>;
  weakTopics: string[];
  strongTopics: string[];
  lastUpdated: string;
}

/**
 * Save data to local storage
 */
export const saveLocalData = async <T>(key: string, value: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    console.log(`[LOCAL] Saved: ${key}`);
  } catch (error) {
    logError('Error_saving_${key}:', error);
  }
};

/**
 * Get data from local storage
 */
export const getLocalData = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logError('Error_reading_${key}:', error);
    return null;
  }
};

/**
 * Remove data from local storage
 */
export const removeLocalData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`[LOCAL] Removed: ${key}`);
  } catch (error) {
    logError('Error_removing_${key}:', error);
  }
};

/**
 * Initialize knowledge base on first launch
 */
export const initializeKnowledge = async (): Promise<void> => {
  try {
    const existing = await getLocalData<KCSESubject[]>(STORAGE_KEYS.SUBJECTS);

    if (!existing || existing.length === 0) {
      await saveLocalData(STORAGE_KEYS.SUBJECTS, kcseSubjects);
      console.log('[INIT] KCSE subjects seeded locally');
    } else {
      console.log(`[INIT] Subjects already exist: ${existing.length} subjects`);
    }

    // Initialize progress if not exists
    const progress = await getLocalData<Record<string, TopicProgress>>(STORAGE_KEYS.PROGRESS);
    if (!progress) {
      await saveLocalData(STORAGE_KEYS.PROGRESS, {});
      console.log('[INIT] Progress storage initialized');
    }

    // Record initialization time
    await saveLocalData(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    logError('INIT_Failed_to_initialize_knowledge:', error);
  }
};

/**
 * Get subjects from local storage (offline-first)
 */
export const getLocalSubjects = async (): Promise<KCSESubject[]> => {
  const subjects = await getLocalData<KCSESubject[]>(STORAGE_KEYS.SUBJECTS);
  return subjects || kcseSubjects; // Fallback to embedded data
};

/**
 * Get topics for a specific subject
 */
export const getLocalTopics = async (subjectId: string): Promise<KCSETopic[]> => {
  const subjects = await getLocalSubjects();
  const subject = subjects.find(s => s.id === subjectId);
  return subject?.topics || [];
};

/**
 * Update progress for a topic (local-first)
 */
export const updateTopicProgress = async (
  userId: string,
  topicId: string,
  subjectId: string,
  score?: number
): Promise<void> => {
  try {
    // Get existing progress
    const progress = await getLocalData<Record<string, TopicProgress>>(STORAGE_KEYS.PROGRESS) || {};
    
    const existing = progress[topicId] || {
      topicId,
      subjectId,
      attempts: 0,
      lastSeen: new Date().toISOString(),
      mastered: false
    };

    // Update progress
    const updated: TopicProgress = {
      ...existing,
      attempts: existing.attempts + 1,
      lastSeen: new Date().toISOString(),
      score: score !== undefined ? score : existing.score,
      // Consider mastered if attempted 3+ times with good score
      mastered: (existing.attempts + 1) >= 3 && (score !== undefined ? score >= 80 : existing.mastered)
    };

    progress[topicId] = updated;
    await saveLocalData(STORAGE_KEYS.PROGRESS, progress);

    // Analyze and update weak/strong topics
    await analyzeProgress(progress);

    // Queue remote sync (non-blocking)
    queueRemoteSync(userId, topicId, subjectId, score);

    console.log(`[PROGRESS] Updated: ${topicId} (attempts: ${updated.attempts})`);
  } catch (error) {
    logError('PROGRESS_Error_updating_topic_progress:', error);
  }
};

/**
 * Analyze progress to identify weak and strong topics
 */
export const analyzeProgress = async (
  progress?: Record<string, TopicProgress>
): Promise<{ weak: string[]; strong: string[] }> => {
  try {
    const data = progress || await getLocalData<Record<string, TopicProgress>>(STORAGE_KEYS.PROGRESS) || {};
    
    const weak: string[] = [];
    const strong: string[] = [];

    Object.entries(data).forEach(([topicId, topicData]) => {
      if (topicData.attempts < 2 || (topicData.score !== undefined && topicData.score < 50)) {
        weak.push(topicId);
      } else if (topicData.mastered || (topicData.score !== undefined && topicData.score >= 80)) {
        strong.push(topicId);
      }
    });

    await saveLocalData(STORAGE_KEYS.WEAK_TOPICS, weak);
    await saveLocalData(STORAGE_KEYS.STRONG_TOPICS, strong);

    console.log(`[ANALYSIS] Weak: ${weak.length}, Strong: ${strong.length}`);
    return { weak, strong };
  } catch (error) {
    logError('ANALYSIS_Error_analyzing_progress:', error);
    return { weak: [], strong: [] };
  }
};

/**
 * Get weak topics
 */
export const getWeakTopics = async (): Promise<string[]> => {
  return await getLocalData<string[]>(STORAGE_KEYS.WEAK_TOPICS) || [];
};

/**
 * Get strong topics
 */
export const getStrongTopics = async (): Promise<string[]> => {
  return await getLocalData<string[]>(STORAGE_KEYS.STRONG_TOPICS) || [];
};

/**
 * Get topic progress
 */
export const getTopicProgress = async (topicId: string): Promise<TopicProgress | null> => {
  const progress = await getLocalData<Record<string, TopicProgress>>(STORAGE_KEYS.PROGRESS) || {};
  return progress[topicId] || null;
};

/**
 * Get all progress
 */
export const getAllProgress = async (): Promise<Record<string, TopicProgress>> => {
  return await getLocalData<Record<string, TopicProgress>>(STORAGE_KEYS.PROGRESS) || {};
};

/**
 * Queue remote sync (non-blocking)
 */
const queueRemoteSync = async (
  userId: string,
  topicId: string,
  subjectId: string,
  score?: number
): Promise<void> => {
  try {
    const topics = await getLocalTopics(subjectId);
    const topicName = topics.find((topic) => topic.id === topicId)?.name;
    addToSyncQueue('progress_update', {
      userId,
      topicId,
      topicName,
      subjectId,
      score,
      lastSeen: new Date().toISOString()
    });
  } catch (error) {
    logError('SYNC_Error_queueing_sync:', error);
  }
};

/**
 * Sync queued data to Supabase
 */
export const syncToRemote = async (): Promise<void> => {
  try {
    await processSyncQueue();
    await saveLocalData(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    console.log('[SYNC] Completed successfully');
  } catch (error) {
    logError('SYNC_Error_during_sync:', error);
    void logEvent('ERROR', 'sync_failed', { error: error instanceof Error ? error.message : String(error) });
  }
};

/**
 * Get recommendation for next topic
 */
export const getRecommendedTopic = async (): Promise<{ subjectId: string; topicId: string; reason: string } | null> => {
  try {
    const weakTopics = await getWeakTopics();
    const progress = await getAllProgress();

    // Priority 1: Weak topics that haven't been attempted recently
    if (weakTopics.length > 0) {
      // Find first weak topic not attempted in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      for (const topicId of weakTopics) {
        const topicProgress = progress[topicId];
        if (topicProgress && new Date(topicProgress.lastSeen) < new Date(oneHourAgo)) {
          // Find subject for this topic
          const subjects = await getLocalSubjects();
          for (const subject of subjects) {
            const topic = subject.topics.find(t => t.id === topicId);
            if (topic) {
              return {
                subjectId: subject.id,
                topicId: topic.id,
                reason: 'Weak area - needs practice'
              };
            }
          }
        }
      }
    }

    // Priority 2: New topics from subjects with progress
    const subjects = await getLocalSubjects();
    for (const subject of subjects) {
      for (const topic of subject.topics) {
        if (!progress[topic.id]) {
          return {
            subjectId: subject.id,
            topicId: topic.id,
            reason: 'New topic - start learning'
          };
        }
      }
    }

    // Priority 3: Continue from last topic
    const lastSync = await getLocalData<string>(STORAGE_KEYS.LAST_SYNC);
    if (lastSync) {
      const subjects = await getLocalSubjects();
      for (const subject of subjects) {
        for (const topic of subject.topics) {
          const topicProgress = progress[topic.id];
          if (topicProgress && !topicProgress.mastered) {
            return {
              subjectId: subject.id,
              topicId: topic.id,
              reason: 'Continue where you left off'
            };
          }
        }
      }
    }

    return null;
  } catch (error) {
    logError('RECOMMEND_Error_getting_recommendation:', error);
    return null;
  }
};

/**
 * Clear all local data (for testing or reset)
 */
export const clearAllLocalData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    console.log('[LOCAL] All data cleared');
  } catch (error) {
    logError('Error_clearing_data:', error);
  }
};

/**
 * Get storage info
 */
export const getStorageInfo = async (): Promise<{ keys: string[]; size: number }> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    let totalSize = 0;
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }

    return {
      keys: keys.filter(k => Object.values(STORAGE_KEYS).includes(k as any)),
      size: totalSize
    };
  } catch (error) {
    logError('Error_getting_storage_info:', error);
    return { keys: [], size: 0 };
  }
};
