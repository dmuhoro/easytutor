# Architecture: EasyTutor

## System Overview
EasyTutor is built as a cross-platform mobile application using **React Native** and **Expo SDK 55**. It follows a local-first, AI-enhanced architecture with a Supabase backend for persistence and synchronization.

## Portal Architecture (Expo Router)
The app uses **Expo Router** to manage distinct portals:
- `app/(auth)/`: Authentication flows.
- `app/(high_school)/`: KICD-aligned portal.
- `app/(university)/`: Degree-level portal.
- `app/(self_directed)/`: Goal-driven mission control.
- `app/(tabs)/`: Main navigation and dashboard.

## Hybrid AI Routing
The system implements a hybrid routing strategy to balance performance, cost, and reliability:
- **Offline Mode:** Uses a local **Ollama** instance (`qwen2.5-coder:1.5b`) for low-complexity generations.
- **Online Mode:** Uses **Anthropic (Claude 3.5 Sonnet)** or **Groq (Llama 3.1)** for high-complexity reasoning and roadmap generation.
- **Routing Logic (`shouldUseCloud`):** Requests are routed to the cloud if the complexity is 'high' (mastery > 70%) or the prompt length exceeds 4000 characters.

## RAG & Semantic Search
- **Embeddings:** Generated locally via Ollama (`qwen2.5-coder:1.5b`) at `http://localhost:11434/api/embeddings`.
- **Vector Storage:** Document chunks and their embeddings are stored in Supabase using the **pgvector** extension.
- **Retrieval:** Semantic search is performed using the `match_document_chunks` RPC in Supabase, calculating cosine similarity between the query embedding and stored chunks.

## Cache Layers
- **Persistent Cache:** `AsyncStorage` stores AI-generated explanations and quiz questions for offline availability.
- **Memory Cache:** A `Map`-based cache with a maximum size of 50 items for near-instant access to recent generations.
- **Preloading:** The `preloadQuizCache` utility populates the cache for initial offline usage.

## Session Intelligence & Adaptive Learning
- **Difficulty Adjustment:** The `adjustDifficulty` utility dynamically changes quiz difficulty based on student streaks (correct/wrong).
- **Batching:** Session length is adjusted based on student performance to prevent burnout.
- **Mastery Tracking:** Progress is tracked per topic and aggregated to determine overall subject proficiency.

## System Boundaries & Ownership
- `lib/`: Domain logic, AI orchestration, and database operations.
- `components/`: Reusable UI elements (`SubjectGrid`, `QuizEngine`, `TopicList`).
- `store/`: Zustand stores for client-side state (auth, roadmaps, habits).
- `supabase/migrations/`: Source of truth for database schema and RLS policies.

## Invariants
1. **Zod Validation:** All AI JSON responses must be validated against Zod schemas before being used in the UI.
2. **RLS Enforcement:** No direct database reads/writes without an authenticated session and proper RLS policy checks.
3. **Graceful Degradation:** AI features must fallback to local Ollama or cached content during network interruptions.
4. **Deterministic IDs:** Subject and Topic IDs must be resolved using a unified logic to ensure cross-portal consistency.
