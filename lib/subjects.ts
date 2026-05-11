/**
 * Subjects and Topics adapter
 * Derives from constants/subjects.ts and constants/topics.ts
 *
 * This file is maintained for backward compatibility.
 */

import { SUBJECTS, SubjectDef } from '../constants/subjects';
import { TOPICS, TopicDef } from '../constants/topics';

export interface Topic {
  id: string;   // local ID
  title: string;
}

export interface Subject {
  id: string;   // local ID
  name: string;
  icon: string;
  topics: Topic[];
}

export const SUBJECTS_LIST: Subject[] = SUBJECTS.map((s: SubjectDef) => ({
  id: s.id,
  name: s.name,
  icon: s.icon,
  topics: TOPICS
    .filter((t: TopicDef) => t.subject_id === s.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((t: TopicDef) => ({
      id: t.id,
      title: t.title,
    })),
}));

// Export as SUBJECTS for backward compatibility
export { SUBJECTS_LIST as SUBJECTS };

export const getSubjectById = (id: string): Subject | undefined =>
  SUBJECTS_LIST.find((s) => s.id === id);

export const getTopicById = (subjectId: string, topicId: string): Topic | undefined =>
  getSubjectById(subjectId)?.topics.find((t) => t.id === topicId);
