# Engineering Lessons Learned

## RAG & Retrieval
- **Local Embedding Latency:** Initial local Ollama embedding requests can be slow (>5s). Always implement a UI loading state or pre-warm the model.
- **Chunking Logic:** Character-based chunking is prone to semantic fragmentation. Sentence-boundary chunking is mandatory for high-quality RAG.

## AI Resilience
- **Deduplication:** Always deduplicate AI requests for the same topic to prevent token waste and UI flickering.
- **Circuit Breakers:** Implement hard timeouts (15s) for all AI generations to prevent app hangs.

## Recursive Chunking
- **Separator Ordering:** Always place `\n\n` before `\n`. Splitting by lines before paragraphs leads to semantic fragmentation.
- **Overlap & Size:** Overlap should be ~20% of chunk size to provide sufficient boundary context for semantic retrieval.

## Batch Processing
- **Type Safety:** Explicitly type generic batch processors to prevent 'unknown' type errors in large pipelines.
- **Concurrency:** Limit batch concurrency to 1 if the backend (local Ollama) is single-threaded to prevent request queuing latency.
