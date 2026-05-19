import { RetrievalContext, CanonicalContentNode } from '../../types/canonical';
import { GovernedRetriever } from './governedRetriever';
import { RetrievalRankingEngine } from './retrievalRankingEngine';
import { RetrievalTelemetry } from './retrievalTelemetry';

export class MasteryAwareRetriever {
  static async retrieve(context: RetrievalContext): Promise<CanonicalContentNode[]> {
    const results = await GovernedRetriever.retrieve(context);
    const ranked = RetrievalRankingEngine.rankForMastery(results, context.mastery_level ?? 0);

    RetrievalTelemetry.emitMasteryAwareRetrieval(context, ranked.length);
    return ranked;
  }
}
