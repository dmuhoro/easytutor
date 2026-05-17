import { getMemoryCachedResponse, setMemoryCachedResponse } from '../../../lib/cache';
import { Telemetry } from '../../observability/telemetry';
import { RuntimeContext } from '../runtime/runtimeContext';
import { CloudLLMRouter } from './cloudLLMRouter';
import { LLMRequest, LLMResponse, LocalLLMRouter } from './localLLMRouter';

export interface HybridRouteDecision {
  route: LLMResponse['route'] | 'escalate';
  reason: string;
}

export class HybridInferenceRouter {
  constructor(
    private readonly localRouter = new LocalLLMRouter(),
    private readonly cloudRouter = new CloudLLMRouter(),
  ) {}

  decide(request: LLMRequest, context: RuntimeContext): HybridRouteDecision {
    if (context.cache_policy.mode !== 'bypass' && getMemoryCachedResponse(request.cacheKey)) {
      return { route: 'cache', reason: 'semantic-cache-hit' };
    }
    if (context.connectivity_state === 'offline') {
      return { route: 'local', reason: 'offline-local-only' };
    }
    if (context.ai_execution_mode === 'local') {
      return { route: 'local', reason: 'runtime-forced-local' };
    }
    if (context.ai_execution_mode === 'cloud') {
      return { route: 'cloud', reason: 'runtime-forced-cloud' };
    }
    if (request.complexity === 'high' || context.mastery_state.score >= 70) {
      return { route: 'cloud', reason: 'high-complexity-or-advanced-mastery' };
    }

    return { route: 'local', reason: 'low-latency-default' };
  }

  async execute(request: LLMRequest, context: RuntimeContext): Promise<LLMResponse> {
    const start = Date.now();
    const decision = this.decide(request, context);

    if (decision.route === 'cache') {
      const cached = getMemoryCachedResponse(request.cacheKey) as string;
      Telemetry.emit({
        event: 'CACHE_HIT',
        source: 'intelligence',
        canonicalId: context.canonical_id,
        userId: context.user_id,
        portalType: context.portal_type,
        latency: Date.now() - start,
        operationType: 'AI_CACHE_LOOKUP',
        payload: { route_reason: decision.reason },
      });
      return {
        text: cached,
        route: 'cache',
        confidence: 0.95,
        tokenUsage: { prompt: 0, completion: Math.ceil(cached.length / 4) },
      };
    }

    const response = decision.route === 'cloud'
      ? await this.cloudRouter.execute(request, context)
      : await this.localRouter.execute(request, context);

    const finalResponse = response.confidence < 0.4 && context.connectivity_state !== 'offline'
      ? await this.cloudRouter.execute({ ...request, complexity: 'high' }, context)
      : response;

    if (finalResponse.text) {
      setMemoryCachedResponse(request.cacheKey, finalResponse.text);
    }

    Telemetry.emit({
      event: finalResponse.route === 'offline_fallback' ? 'OFFLINE_FALLBACK' : 'AI_ROUTED',
      source: 'intelligence',
      canonicalId: context.canonical_id,
      userId: context.user_id,
      portalType: context.portal_type,
      latency: Date.now() - start,
      operationType: 'AI_ROUTING',
      payload: {
        route: finalResponse.route,
        decision: decision.reason,
        confidence: finalResponse.confidence,
        prompt_tokens: finalResponse.tokenUsage.prompt,
        completion_tokens: finalResponse.tokenUsage.completion,
      },
    });

    return finalResponse;
  }
}
