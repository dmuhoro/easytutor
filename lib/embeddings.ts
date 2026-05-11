import { getLocalAIEndpoint } from './bridge/localNetwork';

export const generateEmbedding = async (
  text: string
): Promise<number[]> => {
  try {
    const endpoint = getLocalAIEndpoint();
    const res = await fetch(
      `${endpoint}/api/embeddings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen2.5-coder:1.5b',
          prompt: text
        })
      }
    );

    const data = await res.json();

    return data.embedding || [];

  } catch (err) {
    console.error('[EMBEDDING ERROR]', err);

    return [];
  }
};
