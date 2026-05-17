import { Telemetry } from '../../observability/telemetry';
import { MasteryCoordinator } from '../mastery/masteryCoordinator';
import { AdaptiveFlowEngine } from '../pipelines/adaptiveFlowEngine';
import { PipelineExecutor, PipelineResult } from '../pipelines/pipelineExecutor';
import { Recommendation, RecommendationEngine } from '../pipelines/recommendationEngine';
import { PredictivePrefetcher, PrefetchResult } from '../prefetch/predictivePrefetcher';
import { RuntimeContext, RuntimeContextInput, createRuntimeContext } from '../runtime/runtimeContext';

export interface OrchestrationResult<T = unknown> {
  context: RuntimeContext;
  pipeline: PipelineResult<T>;
  recommendations: readonly Recommendation[];
  prefetch?: PrefetchResult;
}

export class LearningOrchestrator {
  constructor(
    private readonly pipelineExecutor = new PipelineExecutor(),
    private readonly adaptiveFlowEngine = new AdaptiveFlowEngine(pipelineExecutor),
    private readonly masteryCoordinator = new MasteryCoordinator(),
    private readonly recommendationEngine = new RecommendationEngine(),
    private readonly prefetcher = new PredictivePrefetcher(),
  ) {}

  createContext(input: RuntimeContextInput): RuntimeContext {
    return createRuntimeContext(input);
  }

  async generateLesson(input: RuntimeContextInput): Promise<OrchestrationResult> {
    return this.executeSingle('lesson_generation', input, 'LESSON_GENERATED');
  }

  async assembleQuiz(input: RuntimeContextInput): Promise<OrchestrationResult> {
    return this.executeSingle('quiz_generation', input, 'QUIZ_ASSEMBLED');
  }

  async tutor(input: RuntimeContextInput): Promise<OrchestrationResult> {
    return this.executeSingle('mastery_remediation', input, 'PIPELINE_EXECUTED');
  }

  async progressRoadmap(input: RuntimeContextInput): Promise<PipelineResult[]> {
    const context = this.createContext(input);
    return this.adaptiveFlowEngine.run(context);
  }

  async updateMastery(input: RuntimeContextInput): Promise<readonly Recommendation[]> {
    const context = this.createContext(input);
    const plan = this.masteryCoordinator.evaluate(context);
    return this.recommendationEngine.recommend(context, plan);
  }

  async prefetchNext(input: RuntimeContextInput): Promise<PrefetchResult> {
    const context = this.createContext(input);
    return this.prefetcher.warm(context);
  }

  private async executeSingle(
    kind: Parameters<PipelineExecutor['execute']>[0]['kind'],
    input: RuntimeContextInput,
    event: 'LESSON_GENERATED' | 'QUIZ_ASSEMBLED' | 'PIPELINE_EXECUTED',
  ): Promise<OrchestrationResult> {
    const start = Date.now();
    const context = this.createContext(input);
    const pipeline = await this.pipelineExecutor.execute({ kind, context });
    const recommendations = this.recommendationEngine.recommend(context, pipeline.mastery_plan);
    const prefetch = await this.prefetcher.warm(context);

    Telemetry.emit({
      event,
      source: 'intelligence',
      canonicalId: context.canonical_id,
      userId: context.user_id,
      portalType: context.portal_type,
      latency: Date.now() - start,
      operationType: `ORCHESTRATOR_${kind.toUpperCase()}`,
      payload: {
        recommendations: recommendations.length,
        prefetch_count: prefetch.staged_count,
        pipeline_latency: pipeline.telemetry.latency,
      },
    });

    return {
      context,
      pipeline,
      recommendations,
      prefetch,
    };
  }
}

export const learningOrchestrator = new LearningOrchestrator();
