import { PortalType } from '../../types/canonical';
import { validateCanonicalID } from '../../knowledge/taxonomies';
import { assertPortalType } from './portalFilters';

export interface TaxonomyScope {
  canonicalId?: string;
  taxonomyPath?: readonly string[];
  taxonomyScope?: string;
  curriculumScope?: string;
  schoolScope?: string;
  departmentScope?: string;
  subjectScope?: string;
  knowledgeDomainScope?: string;
}

export interface GovernedPayload extends Record<string, unknown> {
  portal_type?: PortalType;
  canonical_id?: string;
  taxonomy_path?: readonly string[];
  curriculum_scope?: string;
  school_scope?: string;
  department_scope?: string;
  subject_scope?: string;
  knowledge_domain_scope?: string;
}

export const assertCanonicalOwnership = (
  portalType: PortalType,
  scope: TaxonomyScope = {},
): void => {
  const portal = assertPortalType(portalType);

  if (scope.canonicalId && !validateCanonicalID(scope.canonicalId, portal)) {
    throw new Error(
      `[GOVERNANCE ERROR] canonical_id ${scope.canonicalId} is not owned by ${portal}.`,
    );
  }

  if (scope.taxonomyPath && scope.taxonomyPath.length === 0) {
    throw new Error('[GOVERNANCE ERROR] taxonomy_path cannot be empty.');
  }
};

export const scopeFromPayload = (payload: GovernedPayload): TaxonomyScope => ({
  canonicalId: typeof payload.canonical_id === 'string' ? payload.canonical_id : undefined,
  taxonomyPath: Array.isArray(payload.taxonomy_path)
    ? payload.taxonomy_path.filter((item): item is string => typeof item === 'string')
    : undefined,
  curriculumScope: typeof payload.curriculum_scope === 'string' ? payload.curriculum_scope : undefined,
  schoolScope: typeof payload.school_scope === 'string' ? payload.school_scope : undefined,
  departmentScope: typeof payload.department_scope === 'string' ? payload.department_scope : undefined,
  subjectScope: typeof payload.subject_scope === 'string' ? payload.subject_scope : undefined,
  knowledgeDomainScope:
    typeof payload.knowledge_domain_scope === 'string' ? payload.knowledge_domain_scope : undefined,
});

export const assertPayloadOwnership = (
  portalType: PortalType,
  payload: GovernedPayload | readonly GovernedPayload[],
): void => {
  const rows = Array.isArray(payload) ? payload : [payload];

  rows.forEach((row) => {
    const rowPortal = row.portal_type ? assertPortalType(row.portal_type) : portalType;
    if (rowPortal !== portalType) {
      throw new Error(
        `[GOVERNANCE ERROR] Payload portal_type ${rowPortal} cannot be written through ${portalType}.`,
      );
    }

    assertCanonicalOwnership(portalType, scopeFromPayload(row));
  });
};
