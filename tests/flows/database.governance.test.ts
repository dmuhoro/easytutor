import { describe, expect, it } from 'vitest';
import {
  assertPortalType,
  assertRetrievalContext,
  buildRetrievalPolicy,
  validateCanonicalID,
} from '../../src/infrastructure/database';

describe('database governance contracts', () => {
  it('rejects missing portal filters before a query can be built', () => {
    expect(() => assertPortalType(undefined)).toThrow(/portal_type/);
  });

  it('keeps canonical IDs owned by their portal namespace', () => {
    expect(validateCanonicalID('HS-MATH-ALG-001', 'high_school')).toBe(true);
    expect(validateCanonicalID('UNI-COMP-CS-BSC-DSA', 'university')).toBe(true);
    expect(validateCanonicalID('UNI-COMP-CS-BSC-DSA', 'high_school')).toBe(false);
  });

  it('requires full retrieval context for vector search', () => {
    expect(() => assertRetrievalContext({ portal_type: 'high_school' })).toThrow(/curriculum_scope/);

    const context = assertRetrievalContext({
      portal_type: 'university',
      curriculum_scope: 'HEB_UNIV',
      taxonomy_scope: 'UNI-COMP-CS',
      school_scope: 'UNI-COMP',
      mastery_level: 72,
      user_goal: 'understand data structures',
      active_path: ['UNI-COMP', 'UNI-COMP-CS', 'UNI-COMP-CS-BSC-DSA'],
    });

    const policy = buildRetrievalPolicy(context, { maxChunks: 4, minSimilarity: 0.6 });
    expect(policy).toMatchObject({
      portalType: 'university',
      curriculumScope: 'HEB_UNIV',
      taxonomyScope: 'UNI-COMP-CS',
      schoolScope: 'UNI-COMP',
      vectorNamespace: 'portal:university',
      matchCount: 4,
      minSimilarity: 0.6,
    });
  });
});
