import { describe, it, expect } from 'vitest';
import { ContextExpansionEngine } from '../../src/intelligence/retrieval/contextExpansionEngine';

describe('Context Expansion Engine', () => {
  it('appends user_goal to active_path when missing', () => {
    const context = {
      portal_type: 'high_school',
      curriculum_scope: 'KICD_KCSE',
      taxonomy_scope: 'HS-MATH',
      mastery_level: 25,
      user_goal: 'Understand linear equation steps',
      active_path: ['HS-MATH-ALG'],
    } as const;

    const expanded = ContextExpansionEngine.expand(context);

    expect(expanded.active_path).toContain('Understand linear equation steps');
    expect(expanded.active_path.length).toBe(2);
  });
});
