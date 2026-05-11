/**
 * SemanticChunker: A recursive text splitting engine for academic documents.
 * Preserves structural integrity (headings, paragraphs, sentences).
 */

export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
}

export interface TextChunk {
  content: string;
  metadata: {
    index: number;
    hash: string;
    length: number;
  };
}

export class SemanticChunker {
  private options: ChunkOptions;
  private defaultSeparators = ["\n\n", "\n", ". ", "! ", "? ", " ", ""];

  constructor(options: Partial<ChunkOptions> = {}) {
    this.options = {
      chunkSize: options.chunkSize ?? 1000,
      chunkOverlap: options.chunkOverlap ?? 200,
      separators: options.separators ?? this.defaultSeparators,
    };
  }

  private generateHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash.toString(36);
  }

  public split(text: string): string[] {
    const rawChunks = this.recursiveSplit(text, this.options.separators!);
    return this.applyOverlap(rawChunks);
  }

  private recursiveSplit(text: string, separators: string[]): string[] {
    if (text.length <= this.options.chunkSize) {
      return [text];
    }

    // Find the best separator
    let separator: string | null = null;
    let nextSeparators: string[] = [];

    for (let i = 0; i < separators.length; i++) {
      const s = separators[i];
      if (text.includes(s)) {
        separator = s;
        nextSeparators = separators.slice(i + 1);
        break;
      }
    }

    // If no separator found, hard split
    if (separator === null) {
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += this.options.chunkSize) {
        chunks.push(text.slice(i, i + this.options.chunkSize));
      }
      return chunks;
    }

    const parts = text.split(separator);
    const result: string[] = [];
    let current = "";

    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];
      // Add separator back if not the last part
      if (i < parts.length - 1) {
        part += separator;
      }

      if ((current + part).length <= this.options.chunkSize) {
        current += part;
      } else {
        if (current) {
          result.push(current);
        }

        if (part.length > this.options.chunkSize) {
          const subChunks = this.recursiveSplit(part, nextSeparators);
          // Add all but the last sub-chunk to results
          if (subChunks.length > 1) {
            result.push(...subChunks.slice(0, -1));
          }
          current = subChunks[subChunks.length - 1];
        } else {
          current = part;
        }
      }
    }

    if (current) {
      result.push(current);
    }

    return result;
  }

  private applyOverlap(chunks: string[]): string[] {
    if (this.options.chunkOverlap <= 0 || chunks.length <= 1) {
      return chunks;
    }

    const overlapped: string[] = [chunks[0]];

    for (let i = 1; i < chunks.length; i++) {
      const prev = chunks[i - 1];
      const curr = chunks[i];
      const overlap = prev.slice(-this.options.chunkOverlap);
      
      // Ensure overlap doesn't exceed chunkSize
      if ((overlap + curr).length <= this.options.chunkSize) {
        overlapped.push(overlap + curr);
      } else {
        overlapped.push(curr);
      }
    }

    return overlapped;
  }

  public createChunks(text: string): TextChunk[] {
    const rawChunks = this.split(text);
    return rawChunks.map((content, index) => ({
      content: content.trim(),
      metadata: {
        index,
        hash: this.generateHash(content),
        length: content.length,
      },
    }));
  }
}
