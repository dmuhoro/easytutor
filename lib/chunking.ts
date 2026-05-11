import { SemanticChunker } from './chunking/semanticChunker';

export const chunkText = (
  text: string,
  chunkSize = 1000,
  chunkOverlap = 200
) => {
  const chunker = new SemanticChunker({ chunkSize, chunkOverlap });
  return chunker.split(text);
};

export { SemanticChunker, TextChunk } from './chunking/semanticChunker';
