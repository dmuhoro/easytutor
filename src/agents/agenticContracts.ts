import { PortalType } from '../types/canonical';

export type AgentRole =
  | 'orchestrator'
  | 'tutor'
  | 'retrieval'
  | 'memory'
  | 'remediation'
  | 'assessment'
  | 'planner'
  | 'governance';

export type ExecutionNodeKind =
  | 'analysis'
  | 'retrieval'
  | 'memory'
  | 'tutoring'
  | 'assessment'
  | 'governance'
  | 'coordination'
  | 'repair';

export type ExecutionStatus =
  | 'planned'
  | 'ready'
  | 'running'
  | 'waiting'
  | 'recovering'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled';

export interface AgentGoal {
  goal_id: string;
  title: string;
  description: string;
  success_criteria: readonly string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  horizon: 'immediate' | 'session' | 'long_horizon';
  constraints?: {
    deterministic?: boolean;
    offline_required?: boolean;
    max_steps?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionBudget {
  max_steps: number;
  max_runtime_ms: number;
  max_retries: number;
  max_memory_reads: number;
  max_memory_writes: number;
}

export interface AgentExecutionContext {
  portal_type: PortalType;
  learner_id: string;
  session_id: string;
  canonical_id: string;
  user_id?: string;
  deterministic_seed: string;
  telemetry_correlation_id: string;
  offline_available: boolean;
  execution_budget: ExecutionBudget;
  governance_tags: readonly string[];
  memory_namespace: string;
  state_version: number;
  metadata?: Record<string, unknown>;
}

export interface ExecutionCheckpoint {
  checkpoint_id: string;
  node_id: string;
  status: ExecutionStatus;
  created_at: string;
  snapshot: Record<string, unknown>;
}

export interface ExecutionNode {
  node_id: string;
  title: string;
  description: string;
  kind: ExecutionNodeKind;
  role: AgentRole;
  depends_on: readonly string[];
  status: ExecutionStatus;
  attempts: number;
  max_attempts: number;
  checkpoint_key: string;
  deterministic_order: number;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
}

export interface ExecutionPlan {
  plan_id: string;
  goal: AgentGoal;
  context: AgentExecutionContext;
  status: ExecutionStatus;
  created_at: string;
  updated_at: string;
  nodes: ExecutionNode[];
  checkpoints: ExecutionCheckpoint[];
  resume_cursor: number;
}

export interface AgentTaskResult {
  node_id: string;
  role: AgentRole;
  success: boolean;
  summary: string;
  output?: unknown;
  telemetry?: Record<string, unknown>;
  warnings?: readonly string[];
}

export interface ReasoningStepRecord {
  step_id: string;
  node_id: string;
  summary: string;
  evidence: readonly string[];
  assumptions: readonly string[];
  validator_status: 'pending' | 'validated' | 'flagged';
  derived_from: readonly string[];
}

export interface MemoryAccessRequest {
  namespace: string;
  portal_type: PortalType;
  actor_role: AgentRole;
  operation: 'read' | 'write' | 'consolidate';
  memory_kind: 'episodic' | 'semantic' | 'procedural';
  key?: string;
}

export interface MemoryRecord<T = Record<string, unknown>> {
  memory_id: string;
  namespace: string;
  portal_type: PortalType;
  learner_id: string;
  created_at: string;
  updated_at: string;
  importance: number;
  content: T;
  tags: readonly string[];
}

export interface AgentMessage {
  message_id: string;
  from: AgentRole;
  to: AgentRole;
  portal_type: PortalType;
  intent: 'request' | 'response' | 'proposal' | 'decision' | 'alert';
  payload: Record<string, unknown>;
  correlation_id: string;
  created_at: string;
}

export interface AgentProposal {
  proposal_id: string;
  role: AgentRole;
  decision: 'approve' | 'revise' | 'reject';
  rationale: string;
  confidence: number;
}

export const deterministicId = (...parts: readonly (string | number)[]): string =>
  parts
    .map((part) => String(part).trim().replace(/[^a-zA-Z0-9_-]+/g, '_'))
    .join('__');

export const priorityWeight = (priority: AgentGoal['priority']): number => {
  switch (priority) {
    case 'critical':
      return 1;
    case 'high':
      return 0.8;
    case 'medium':
      return 0.5;
    default:
      return 0.25;
  }
};
