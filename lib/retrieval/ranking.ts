export interface RetrievalChunk {
  content: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

/**
 * Ranks and filters retrieved chunks to ensure semantic continuity and quality.
 */
export const rankAndFilterChunks = (
  chunks: RetrievalChunk[],
  minSimilarity = 0.4,
  maxChunks = 5
): RetrievalChunk[] => {
  // 1. Filter by minimum similarity
  let filtered = chunks.filter((c) => c.similarity >= minSimilarity);

  // 2. Deduplicate based on content
  const seen = new Set<string>();
  filtered = filtered.filter((c) => {
    if (seen.has(c.content)) return false;
    seen.add(c.content);
    return true;
  });

  // 3. Sort by original document order if metadata.index is present
  // This preserves semantic continuity when chunks are from the same document.
  filtered.sort((a, b) => {
    const leftIndex = typeof a.metadata?.index === 'number' ? a.metadata.index : null;
    const rightIndex = typeof b.metadata?.index === 'number' ? b.metadata.index : null;
    if (leftIndex !== null && rightIndex !== null) {
      return leftIndex - rightIndex;
    }
    return b.similarity - a.similarity;
  });

  return filtered.slice(0, maxChunks);
};

/**
 * Assembles a clean context string from ranked chunks.
 */
export const assembleContext = (chunks: RetrievalChunk[]): string => {
  return chunks
    .map((c, i) => `[Segment ${i + 1}]:\n${c.content}`)
    .join('\n\n---\n\n');
};
