import { describe, it, expect } from 'vitest';
import { GovernedRetriever } from '../../src/intelligence/retrieval/governedRetriever';
import { RetrievalContext } from '../../src/types/canonical';

describe('Governed Retriever', () => {
  it('throws when retrieval context is incomplete', async () => {
    const context = {
      portal_type: 'high_school',
      curriculum_scope: 'KICD_KCSE',
      taxonomy_scope: 'HS-MATH',
      mastery_level: 30,
      active_path: ['HS-MATH-ALG'],
    } as any;

    await expect(GovernedRetriever.retrieve(context)).rejects.toBeDefined();
  });
});
