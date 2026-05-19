import { retrieveRelevantChunks } from '../../../lib/retrieval';
import { getDifficultyLevel } from '../../../lib/difficulty';
import { Telemetry } from '../../observability/telemetry';
import { RuntimeContext } from '../runtime/runtimeContext';
import { HybridInferenceRouter } from '../routing/hybridInferenceRouter';
import { GovernedAgentRuntime } from '../../runtime/agentic/governedAgentRuntime';
import { MasteryCoordinator, MasteryPlan } from '../mastery/masteryCoordinator';
import { safeParseQuizArray } from '../../../lib/aiQuiz';

export type PipelineKind =
  | 'lesson_generation'
  | 'quiz_generation'
  | 'quiz_question_generation'
  | 'mastery_remediation'
  | 'spaced_repetition'
  | 'predictive_continuation'
  | 'roadmap_adaptation';

export interface PipelineRequest {
  kind: PipelineKind;
  context: RuntimeContext;
  input?: Record<string, unknown>;
}

export interface PipelineResult<T = unknown> {
  kind: PipelineKind;
  canonical_id: string;
  output: T;
  mastery_plan: MasteryPlan;
  telemetry: {
    latency: number;
    retrieval_depth: number;
    cache_route: string;
  };
}

const buildPrompt = (request: PipelineRequest, retrievedContext: string): string => {
  const { context, kind } = request;
  
  if (kind === 'quiz_generation') {
    return [
      `Portal: ${context.portal_type}`,
      `Subject: ${context.subject_id}`,
      `Topic: ${context.topic_id}`,
      `Goal: ${context.learning_goal}`,
      `Mastery Level: ${context.mastery_state.score}`,
      'Generate exactly 5 multiple-choice questions based on the retrieved context.',
      'Return ONLY a JSON array of objects with keys: "question", "options" (4 strings), "correctIndex" (number 0-3), and "explanation".',
      `Retrieved context:\n${retrievedContext || 'No retrieved context available.'}`,
    ].join('\n\n');
  }

  return [
    `Portal: ${context.portal_type}`,
    `Canonical ID: ${context.canonical_id}`,
    `Subject: ${context.subject_id}`,
    `Topic: ${context.topic_id}`,
    `Goal: ${context.learning_goal}`,
    `Mastery: ${context.mastery_state.score}`,
    `Pipeline: ${kind}`,
    `Retrieved context:\n${retrievedContext || 'No retrieved context available.'}`,
    'Produce concise, curriculum-safe educational output grounded in this context.',
  ].join('\n\n');
};

export class PipelineExecutor {
  constructor(
    private readonly aiRouter = new HybridInferenceRouter(),
    private readonly masteryCoordinator = new MasteryCoordinator(),
    private readonly governedRuntime: GovernedAgentRuntime = new GovernedAgentRuntime(),
  ) {}

  async execute(request: PipelineRequest): Promise<PipelineResult> {
    const start = Date.now();
    const chunks = await retrieveRelevantChunks(
      `${request.context.learning_goal} ${request.context.topic_id}`,
      request.context.retrieval_policy,
      { maxChunks: request.context.retrieval_policy.limit },
    );
    const retrievedContext = chunks.map((chunk) => chunk.content).join('\n---\n');
    const prompt = buildPrompt(request, retrievedContext);
    
    const complexity = request.kind === 'quiz_generation' || request.context.mastery_state.score > 70
      ? 'high'
      : request.context.mastery_state.score < 40
        ? 'low'
        : 'normal';
        
    const aiResponse = await this.aiRouter.execute({
      prompt,
      complexity,
      cacheKey: `${request.kind}:${request.context.canonical_id}:${request.context.mastery_state.score}`,
    }, request.context);
    
    const masteryPlan = this.masteryCoordinator.evaluate(request.context);
    const latency = Date.now() - start;
    
    let output: any = {
      text: aiResponse.text || this.fallbackOutput(request),
      route: aiResponse.route,
      difficulty: getDifficultyLevel(request.context.mastery_state.score),
      retrieved_chunks: chunks,
    };

    if (request.kind === 'quiz_generation') {
      const questions = safeParseQuizArray(aiResponse.text || '');
      output.questions = questions.length > 0 ? questions : [this.fallbackQuestion(request.context.topic_id)];
    }

    Telemetry.emit({
      event: 'PIPELINE_EXECUTED',
      source: 'intelligence',
      canonicalId: request.context.canonical_id,
      userId: request.context.user_id,
      portalType: request.context.portal_type,
      latency,
      operationType: request.kind,
      payload: {
        retrieval_depth: chunks.length,
        ai_route: aiResponse.route,
        cache_efficiency: aiResponse.route === 'cache' ? 1 : 0,
      },
    });

    return {
      kind: request.kind,
      canonical_id: request.context.canonical_id,
      output,
      mastery_plan: masteryPlan,
      telemetry: {
        latency,
        retrieval_depth: chunks.length,
        cache_route: aiResponse.route,
      },
    };
  }

  private fallbackOutput(request: PipelineRequest): string {
    return `Offline ${request.kind.replace(/_/g, ' ')} prepared for ${request.context.topic_id}.`;
  }

  private fallbackQuestion(topic: string) {
    return {
      question: `What is a primary concept related to ${topic}?`,
      options: ['Core principles', 'Unrelated fringe theories', 'Historical footnotes', 'Non-standard interpretations'],
      correctIndex: 0,
      explanation: 'This is a foundational concept.'
    };
  }
}
