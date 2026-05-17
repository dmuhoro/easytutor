import { setMemoryCachedResponse } from '../../../lib/cache';
import { Telemetry } from '../../observability/telemetry';
import { RuntimeContext, buildCanonicalId } from '../runtime/runtimeContext';

export interface PrefetchNode {
  canonical_id: string;
  subject_id: string;
  topic_id: string;
  reason: string;
}

export interface PrefetchResult {
  nodes: readonly PrefetchNode[];
  staged_count: number;
}

export class PredictivePrefetcher {
  predict(context: RuntimeContext): PrefetchNode[] {
    return Array.from({ length: 3 }).map((_, index) => {
      const topicId = `${context.topic_id}-next-${index + 1}`;
      return {
        canonical_id: buildCanonicalId({
          portalType: context.portal_type,
          subjectId: context.subject_id,
          topicId,
        }),
        subject_id: context.subject_id,
        topic_id: topicId,
        reason: index === 0 ? 'direct-continuation' : 'probable-learning-branch',
      };
    });
  }

  async warm(context: RuntimeContext): Promise<PrefetchResult> {
    const start = Date.now();
    const nodes = this.predict(context);

    nodes.forEach((node) => {
      setMemoryCachedResponse(
        `prefetch:${node.canonical_id}`,
        `Staged offline shell for ${node.topic_id} in ${context.portal_type}.`,
      );
    });

    Telemetry.emit({
      event: 'PREFETCH_COMPLETED',
      source: 'intelligence',
      canonicalId: context.canonical_id,
      userId: context.user_id,
      portalType: context.portal_type,
      latency: Date.now() - start,
      operationType: 'PREDICTIVE_PREFETCH',
      payload: {
        staged_count: nodes.length,
        nodes: nodes.map((node) => node.canonical_id),
      },
    });

    return {
      nodes,
      staged_count: nodes.length,
    };
  }
}
