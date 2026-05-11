import { getSupabaseClient } from './supabaseOps';
import { generateEmbedding } from './embeddings';

export const storeChunks = async ({
  documentId,
  chunks
}: {
  documentId: string;
  chunks: string[];
}) => {
  try {
    const supabase = getSupabaseClient();
    await Promise.all(
      chunks.map(async (content) => {
        const embedding = await generateEmbedding(content);
        await supabase.from('document_chunks').insert({
          document_id: documentId,
          content,
          embedding
        });
      })
    );

    console.log('[KNOWLEDGE] Stored');

  } catch (err) {
    console.error('[KNOWLEDGE ERROR]', err);
  }
};
