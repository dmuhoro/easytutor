import { CanonicalContentNode, RetrievalContext } from '../../types/canonical';
import { Database } from '../../infrastructure/database';
import { buildRetrievalPolicy } from '../../infrastructure/database/retrievalPolicies';
import { RetrievalTelemetry } from './retrievalTelemetry';

export class SemanticSearchEngine {
  static async search(
    context: RetrievalContext,
    policy: ReturnType<typeof buildRetrievalPolicy>,
  ): Promise<CanonicalContentNode[]> {
    const query = Database.governedQuery({
      table: 'knowledge_chunks',
      columns: '*',
      portalType: policy.portalType,
      taxonomyScope: {
        curriculumScope: policy.curriculumScope,
        schoolScope: policy.schoolScope,
      },
    });

    RetrievalTelemetry.emitSearchQuery(context, policy);

    const { data, error } = await query;

    if (error) {
      throw new Error(`[RETRIEVAL] Semantic search failed: ${error.message}`);
    }

    return (data ?? []) as unknown as CanonicalContentNode[];
  }
}
