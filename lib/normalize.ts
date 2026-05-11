import type { CustomRoadmap } from '../store/roadmapStore';

export type NormalizedProfile = {
  id?: string;
  email?: string | null;
  onboarding_complete: boolean;
  learning_mode: 'high_school' | 'university' | 'self_directed' | 'unknown';
  is_beta_user: boolean;
};

export function normalizeProfile(raw: any): NormalizedProfile {
  const learningMode = raw?.learning_mode;
  const normalizedLearningMode =
    learningMode === 'high_school' || learningMode === 'university' || learningMode === 'self_directed'
      ? learningMode
      : 'unknown';

  return {
    id: typeof raw?.id === 'string' ? raw.id : undefined,
    email: typeof raw?.email === 'string' ? raw.email : null,
    onboarding_complete: Boolean(raw?.onboarding_complete),
    learning_mode: normalizedLearningMode,
    is_beta_user: Boolean(raw?.is_beta_user),
  };
}

export function normalizeRoadmap(raw: any): CustomRoadmap | null {
  if (!raw) return null;
  const id = typeof raw.id === 'string' ? raw.id : undefined;
  const title = typeof raw.title === 'string' ? raw.title : undefined;
  const topic = typeof raw.topic === 'string' ? raw.topic : undefined;
  const days = Array.isArray(raw.days) ? raw.days : [];
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString();

  if (!id || !title || !topic) return null;

  return {
    id,
    title,
    topic,
    days: days
      .filter(Boolean)
      .map((d: any) => ({
        day: typeof d?.day === 'number' ? d.day : 0,
        title: typeof d?.title === 'string' ? d.title : 'Day',
        tasks: Array.isArray(d?.tasks) ? d.tasks.filter((t: any) => typeof t === 'string') : [],
      }))
      .filter((d: any) => d.day > 0),
    learningMode: raw.learningMode,
    subjectId: typeof raw.subjectId === 'string' ? raw.subjectId : undefined,
    createdAt,
    lastOpenedAt: typeof raw.lastOpenedAt === 'string' ? raw.lastOpenedAt : undefined,
    completionStatus:
      raw.completionStatus === 'not_started' || raw.completionStatus === 'in_progress' || raw.completionStatus === 'completed'
        ? raw.completionStatus
        : undefined,
  };
}

