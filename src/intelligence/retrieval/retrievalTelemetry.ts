import { RetrievalContext, TelemetryEventType } from '../../types/canonical';
import { Telemetry } from '../../observability/telemetry';
import { RetrievalPolicy } from '../../infrastructure/database/retrievalPolicies';

export class RetrievalTelemetry {
  static emitRetrievalStarted(context: RetrievalContext, policy: RetrievalPolicy) {
    Telemetry.emit({
      event: 'RETRIEVAL_EXECUTED',
      source: 'intelligence',
      portalType: context.portal_type,
      canonicalId: context.knowledge_scope,
      payload: {
        policy,
        active_path: context.active_path,
      },
    });
  }

  static emitSearchQuery(context: RetrievalContext, policy: RetrievalPolicy) {
    Telemetry.emit({
      event: 'RETRIEVAL_EXECUTED',
      source: 'intelligence',
      portalType: context.portal_type,
      canonicalId: context.knowledge_scope,
      payload: {
        query_policy: policy,
      },
    });
  }

  static emitMasteryAwareRetrieval(context: RetrievalContext, resultCount: number) {
    Telemetry.emit({
      event: 'RETRIEVAL_EXECUTED',
      source: 'intelligence',
      portalType: context.portal_type,
      canonicalId: context.knowledge_scope,
      payload: {
        mastery_level: context.mastery_level,
        results: resultCount,
        mode: 'mastery_aware',
      },
    });
  }

  static emitRetrievalCompleted(context: RetrievalContext, resultCount: number, cacheHit: boolean) {
    Telemetry.emit({
      event: cacheHit ? 'CACHE_HIT' : 'RETRIEVAL_EXECUTED',
      source: 'intelligence',
      portalType: context.portal_type,
      canonicalId: context.knowledge_scope,
      payload: {
        result_count: resultCount,
        cache_hit: cacheHit,
      },
    });
  }

  static emitOfflineFallback(context: RetrievalContext, reason: string) {
    Telemetry.emit({
      event: 'OFFLINE_FALLBACK',
      source: 'intelligence',
      portalType: context.portal_type,
      canonicalId: context.knowledge_scope,
      payload: {
        reason,
      },
    });
  }
}
