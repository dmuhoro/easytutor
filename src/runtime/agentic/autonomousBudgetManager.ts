import { AgentExecutionContext, ExecutionNode } from '../../agents/agenticContracts';

export class AutonomousBudgetManager {
  assertPlanWithinBudget(context: AgentExecutionContext, nodeCount: number): void {
    if (nodeCount > context.execution_budget.max_steps) {
      throw new Error('Plan exceeds execution step budget');
    }
  }

  assertNodeAttemptAllowed(context: AgentExecutionContext, node: ExecutionNode): void {
    if (node.attempts >= context.execution_budget.max_retries) {
      throw new Error(`Node ${node.node_id} exceeded retry budget`);
    }
  }
}
