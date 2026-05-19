import {
  AgentExecutionContext,
  AgentGoal,
  ExecutionPlan,
  deterministicId,
} from './agenticContracts';
import { TaskDecompositionEngine } from './taskDecompositionEngine';

export class CognitivePlanner {
  constructor(private readonly decomposition = new TaskDecompositionEngine()) {}

  buildPlan(goal: AgentGoal, context: AgentExecutionContext): ExecutionPlan {
    const nodes = this.decomposition.decompose(goal, context).slice(0, context.execution_budget.max_steps);
    const timestamp = new Date().toISOString();

    return {
      plan_id: deterministicId(context.session_id, goal.goal_id, context.deterministic_seed),
      goal,
      context,
      status: 'ready',
      created_at: timestamp,
      updated_at: timestamp,
      nodes,
      checkpoints: [],
      resume_cursor: 0,
    };
  }
}
