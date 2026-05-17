# Roadmap: EasyTutor Evolution

## Phase 1: Launch Hardening (Current)
- [x] Implement Global Error Boundaries.
- [x] Centralize Loading States.
- [x] Add Network Safety Utilities (Retries, Timeouts, Deduplication).
- [x] Fix TypeScript build errors and failing tests.
- [x] Finalize Semantic RAG implementation.
- [x] Establish executable database governance wrappers and retrieval context contracts.
- [x] Establish Learning Orchestration Engine command layer for runtime context, pipelines, AI routing, mastery coordination, and prefetch.

## Phase 2: Beta Launch & Performance (Immediate)
- **Omega.2 Raw Access Migration:** Convert remaining governance-audit raw Supabase candidates to governed query/write services.
- **Omega.3 UI Integration:** Move screen-level learning flow assembly behind `learningOrchestrator` entry points.
- **Batch Ingestion Optimization:** Move document processing to a background worker or optimize chunking loops.
- **Deterministic Subject IDs:** Migration to resolve data consistency issues across portals.
- **Advanced Mastery Dashboard:** Visualizing progress with mastery distribution curves.
- **Real-world QA:** Testing on physical iOS and Android devices.

## Phase 3: Scaling & Intelligence
- **On-device Inference:** Research and implementation of lightweight on-device LLMs to remove localhost dependency.
- **HNSW Vector Indexing:** Optimize semantic search for high-volume document libraries.
- **Multi-Agent Tutoring:** Introducing specialized AI agents for specific academic domains.
- **Predictive Analytics:** Forecasting student exam performance based on current learning trends.

## Phase 4: Platform & Monetization
- **B2B School Portal:** Multi-tenant dashboard for teachers to track class progress.
- **Subscription Model:** Premium tiers for unlimited cloud AI usage and advanced degree content.
- **AI Operating System Evolution:** Turning the EasyTutor core into a licenseable SDK for other educational apps.

## Future Vision
To become the definitive "Professor in your pocket" that supports a learner from basic literacy to professional degree mastery, regardless of internet connectivity.
