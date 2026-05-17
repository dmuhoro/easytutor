import { generateOfflineResponse } from '../../../lib/ollama';
import { deduplicateRequest, retryAsync, withTimeout } from '../../../lib/network';
import { SYSTEM_CONFIG } from '../../config/registry';
import { RuntimeContext } from '../runtime/runtimeContext';

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  complexity: 'low' | 'normal' | 'high';
  cacheKey: string;
}

export interface LLMResponse {
  text: string;
  route: 'cache' | 'local' | 'cloud' | 'offline_fallback';
  confidence: number;
  tokenUsage: {
    prompt: number;
    completion: number;
  };
}

const estimateTokens = (value: string): number => Math.ceil(value.length / 4);

export class LocalLLMRouter {
  async execute(request: LLMRequest, _context: RuntimeContext): Promise<LLMResponse> {
    const text = await deduplicateRequest(`local_${request.cacheKey}`, async () => retryAsync(
      async () => withTimeout(
        generateOfflineResponse(request.prompt),
        SYSTEM_CONFIG.AI.DEFAULT_TIMEOUT_MS,
        '[AI TIMEOUT] Local LLM execution took too long',
      ),
      SYSTEM_CONFIG.AI.RETRY_ATTEMPTS,
    ));

    return {
      text,
      route: text ? 'local' : 'offline_fallback',
      confidence: text.length > 0 ? 0.72 : 0.2,
      tokenUsage: {
        prompt: estimateTokens(request.prompt),
        completion: estimateTokens(text),
      },
    };
  }
}
