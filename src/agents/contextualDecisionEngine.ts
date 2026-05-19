import { AgentExecutionContext, ExecutionNode } from './agenticContracts';

export interface ContextualDecision {
  node_id: string;
  execute_now: boolean;
  preferred_mode: 'offline' | 'local' | 'cloud' | 'hybrid';
  rationale: string;
}

export class ContextualDecisionEngine {
  decide(node: ExecutionNode, context: AgentExecutionContext): ContextualDecision {
    const preferred_mode = context.offline_available && node.kind !== 'governance'
      ? 'offline'
      : node.kind === 'retrieval'
        ? 'hybrid'
        : 'local';

    const execute_now = node.attempts < context.execution_budget.max_retries;

    return {
      node_id: node.node_id,
      execute_now,
      preferred_mode,
      rationale: `budget:${context.execution_budget.max_runtime_ms};offline:${context.offline_available}`,
    };
  }
}
