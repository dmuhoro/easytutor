import { RetrievalContext, CanonicalContentNode } from '../../types/canonical';
import { ContextExpansionEngine } from '../retrieval/contextExpansionEngine';
import { MasteryAwareRetriever } from '../retrieval/masteryAwareRetriever';
import { AdaptiveTutorReasoner } from './adaptiveTutorReasoner';
import { Telemetry } from '../../observability/telemetry';

export interface ReasoningResult {
  plan: ReturnType<typeof AdaptiveTutorReasoner.reason>;
  retrieved: CanonicalContentNode[];
}

export class ReasoningEngine {
  static async reason(context: RetrievalContext): Promise<ReasoningResult> {
    const expanded = ContextExpansionEngine.expand(context);
    const retrieved = await MasteryAwareRetriever.retrieve(expanded);
    const plan = AdaptiveTutorReasoner.reason(expanded, retrieved);

    Telemetry.emit({
      event: 'PIPELINE_EXECUTED',
      source: 'intelligence',
      portalType: context.portal_type,
      canonicalId: context.knowledge_scope,
      payload: {
        result_count: retrieved.length,
        difficulty: plan.difficulty,
      },
    });

    return { plan, retrieved };
  }
}
