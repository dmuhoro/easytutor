/**
 * KCSE Subjects adapter — derives all data from constants/subjects + constants/topics.
 *
 * This file exists purely for backward compatibility with code that imports
 * KCSESubject / KCSETopic types and the `kcseSubjects` array.
 * Do NOT add subject/topic data here. Edit constants/subjects.ts and constants/topics.ts.
 */

import { SUBJECTS, SubjectDef } from '../constants/subjects';
import { TOPICS, TopicDef } from '../constants/topics';

// ── Public types (kept for backward compatibility) ──────────────────────────

export interface KCSETopic {
  id: string;       // stable local ID from constants/topics e.g. 'hs-math:algebra'
  name: string;     // display name = TopicDef.title
  subtopics: string[];
}

export interface KCSESubject {
  id: string;       // stable local ID from constants/subjects e.g. 'hs-math'
  name: string;
  icon: string;
  category: 'sciences' | 'languages' | 'humanities' | 'technical' | 'arts';
  topics: KCSETopic[];
}

// ── Category mapping ─────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, KCSESubject['category']> = {
  'hs-math':        'sciences',
  'hs-physics':     'sciences',
  'hs-chemistry':   'sciences',
  'hs-biology':     'sciences',
  'hs-english':     'languages',
  'hs-kiswahili':   'languages',
  'hs-history':     'humanities',
  'hs-geography':   'humanities',
  'hs-business':    'humanities',
  'hs-cre':         'humanities',
  'hs-technical':   'technical',
  'hs-computer':    'technical',
  'hs-agriculture': 'technical',
  'hs-home-science':'technical',
};

// ── Derived data ─────────────────────────────────────────────────────────────

export const kcseSubjects: KCSESubject[] = SUBJECTS
  .filter((s) => s.level === 'high_school')
  .map((s: SubjectDef): KCSESubject => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    category: CATEGORY_MAP[s.id] ?? 'technical',
    topics: TOPICS
      .filter((t: TopicDef) => t.subject_id === s.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t: TopicDef): KCSETopic => ({
        id: t.id,
        name: t.title,
        subtopics: t.subtopics ?? [],
      })),
  }));

// ── Helper functions (backward-compatible) ───────────────────────────────────

export const getSubjectById = (id: string): KCSESubject | undefined =>
  kcseSubjects.find((s) => s.id === id);

export const getTopicById = (subjectId: string, topicId: string): KCSETopic | undefined =>
  getSubjectById(subjectId)?.topics.find((t) => t.id === topicId);

export const getAllTopics = (): KCSETopic[] =>
  kcseSubjects.flatMap((s) => s.topics);

export const getSubjectsByCategory = (category: KCSESubject['category']): KCSESubject[] =>
  kcseSubjects.filter((s) => s.category === category);

export const searchSubjects = (query: string): KCSESubject[] => {
  const lower = query.toLowerCase();
  return kcseSubjects.filter(
    (s) =>
      s.name.toLowerCase().includes(lower) ||
      s.topics.some(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.subtopics.some((st) => st.toLowerCase().includes(lower)),
      ),
  );
};