import AsyncStorage from '@react-native-async-storage/async-storage';
import { track } from './analytics';
import { getTopicMastery, getSubjectMastery } from './mastery';
import {
  getQuestionsByFilter,
  QuestionBankItem,
} from './questionBank';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface RecommendedDifficulty {
  distribution: DifficultyDistribution;
  primary: DifficultyLevel;
  masteryPercent: number;
}

export interface AdaptiveQuestionSetResult {
  questions: QuestionBankItem[];
  masteryPercent: number;
  distribution: DifficultyDistribution;
  primary: DifficultyLevel;
  difficultyMix: Record<DifficultyLevel, number>;
}

const PROFILE_CACHE_PREFIX = 'adaptive_profile_cache_v1';

const profileCacheKey = (
  userId: string | undefined,
  subject: string,
  topic: string,
) => `${PROFILE_CACHE_PREFIX}:${userId ?? 'anon'}:${subject}:${topic}`;

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Returns difficulty weights from mastery percent.
 * mastery < 50: easy 70%, medium 25%, hard 5%
 * mastery 50-80: easy 30%, medium 50%, hard 20%
 * mastery > 80: easy 10%, medium 40%, hard 50%
 */
export const getDifficultyDistribution = (masteryPercent: number): DifficultyDistribution => {
  if (masteryPercent < 50) {
    return { easy: 0.7, medium: 0.25, hard: 0.05 };
  }
  if (masteryPercent <= 80) {
    return { easy: 0.3, medium: 0.5, hard: 0.2 };
  }
  return { easy: 0.1, medium: 0.4, hard: 0.5 };
};

export const getRecommendedDifficulty = (masteryPercent: number): RecommendedDifficulty => {
  const distribution = getDifficultyDistribution(masteryPercent);
  const entries: [DifficultyLevel, number][] = [
    ['easy', distribution.easy],
    ['medium', distribution.medium],
    ['hard', distribution.hard],
  ];
  const primary = entries.sort((a, b) => b[1] - a[1])[0][0];
  return { distribution, primary, masteryPercent };
};

export const allocateDifficultyCounts = (
  count: number,
  distribution: DifficultyDistribution,
): Record<DifficultyLevel, number> => {
  const raw = {
    easy: Math.round(count * distribution.easy),
    medium: Math.round(count * distribution.medium),
    hard: Math.round(count * distribution.hard),
  };
  let total = raw.easy + raw.medium + raw.hard;
  while (total < count) {
    const level = (['medium', 'easy', 'hard'] as DifficultyLevel[])[count - total] ?? 'medium';
    raw[level] += 1;
    total += 1;
  }
  while (total > count) {
    const order: DifficultyLevel[] = ['hard', 'medium', 'easy'];
    for (const level of order) {
      if (raw[level] > 0) {
        raw[level] -= 1;
        total -= 1;
        if (total === count) break;
      }
    }
  }
  return raw;
};

export const resolveTopicMasteryPercent = async (
  userId: string | undefined,
  subject: string,
  topic: string,
): Promise<number> => {
  const sessionTopic = topic && topic !== 'all' ? topic : null;

  if (sessionTopic) {
    const record = await getTopicMastery(userId, subject, sessionTopic);
    return record?.mastery_percent ?? 0;
  }

  const records = await getSubjectMastery(userId, subject);
  if (records.length === 0) return 0;
  const sum = records.reduce((acc, item) => acc + item.mastery_percent, 0);
  return Math.round(sum / records.length);
};

const pickFromPool = (
  pool: QuestionBankItem[],
  count: number,
  usedIds: Set<string>,
): QuestionBankItem[] => {
  const available = pool.filter((q) => !usedIds.has(q.id));
  const picked = shuffle(available).slice(0, count);
  picked.forEach((q) => usedIds.add(q.id));
  return picked;
};

export const buildAdaptiveQuestionSet = async (
  userId: string | undefined,
  subject: string,
  topic: string,
  count: number = 10,
): Promise<AdaptiveQuestionSetResult> => {
  const masteryPercent = await resolveTopicMasteryPercent(userId, subject, topic);
  const { distribution, primary } = getRecommendedDifficulty(masteryPercent);

  const pool = await getQuestionsByFilter(subject, topic, 'all');
  const byDifficulty: Record<DifficultyLevel, QuestionBankItem[]> = {
    easy: pool.filter((q) => q.difficulty === 'easy'),
    medium: pool.filter((q) => q.difficulty === 'medium'),
    hard: pool.filter((q) => q.difficulty === 'hard'),
  };

  const targets = allocateDifficultyCounts(count, distribution);
  const usedIds = new Set<string>();
  const selected: QuestionBankItem[] = [];

  (['easy', 'medium', 'hard'] as DifficultyLevel[]).forEach((level) => {
    selected.push(...pickFromPool(byDifficulty[level], targets[level], usedIds));
  });

  if (selected.length < count) {
    const remainder = pickFromPool(pool, count - selected.length, usedIds);
    selected.push(...remainder);
  }

  const questions = shuffle(selected).slice(0, count);
  const difficultyMix: Record<DifficultyLevel, number> = {
    easy: questions.filter((q) => q.difficulty === 'easy').length,
    medium: questions.filter((q) => q.difficulty === 'medium').length,
    hard: questions.filter((q) => q.difficulty === 'hard').length,
  };

  const result: AdaptiveQuestionSetResult = {
    questions,
    masteryPercent,
    distribution,
    primary,
    difficultyMix,
  };

  try {
    await AsyncStorage.setItem(
      profileCacheKey(userId, subject, topic),
      JSON.stringify({
        masteryPercent,
        distribution,
        primary,
        cached_at: new Date().toISOString(),
      }),
    );
  } catch {
    // Offline-first: session still works without profile cache write.
  }

  return result;
};

export const getCachedAdaptiveProfile = async (
  userId: string | undefined,
  subject: string,
  topic: string,
): Promise<RecommendedDifficulty | null> => {
  try {
    const raw = await AsyncStorage.getItem(profileCacheKey(userId, subject, topic));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      masteryPercent: number;
      distribution: DifficultyDistribution;
      primary: DifficultyLevel;
    };
    return {
      masteryPercent: parsed.masteryPercent,
      distribution: parsed.distribution,
      primary: parsed.primary,
    };
  } catch {
    return null;
  }
};

export const formatDifficultyLabel = (level: DifficultyLevel): string =>
  level.charAt(0).toUpperCase() + level.slice(1);

export const describeSessionDifficulty = (
  mix: Record<DifficultyLevel, number>,
): string => {
  const parts = (['easy', 'medium', 'hard'] as DifficultyLevel[])
    .filter((level) => mix[level] > 0)
    .map((level) => `${formatDifficultyLabel(level)} (${mix[level]})`);
  return parts.length > 0 ? parts.join(', ') : 'Mixed';
};

export const trackAdaptiveSessionStarted = (
  payload: {
    user_id?: string;
    subject: string;
    topic: string;
    mastery_percent: number;
    primary_difficulty: DifficultyLevel;
    question_count: number;
  },
): void => {
  track('adaptive_session_started', payload);
};

export const trackAdaptiveDifficultyChanged = (
  payload: {
    user_id?: string;
    subject: string;
    topic: string;
    previous_primary: DifficultyLevel;
    next_primary: DifficultyLevel;
    previous_mastery: number;
    next_mastery: number;
  },
): void => {
  if (payload.previous_primary === payload.next_primary) return;
  track('adaptive_difficulty_changed', payload);
};
