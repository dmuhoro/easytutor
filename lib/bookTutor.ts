import { retrieveRelevantChunks } from './retrieval';
import { generateOfflineResponse } from './ollama';
import { generateCloudResponse } from './cloud';
import { shouldUseCloud } from './aiProvider';
import { measurePerformance } from './performance';
import { getMemoryCachedResponse, setMemoryCachedResponse } from './cache';
import { deduplicateRequest, retryAsync, withTimeout } from './network';

export const askBookTutor = async ({
  question
}: {
  question: string;
}) => {
  try {
    const cached = getMemoryCachedResponse(question);
    if (cached) {
      console.log('[CACHE HIT]');
      return cached;
    }

    const chunks = await measurePerformance('RETRIEVAL', async () => {
      return await retrieveRelevantChunks(question);
    });

    const context = chunks
      .map((c: any) => c.content)
      .join('\n');

    const prompt = `
Use this study material:

${context.slice(0, 3000)}

Answer this question:

${question}
`;

    const responseText = await measurePerformance('AI_BOOK_TUTOR', async () => {
      return deduplicateRequest(`book_${question}`, async () => {
        return retryAsync(async () => {
          return withTimeout(
            (async () => {
              if (
                shouldUseCloud({
                  promptLength: prompt.length,
                  complexity: 'normal'
                })
              ) {
                return await generateCloudResponse(prompt);
              }
              return await generateOfflineResponse(prompt);
            })(),
            15000,
            '[AI TIMEOUT] Tutor generation took too long'
          );
        }, 3);
      });
    });

    if (responseText) {
      setMemoryCachedResponse(question, responseText);
    }

    return responseText;

  } catch (err) {
    console.error('[ERROR] [BOOK TUTOR FALLBACK]', err);
    return 'I seem to be having trouble connecting to my knowledge base right now. Please try again later.';
  }
};
