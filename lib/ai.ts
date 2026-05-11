import { askTutor } from './api';
import { getSupabaseClient } from './supabaseOps';
import { getAIProvider, AI_PROVIDER, shouldUseCloud } from './aiProvider';
import { generateOfflineResponse } from './ollama';
import { generateCloudResponse } from './cloud';
import { getMemoryCachedResponse, setMemoryCachedResponse } from './cache';
import { measurePerformance } from './performance';
import { deduplicateRequest, retryAsync, withTimeout } from './network';
import { globalTracer, generateTraceId } from '../observability/tracing/trace';

export interface ExplanationParams {
  topicTitle: string;
  masteryLevel: number;
  subjectId: string;
}

/**
 * Generates a personalized explanation for a topic based on student mastery.
 */
export const generateExplanation = async ({
  topicTitle,
  masteryLevel,
  subjectId
}: ExplanationParams): Promise<string> => {
  const traceId = generateTraceId();
  globalTracer.startSpan(traceId, 'AI_GENERATION', { topic: topicTitle, masteryLevel: String(masteryLevel) });

  try {
    const systemPrompt = `You are a world-class tutor specializing in ${subjectId}.`;
    
    const prompt = `
Explain the topic: "${topicTitle}"

Context:
- Student mastery: ${masteryLevel}%
- Subject: ${subjectId}

Rules:
- If mastery < 40 → explain like beginner (use simple analogies, foundational concepts)
- If mastery 40–70 → intermediate depth (include technical terms, process explanations)
- If mastery > 70 → advanced explanation (deep dive into edge cases, complex relationships)

Keep it:
- clear
- structured
- concise
- example-driven
`;

    console.log('[AI] generating explanation', { topicTitle, masteryLevel });
    
    const cached = getMemoryCachedResponse(prompt);
    if (cached) {
      console.log('[CACHE HIT]');
      return cached;
    }

    const provider = getAIProvider();

    let responseText = '';

    if (provider === AI_PROVIDER.OFFLINE) {
      responseText = await measurePerformance('AI_GENERATION', async () => {
        return deduplicateRequest(`ai_${topicTitle}`, async () => {
          return retryAsync(async () => {
            return withTimeout(
              (async () => {
                if (
                  shouldUseCloud({
                    promptLength: prompt.length,
                    complexity: masteryLevel > 70 ? 'high' : 'normal'
                  })
                ) {
                  return await generateCloudResponse(prompt);
                }
                return await generateOfflineResponse(prompt);
              })(),
              15000,
              '[AI TIMEOUT] Offline AI Generation took too long'
            );
          }, 3);
        });
      });
    } else {
      responseText = await measurePerformance('AI_GENERATION_ONLINE', async () => {
        return deduplicateRequest(`ai_online_${topicTitle}`, async () => {
          return retryAsync(async () => {
            return withTimeout(
              (async () => {
                const response = await askTutor(systemPrompt, [{ role: 'user', content: prompt }]);

                if (!response.success || !response.data) {
                  throw new Error(response.error || 'Online AI failed');
                }
                return response.data;
              })(),
              15000,
              '[AI TIMEOUT] Online AI Generation took too long'
            );
          }, 3);
        });
      });
    }

    if (responseText) {
      setMemoryCachedResponse(prompt, responseText);
    }
    
    globalTracer.endSpan(traceId, 'AI_GENERATION');
    return responseText;

  } catch (err) {
    globalTracer.endSpan(traceId, 'AI_GENERATION');
    console.error('[ERROR] [AI]', err);
    return '';
  }
};

/**
 * Logs AI interactions for future optimization.
 */
export const logAIEvent = async ({
  userId,
  type,
  payload
}: {
  userId: string;
  type: string;
  payload: any;
}) => {
  try {
    const supabase = getSupabaseClient();
    
    // Using user_events table for tracking AI interactions
    const { error } = await supabase.from('user_events').insert({
      user_id: userId,
      event_type: type,
      payload,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('[ERROR] [AI LOG] Failed to log AI event', error);
    } else {
      console.log('[AI] logged interaction', { type });
    }
  } catch (err) {
    console.error('[ERROR] [AI LOG]', err);
  }
};
