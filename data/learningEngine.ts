import { kcseSubjects } from './kcseSubjects';
import { SUBJECTS } from '../lib/subjects';
export type LearningContext = 'high_school' | 'university' | 'self_directed';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Concept = {
  id: string;
  name: string;
  difficulty?: Difficulty;
  shortNotes?: string;
};

export type Subtopic = {
  id: string;
  name: string;
  concepts: Concept[];
  difficulty?: Difficulty;
  shortNotes?: string;
};

export type TopicNode = {
  id: string;
  name: string;
  subtopics: Subtopic[];
  difficulty?: Difficulty;
  shortNotes?: string;
  // Offline question bank cache key can be derived from (subjectName, topicName)
};

export type SubjectNode = {
  id: string;
  name: string;
  icon?: string;
  topics: TopicNode[];
};

export type LearningGraph = {
  context: LearningContext;
  subjects: SubjectNode[];
  source: 'local';
};

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function conceptize(subtopicName: string): Concept[] {
  // Minimal v1: one concept per subtopic. This scaffolds the hierarchy without shipping huge content.
  return [
    {
      id: `${slugify(subtopicName)}_concept`,
      name: subtopicName,
      difficulty: 'medium',
      shortNotes: `Key idea: ${subtopicName}.`,
    },
  ];
}

export async function getLearningGraph(context: LearningContext): Promise<LearningGraph> {
  if (context === 'high_school') {
    return {
      context,
      source: 'local',
      subjects: kcseSubjects.map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        topics: s.topics.map((t) => ({
          id: t.id,
          name: t.name,
          difficulty: 'medium',
          subtopics: (t.subtopics || []).map((st) => ({
            id: slugify(st),
            name: st,
            difficulty: 'medium',
            concepts: conceptize(st),
          })),
        })),
      })),
    };
  }

  if (context === 'university') {
    return {
      context,
      source: 'local',
      subjects: SUBJECTS.map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        topics: s.topics.map((t) => ({
          id: t.id,
          name: t.title,
          difficulty: 'hard',
          subtopics: [
            {
              id: `${t.id}_core`,
              name: 'Core Concepts',
              difficulty: 'hard',
              concepts: [
                { id: `${t.id}_c1`, name: 'Foundations', difficulty: 'hard' },
                { id: `${t.id}_c2`, name: 'Applications', difficulty: 'hard' },
              ],
            },
          ],
        })),
      })),
    };
  }

  return { context, source: 'local', subjects: [] };
}

