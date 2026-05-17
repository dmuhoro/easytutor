import { PortalType, RetrievalContext } from '../../types/canonical';
import { assertPortalType, portalNamespaceFor } from './portalFilters';
import { assertCanonicalOwnership, TaxonomyScope } from './taxonomyGuards';

export interface GovernedRetrievalContext extends RetrievalContext {
  portal_type: PortalType;
  curriculum_scope: string;
  taxonomy_scope: string;
  mastery_level: number;
  user_goal: string;
  active_path: readonly string[];
  school_scope?: string;
}

export interface RetrievalPolicy {
  portalType: PortalType;
  vectorNamespace: string;
  taxonomyScope: string;
  curriculumScope: string;
  schoolScope?: string;
  matchCount: number;
  minSimilarity: number;
}

export const assertRetrievalContext = (
  context: Partial<GovernedRetrievalContext>,
): GovernedRetrievalContext => {
  const portalType = assertPortalType(context.portal_type);

  if (!context.curriculum_scope) {
    throw new Error('[GOVERNANCE ERROR] Retrieval requires curriculum_scope.');
  }
  if (!context.taxonomy_scope) {
    throw new Error('[GOVERNANCE ERROR] Retrieval requires taxonomy_scope.');
  }
  if (typeof context.mastery_level !== 'number') {
    throw new Error('[GOVERNANCE ERROR] Retrieval requires mastery_level.');
  }
  if (!context.user_goal) {
    throw new Error('[GOVERNANCE ERROR] Retrieval requires user_goal.');
  }
  if (!Array.isArray(context.active_path) || context.active_path.length === 0) {
    throw new Error('[GOVERNANCE ERROR] Retrieval requires active_path.');
  }

  assertCanonicalOwnership(portalType, {
    taxonomyScope: context.taxonomy_scope,
    curriculumScope: context.curriculum_scope,
    schoolScope: context.school_scope,
  } satisfies TaxonomyScope);

  return {
    ...context,
    portal_type: portalType,
    curriculum_scope: context.curriculum_scope,
    taxonomy_scope: context.taxonomy_scope,
    mastery_level: context.mastery_level,
    user_goal: context.user_goal,
    active_path: context.active_path,
  };
};

export const buildRetrievalPolicy = (
  context: GovernedRetrievalContext,
  options: { maxChunks?: number; minSimilarity?: number } = {},
): RetrievalPolicy => ({
  portalType: context.portal_type,
  vectorNamespace: portalNamespaceFor(context.portal_type),
  taxonomyScope: context.taxonomy_scope,
  curriculumScope: context.curriculum_scope,
  schoolScope: context.school_scope,
  matchCount: options.maxChunks ?? context.limit ?? 5,
  minSimilarity: options.minSimilarity ?? 0.7,
});
