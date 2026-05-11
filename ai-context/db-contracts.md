# Database Contracts: EasyTutor

## Core Tables & Schema

### `profiles`
- **id:** UUID (PK, references auth.users).
- **email:** TEXT (NOT NULL).
- **learning_mode:** TEXT (CHECK: 'high_school', 'university', 'self_directed').
- **onboarding_complete:** BOOLEAN (DEFAULT FALSE).
- **level:** INTEGER (DEFAULT 1).
- **xp_total:** INTEGER (DEFAULT 0).
- **current_streak:** INTEGER (DEFAULT 1).
- **last_active_date:** DATE (DEFAULT CURRENT_DATE).
- **streak_freezes:** INTEGER (DEFAULT 1).
- **RLS:** Users can only view/update their own profile.

### `subjects`
- **id:** TEXT (PK, default UUID string).
- **name:** TEXT (NOT NULL).
- **level:** TEXT (NOT NULL, CHECK: 'high_school', 'university', 'self_directed').
- **icon:** TEXT.
- **description:** TEXT.
- **kicd_ref:** TEXT (for High School portal).
- **UNIQUE:** (name, level) - enables idempotent upserts.
- **RLS:** Publicly readable.

### `topics`
- **id:** UUID (PK).
- **subject_id:** TEXT (FK references subjects.id).
- **title:** TEXT (NOT NULL).
- **subtopics:** JSONB.
- **form_level:** TEXT (e.g., 'Form 1').
- **sort_order:** INTEGER.
- **UNIQUE:** (subject_id, title) - enables idempotent upserts.
- **RLS:** Publicly readable.

### `user_progress`
- **id:** UUID (PK).
- **user_id:** UUID (FK references profiles.id).
- **topic_id:** UUID (FK references topics.id).
- **mastery_level:** INTEGER (0-100).
- **attempts:** INTEGER.
- **correct_answers:** INTEGER.
- **last_activity:** TIMESTAMPTZ.
- **RLS:** Users can only access their own progress data.

### `user_events` (AI Interactions & Tracking)
- **id:** UUID (PK).
- **user_id:** UUID (FK references profiles.id).
- **event_type:** TEXT.
- **payload:** JSONB.
- **created_at:** TIMESTAMPTZ.

### `documents` & `document_chunks` (RAG)
- **documents:** Store title, user_id, and metadata.
- **document_chunks:** Store content and `embedding` (vector(384)).
- **RPC:** `match_document_chunks` for cosine similarity search.

## Invariants & Rules
1. **Deterministic IDs:** Subject IDs must be resolved using name + level hashes if not explicitly provided, ensuring portal consistency.
2. **Cascading Deletes:** Subjects → Topics → Progress must use `ON DELETE CASCADE`.
3. **Audit Trail:** All meaningful AI generations should be logged in `user_events`.
4. **Vector Consistency:** Embeddings must be 384-dimensional to match the local `qwen2.5-coder:1.5b` output.
