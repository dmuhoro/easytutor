import { kcseSubjects } from './kcseSubjects';
import { SUBJECTS } from '../lib/subjects';

export type LearningLevel = 'high_school' | 'university' | 'custom';

export type LearningContentSource = 'local';

export type LearningTopic = {
  id: string;
  name: string;
  subtopics?: string[];
};

export type LearningContent = {
  subjectId: string;
  subjectName: string;
  topics: LearningTopic[];
  source: LearningContentSource;
  level: LearningLevel;
};

export async function getLearningContent(level: LearningLevel): Promise<LearningContent[]> {
  if (level === 'high_school') {
    return kcseSubjects.map((s) => ({
      subjectId: s.id,
      subjectName: s.name,
      topics: s.topics.map((t) => ({ id: t.id, name: t.name, subtopics: t.subtopics })),
      source: 'local',
      level: 'high_school',
    }));
  }

  if (level === 'university') {
    return SUBJECTS.map((s) => ({
      subjectId: s.id,
      subjectName: s.name,
      topics: s.topics.map((t) => ({ id: t.id, name: t.title })),
      source: 'local',
      level: 'university',
    }));
  }

  return [];
}

export async function getLearningSubjects(level: LearningLevel): Promise<Array<{ id: string; name: string; icon?: string }>> {
  if (level === 'high_school') {
    return kcseSubjects.map((s) => ({ id: s.id, name: s.name, icon: s.icon }));
  }
  if (level === 'university') {
    return SUBJECTS.map((s) => ({ id: s.id, name: s.name, icon: s.icon }));
  }
  return [];
}

export async function getLearningTopics(level: LearningLevel, subjectId: string): Promise<LearningTopic[]> {
  const all = await getLearningContent(level);
  return all.find((c) => c.subjectId === subjectId)?.topics ?? [];
}

