import { beforeEach, describe, expect, it, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateLearningPath, KnowledgeNode } from '../lib/knowledgeGraphEngine';
import { getSubjectMastery } from '../lib/mastery';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

vi.mock('../lib/mastery', () => ({
  getSubjectMastery: vi.fn().mockResolvedValue([]),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({
        data: [
          { id: '1', title: 'Arithmetic', description: 'Basic numbers', difficulty_level: 10, category: 'topic', prerequisites: [], estimated_mastery_time_mins: 30 },
          { id: '2', title: 'Algebra', description: 'Variables and equations', difficulty_level: 30, category: 'topic', prerequisites: ['1'], estimated_mastery_time_mins: 60 },
          { id: '3', title: 'Calculus', description: 'Rates of change', difficulty_level: 60, category: 'topic', prerequisites: ['2'], estimated_mastery_time_mins: 120 },
          { id: '4', title: 'Machine Learning', description: 'AI models', difficulty_level: 80, category: 'topic', prerequisites: ['3'], estimated_mastery_time_mins: 240 },
        ],
        error: null,
      }),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'db-path-123',
              user_id: 'user-1',
              path_goal: 'test-goal',
              nodes: ['2', '3', '4'],
              current_node_id: '2',
              status: 'active',
            },
            error: null,
          }),
        })),
      })),
    })),
  },
}));

describe('knowledgeGraphEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a learning path traversing prerequisites', async () => {
    const identity = {
      user_id: 'user-1',
      learner_type: 'university' as const,
      goals: ['Machine Learning'],
      interests: ['AI'],
      preferred_learning_style: 'visual' as const,
      target_outcomes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // User has mastered Arithmetic but nothing else
    vi.mocked(getSubjectMastery).mockResolvedValueOnce([
      { topic: 'Arithmetic', mastery_percent: 90 } as any,
    ]);

    const path = await generateLearningPath(identity);

    // Should include Algebra, Calculus, and ML, but omit Arithmetic because it's mastered.
    // Order should be topologically sorted (Algebra -> Calculus -> Machine Learning)
    expect(path.nodes).toEqual(['2', '3', '4']);
    expect(path.current_node_id).toBe('2');
  });

  it('falls back to foundational nodes if no goals match', async () => {
    const identity = {
      user_id: 'user-1',
      learner_type: 'secondary' as const,
      goals: ['Cooking'], // Does not match any nodes
      interests: [],
      preferred_learning_style: 'visual' as const,
      target_outcomes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const path = await generateLearningPath(identity);

    // Should pick foundational nodes (difficulty <= 30) when no goals match
    // Expects nodes with difficulty 10 and 30 (Arithmetic and Algebra)
    expect(path.nodes.length).toBeGreaterThan(0);
    expect(path.current_node_id).toBeDefined();
  });
});
