import { getSupabaseClient } from './supabaseOps';
import { generateEmbedding } from './embeddings';
import { rankAndFilterChunks, RetrievalChunk } from './retrieval/ranking';
import { globalTracer, generateTraceId } from '../observability/tracing/trace';

export const retrieveRelevantChunks = async (
  query: string,
  options: { minSimilarity?: number; maxChunks?: number } = {}
): Promise<RetrievalChunk[]> => {
  const traceId = generateTraceId();
  globalTracer.startSpan(traceId, 'RETRIEVAL', { query });
    
  try {
    const supabase = getSupabaseClient();
    const embedding = await generateEmbedding(query);

    const { data, error } = await supabase.rpc(
      'match_document_chunks',
      {
        query_embedding: embedding,
        match_count: 15, // Increase pool for better ranking
        min_similarity: options.minSimilarity ?? 0.0
      }
    );

    if (error) {
      throw error;
    }

    const rawChunks: RetrievalChunk[] = (data || []).map((row: any) => ({
      content: row.content,
      similarity: row.similarity,
      metadata: row.metadata
    }));

    const results = rankAndFilterChunks(rawChunks, options.minSimilarity, options.maxChunks);
    globalTracer.endSpan(traceId, 'RETRIEVAL');
    return results;

  } catch (err) {
    globalTracer.endSpan(traceId, 'RETRIEVAL');
    console.error('[RETRIEVAL ERROR]', err);
    return [];
  }
};
