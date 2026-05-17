import { Telemetry } from '../../observability/telemetry';
import { RuntimeContext } from '../runtime/runtimeContext';
import { PipelineExecutor, PipelineKind, PipelineResult } from './pipelineExecutor';

export interface AdaptiveFlowPlan {
  ordered_pipelines: readonly PipelineKind[];
  reason: string;
}

export class AdaptiveFlowEngine {
  constructor(private readonly executor = new PipelineExecutor()) {}

  plan(context: RuntimeContext): AdaptiveFlowPlan {
    if (context.mastery_state.score < 40 || context.mastery_state.weak_points.length > 0) {
      return {
        ordered_pipelines: ['mastery_remediation', 'lesson_generation', 'quiz_generation'],
        reason: 'weak-mastery-remediation-first',
      };
    }

    if (context.mastery_state.score >= 75) {
      return {
        ordered_pipelines: ['quiz_generation', 'predictive_continuation', 'roadmap_adaptation'],
        reason: 'advanced-learner-acceleration',
      };
    }

    return {
      ordered_pipelines: ['lesson_generation', 'spaced_repetition', 'quiz_generation'],
      reason: 'balanced-learning-flow',
    };
  }

  async run(context: RuntimeContext): Promise<PipelineResult[]> {
    const start = Date.now();
    const plan = this.plan(context);
    const results: PipelineResult[] = [];

    for (const kind of plan.ordered_pipelines) {
      results.push(await this.executor.execute({ kind, context }));
    }

    Telemetry.emit({
      event: 'PIPELINE_EXECUTED',
      source: 'intelligence',
      canonicalId: context.canonical_id,
      userId: context.user_id,
      portalType: context.portal_type,
      latency: Date.now() - start,
      operationType: 'ADAPTIVE_FLOW',
      payload: {
        reason: plan.reason,
        pipeline_count: results.length,
      },
    });

    return results;
  }
}
