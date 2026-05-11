import { describe, it, expect } from 'vitest';
import { SemanticChunker } from '../../lib/chunking/semanticChunker';

describe('SemanticChunker', () => {
  it('splits text at paragraph boundaries', () => {
    const text = "Paragraph 1\n\nParagraph 2\n\nParagraph 3";
    const chunker = new SemanticChunker({ chunkSize: 15, chunkOverlap: 0 });
    const chunks = chunker.split(text);
    
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0]).toContain("Paragraph 1");
  });

  it('maintains overlap between chunks', () => {
    const text = "First part of the text. Second part of the text. Third part of the text.";
    const chunker = new SemanticChunker({ chunkSize: 50, chunkOverlap: 10 });
    const chunks = chunker.split(text);
    
    expect(chunks.length).toBeGreaterThan(1);
    const firstChunkEnd = chunks[0].slice(-10);
    expect(chunks[1].startsWith(firstChunkEnd)).toBe(true);
  });

  it('handles small text without splitting', () => {
    const text = "Small text";
    const chunker = new SemanticChunker({ chunkSize: 100 });
    const chunks = chunker.split(text);
    
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it('recursively splits large blocks', () => {
    const text = "A very long paragraph without any newlines but with some sentences. It should be split at sentence boundaries if possible. Otherwise it will split at spaces.";
    const chunker = new SemanticChunker({ chunkSize: 50, chunkOverlap: 0 });
    const chunks = chunker.split(text);
    
    expect(chunks.length).toBeGreaterThan(1);
    // Check if splits happened at sentences or spaces
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(50);
    });
  });
});
