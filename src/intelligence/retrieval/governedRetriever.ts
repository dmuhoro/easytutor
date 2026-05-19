import { Database } from '../../infrastructure/database';
import { RetrievalContext, CanonicalContentNode, PortalType } from '../../types/canonical';
import { assertRetrievalContext, buildRetrievalPolicy } from '../../infrastructure/database/retrievalPolicies';
import { SemanticSearchEngine } from './semanticSearchEngine';
import { RetrievalTelemetry } from './retrievalTelemetry';

export class GovernedRetriever {
  static async retrieve(context: RetrievalContext): Promise<CanonicalContentNode[]> {
    const governedContext = assertRetrievalContext({
      ...context,
      portal_type: context.portal_type,
      curriculum_scope: context.curriculum_scope ?? '',
      taxonomy_scope: context.taxonomy_scope ?? '',
      mastery_level: context.mastery_level ?? 0,
      user_goal: context.user_goal ?? '',
      active_path: context.active_path ?? [],
    });

    const policy = buildRetrievalPolicy(governedContext, {
      maxChunks: context.limit ?? 5,
    });

    RetrievalTelemetry.emitRetrievalStarted(governedContext, policy);

    const results = await SemanticSearchEngine.search(governedContext, policy);

    RetrievalTelemetry.emitRetrievalCompleted(governedContext, results.length, false);

    return results;
  }

  static async retrieveWithFallback(
    context: RetrievalContext,
    fallback: () => Promise<CanonicalContentNode[]>,
  ): Promise<CanonicalContentNode[]> {
    try {
      return await this.retrieve(context);
    } catch (err) {
      RetrievalTelemetry.emitOfflineFallback(context, (err as Error).message);
      return fallback();
    }
  }
}
