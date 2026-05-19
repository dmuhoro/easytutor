import { ExecutionNode, ExecutionPlan, ExecutionStatus } from './agenticContracts';

const ALLOWED_TRANSITIONS: Record<ExecutionStatus, readonly ExecutionStatus[]> = {
  planned: ['ready', 'cancelled'],
  ready: ['running', 'paused', 'cancelled'],
  running: ['waiting', 'recovering', 'completed', 'failed', 'paused'],
  waiting: ['ready', 'recovering', 'failed', 'cancelled'],
  recovering: ['ready', 'failed', 'cancelled'],
  completed: [],
  failed: ['recovering', 'cancelled'],
  paused: ['ready', 'cancelled'],
  cancelled: [],
};

export class ExecutionStateMachine {
  transitionPlan(plan: ExecutionPlan, next: ExecutionStatus): ExecutionPlan {
    this.assertTransition(plan.status, next);
    plan.status = next;
    plan.updated_at = new Date().toISOString();
    return plan;
  }

  transitionNode(node: ExecutionNode, next: ExecutionStatus): ExecutionNode {
    this.assertTransition(node.status, next);
    node.status = next;
    return node;
  }

  nextRunnableNodes(plan: ExecutionPlan): ExecutionNode[] {
    return plan.nodes
      .filter((node) => node.status === 'ready' || node.status === 'planned')
      .filter((node) =>
        node.depends_on.every((dependency) =>
          plan.nodes.find((candidate) => candidate.node_id === dependency)?.status === 'completed',
        ),
      )
      .sort((left, right) => left.deterministic_order - right.deterministic_order);
  }

  snapshot(plan: ExecutionPlan): Record<string, unknown> {
    return {
      plan_id: plan.plan_id,
      status: plan.status,
      resume_cursor: plan.resume_cursor,
      nodes: plan.nodes.map((node) => ({
        node_id: node.node_id,
        status: node.status,
        attempts: node.attempts,
        error: node.error,
      })),
    };
  }

  private assertTransition(current: ExecutionStatus, next: ExecutionStatus): void {
    if (!ALLOWED_TRANSITIONS[current].includes(next)) {
      throw new Error(`Invalid execution transition: ${current} -> ${next}`);
    }
  }
}
