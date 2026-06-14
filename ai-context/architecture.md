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

## Adaptive Intelligence Layer (Sprint 4)
The intelligence layer translates raw usage signals into actionable interventions:
- **Mastery & Performance Engines:** Continuously assess topic-level accuracy, response speed, fluency, and overall mastery percentage.
- **Trend Engine:** Takes daily snapshots of performance to detect trajectory (improvement vs. stagnation).
- **Spaced Repetition Engine:** Calculates memory retention curves and predicts forgetting risks.
- **Weakness Prediction Engine:** Aggregates declines in mastery, confidence, and retention to surface quantified learning risks with varying severities (LOW to CRITICAL).
- **Intervention Engine:** Maps identified risks into highly specific, pedagogical next-best-actions (e.g., active recall, targeted remediation).
- **Learning Plan Engine:** Orchestrates interventions into a balanced, time-allocated daily and weekly study plan.

## Learning Identity & Knowledge Graph Layer (Sprint 5 Day 2)
Universal learning system substrate that supports learners from foundational literacy through university and self-directed mastery:
- **Learning Identity Engine** (`lib/learningIdentityEngine.ts`): Models learner profile with learner_type (secondary, university, self_directed, professional, researcher), goals, interests, preferred_learning_style, and target_outcomes. Persisted locally via AsyncStorage and remotely in Supabase `learning_identities` table.
- **Knowledge Graph Engine** (`lib/knowledgeGraphEngine.ts`): Represents knowledge as a directed acyclic graph where nodes are concepts with difficulty levels (1-100), categories (domain/subject/topic/concept), prerequisites, and estimated mastery times. Implements topological sorting for prerequisite resolution.
- **Learning Path Generator** (`generateLearningPath`): Creates personalized learning sequences by:
  1. Identifying target concepts from learner goals/interests via semantic keyword matching
  2. Gathering all required prerequisites recursively
  3. Filtering out already-mastered topics (via mastery threshold ≥80%)
  4. Topologically sorting remaining nodes into an optimal learning sequence
- **Adaptive Level Navigation** (`components/AdaptiveLevelNavigation.tsx`): UI component enabling learners to navigate bidirectionally through the knowledge graph—move "down" to prerequisite foundations or "up" to advanced concepts without portal restrictions.
- **Knowledge Graph Seeds** (`lib/knowledgeGraphSeeds.ts`): Pre-seeded graphs for Mathematics (arithmetic → algebra → calculus), Science (physics, chemistry, biology progression), and CS (logic → programming → AI/ML). Supports arbitrary subject extension.
- **Dashboard Integration:** Active knowledge path exposed in `StudentLearningDashboard` showing current node, path goal, and next learning targets.

## AI Learning Coach Engine (Sprint 5 Day 3)
Transforms EasyTutor from a prediction system into a reasoning system that explains WHY learners succeed or fail and prescribes personalized coaching guidance:
- **Root Cause Analysis** (`analyzeAndCoach`): Detects six classes of learning issues by synthesizing signals from mastery, performance, retention, trends, and knowledge graph:
  1. **Confidence Issues**: Low average confidence, high-mastery/low-confidence mismatches (impostor syndrome), sparse confident topics
  2. **Retention Failures**: Topics with declining retention scores, high-risk knowledge at CRITICAL/HIGH severity
  3. **Mastery Gaps**: Topics below 90% target with declining or stagnant trajectories
  4. **Trend Decline**: Weekly performance trajectory indicating degradation
  5. **Prerequisite Gaps**: Unmastered prerequisites blocking advanced concept progression in knowledge graph
  6. **Behavior Inconsistency**: Irregular practice frequency or session length anomalies
- **Coaching Strategy Generator**: Generates five strategy types with actions and time estimates, ranked by urgency:
  1. **Recovery** (CRITICAL): Targeted intervention on critical-severity weaknesses with prerequisite review
  2. **Review** (HIGH): Spaced repetition schedule (1-day, 3-day, 7-day) for retention rebuilding
  3. **Reinforcement** (MEDIUM): Varied problem-type practice for medium-difficulty topics
  4. **Study** (MEDIUM): Foundational mastery building for unmastered prerequisites
  5. **Acceleration** (LOW): Advanced concept exploration for high-mastery topics
- **Milestone Predictor**: Predicts per-topic mastery timeline by:
  1. Extracting weekly improvement rate from trend data
  2. Computing estimated days: `(target_mastery - current) / daily_improvement_rate`
  3. Adjusting confidence score inversely with timeline duration
  4. Clustering predictions into near-term (< 14 days) and long-term (> 30 days)
- **Personalized Messaging**: Generates contextual coaching narratives by combining:
  - Learner state (identified strengths and weaknesses with root causes)
  - Current trajectory (improving/stable/declining direction)
  - Milestone estimates and achievement probability
  - Top 3 next-best-action recommendations
- **Dashboard Integration**: Coach analysis exposed in `StudentLearningDashboard`:
  - `coaching_summary`: Narrative explanation of learner state and direction
  - `recommendations`: Ranked list of personalized actions with expected outcomes
  - `next_actions`: Top 3 immediate steps to boost learning health
  - `learning_health_trajectory`: Direction indicator (improving/stable/declining/critical)
  - `confidence_in_analysis`: 0-100 metric increasing with data availability and consistency

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
