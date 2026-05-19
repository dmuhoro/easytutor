/**
 * EASYTUTOR CANONICAL TYPE SYSTEM
 * 
 * This file is the single source of truth for all domain entities.
 * No duplicate interfaces allowed across the codebase.
 */

export type PortalType = 'high_school' | 'university' | 'knowledge_explorer';

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * KNOWLEDGE ARCHITECTURE
 */

export interface RetrievalMetadata {
  namespace: string;
  curriculum_scope: string;
  taxonomy_scope: string;
  school_scope?: string;
}

export interface CanonicalContentNode {
  canonical_id: string;
  portal_type: PortalType;
  taxonomy_path: readonly string[];
  retrieval_metadata: RetrievalMetadata;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  mastery_weight: number;
  retrieval_priority?: number;
  vector_namespace: string;
}

export interface KnowledgeNode {
  id: string; // Canonical ID: HS-MATH-ALG-001
  title: string;
  portal_type: PortalType;
  metadata?: Record<string, unknown>;
}

export interface SubjectNode extends KnowledgeNode {
  description?: string;
  icon?: string;
}

export interface TopicNode extends KnowledgeNode {
  subject_id: string;
  mastery_level?: number;
}

export interface SubtopicNode extends KnowledgeNode {
  topic_id: string;
  content_type: 'lesson' | 'quiz' | 'resource';
}

/**
 * INTELLIGENCE & ADAPTIVE TYPES
 */

export interface MasteryRecord {
  user_id: string;
  node_id: string;
  portal_type: PortalType;
  mastery_score: number; // 0 - 100
  attempts: number;
  last_activity: string;
}

export interface AIRequest {
  request_id: string;
  user_id: string;
  portal_type: PortalType;
  context: RetrievalContext;
  prompt_params: Record<string, unknown>;
}

export interface RetrievalContext {
  portal_type: PortalType;
  curriculum_scope?: string;
  taxonomy_scope?: string;
  school_scope?: string;
  knowledge_scope?: string;
  mastery_level?: number;
  user_goal?: string;
  active_path?: readonly string[];
  user_context?: string | null;
  limit?: number;
}

/**
 * OBSERVABILITY & TELEMETRY
 */

export type TelemetryEventType = string;

export interface TelemetryEvent {
  event_type: TelemetryEventType;
  timestamp: string;
  user_id: string;
  portal_type: PortalType;
  content_id?: string;
  canonical_id?: string;
  latency?: number;
  operation_type?: string;
  source_layer:
    | 'ui'
    | 'portal'
    | 'intelligence'
    | 'knowledge'
    | 'infrastructure'
    | 'core'
    | 'runtime'
    | 'agent'
    | 'lifecycle'
    | 'reasoning'
    | 'execution'
    | 'healing'
    | 'memory'
    | 'autonomy'
    | 'multiagent'
    | 'orchestrator'
    | 'platform';
  payload?: Record<string, unknown>;
}
