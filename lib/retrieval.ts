import { getSupabaseClient } from './supabaseOps';
import { generateEmbedding } from './embeddings';
import { rankAndFilterChunks, RetrievalChunk } from './retrieval/ranking';
import {
  assertRetrievalContext,
  buildRetrievalPolicy,
  GovernedRetrievalContext,
} from '../src/infrastructure/database';

interface RetrievalRow {
  content: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

export const retrieveRelevantChunks = async (
  query: string,
  context: GovernedRetrievalContext,
  options: { minSimilarity?: number; maxChunks?: number } = {}
): Promise<RetrievalChunk[]> => {
  const retrievalContext = assertRetrievalContext(context);
  const policy = buildRetrievalPolicy(retrievalContext, options);
    
  try {
    const supabase = getSupabaseClient();
    const embedding = await generateEmbedding(query);

    const { data, error } = await supabase.rpc(
      'match_document_chunks',
      {
        query_embedding: embedding,
        match_count: Math.max(policy.matchCount, 15),
        min_similarity: policy.minSimilarity,
        portal_type: policy.portalType,
        taxonomy_scope: policy.taxonomyScope,
        curriculum_scope: policy.curriculumScope,
        school_scope: policy.schoolScope,
        vector_namespace: policy.vectorNamespace
      }
    );

    if (error) {
      throw error;
    }

    const rawRows = (data ?? []) as RetrievalRow[];
    const rawChunks: RetrievalChunk[] = rawRows.map((row) => ({
      content: row.content,
      similarity: row.similarity,
      metadata: row.metadata
    }));

    const results = rankAndFilterChunks(rawChunks, options.minSimilarity, options.maxChunks);
    return results;

  } catch (err) {
    console.error('[RETRIEVAL ERROR]', err);
    return [];
  }
};
