import { SupabaseClient } from '@supabase/supabase-js';
import { PortalType } from '../../types/canonical';
import { assertPortalType } from './portalFilters';
import { assertCanonicalOwnership, TaxonomyScope } from './taxonomyGuards';

export interface PortalScopedQueryInput {
  table: string;
  columns: string;
  portalType: PortalType;
  userId?: string;
  taxonomyScope?: TaxonomyScope;
}

export const buildPortalScopedQuery = (
  client: SupabaseClient,
  input: PortalScopedQueryInput,
) => {
  const portalType = assertPortalType(input.portalType);
  assertCanonicalOwnership(portalType, input.taxonomyScope);

  let query = client
    .from(input.table)
    .select(input.columns)
    .eq('portal_type', portalType);

  if (input.userId) {
    query = query.eq('user_id', input.userId);
  }

  const scope = input.taxonomyScope;
  if (scope?.curriculumScope) query = query.eq('curriculum_scope', scope.curriculumScope);
  if (scope?.schoolScope) query = query.eq('school_scope', scope.schoolScope);
  if (scope?.departmentScope) query = query.eq('department_scope', scope.departmentScope);
  if (scope?.subjectScope) query = query.eq('subject_scope', scope.subjectScope);
  if (scope?.knowledgeDomainScope) {
    query = query.eq('knowledge_domain_scope', scope.knowledgeDomainScope);
  }

  return query;
};
