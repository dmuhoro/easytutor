import {
  AgentExecutionContext,
  AgentGoal,
  AgentRole,
  ExecutionNode,
  ExecutionNodeKind,
  deterministicId,
} from './agenticContracts';

const DEFAULT_ROLE_BY_KIND: Record<ExecutionNodeKind, AgentRole> = {
  analysis: 'planner',
  retrieval: 'retrieval',
  memory: 'memory',
  tutoring: 'tutor',
  assessment: 'assessment',
  governance: 'governance',
  coordination: 'orchestrator',
  repair: 'remediation',
};

export class TaskDecompositionEngine {
  decompose(goal: AgentGoal, context: AgentExecutionContext): ExecutionNode[] {
    const orderedCriteria = [...goal.success_criteria];
    const prelude = this.createNode(goal, context, 0, 'analysis', 'Understand goal', [], {
      goal_description: goal.description,
    });
    const criteriaNodes = orderedCriteria.map((criterion, index) =>
      this.createNode(
        goal,
        context,
        index + 1,
        this.kindForCriterion(criterion, index, orderedCriteria.length),
        criterion,
        [index === 0 ? prelude.node_id : deterministicId(goal.goal_id, 'node', index)],
        { criterion },
      ),
    );
    const governanceNode = this.createNode(
      goal,
      context,
      criteriaNodes.length + 1,
      'governance',
      'Validate governed completion',
      criteriaNodes.map((node) => node.node_id),
      { goal_id: goal.goal_id },
    );

    return [prelude, ...criteriaNodes, governanceNode];
  }

  private kindForCriterion(
    criterion: string,
    index: number,
    total: number,
  ): ExecutionNodeKind {
    const normalized = criterion.toLowerCase();
    if (normalized.includes('memory') || normalized.includes('reflect')) return 'memory';
    if (normalized.includes('retrieve') || normalized.includes('search')) return 'retrieval';
    if (normalized.includes('assess') || normalized.includes('verify')) return 'assessment';
    if (normalized.includes('recover') || normalized.includes('heal')) return 'repair';
    if (index === total - 1) return 'assessment';
    return 'tutoring';
  }

  private createNode(
    goal: AgentGoal,
    context: AgentExecutionContext,
    order: number,
    kind: ExecutionNodeKind,
    title: string,
    depends_on: readonly string[],
    input: Record<string, unknown>,
  ): ExecutionNode {
    const nodeId = deterministicId(goal.goal_id, 'node', order);
    return {
      node_id: nodeId,
      title,
      description: `${goal.title}: ${title}`,
      kind,
      role: DEFAULT_ROLE_BY_KIND[kind],
      depends_on,
      status: order === 0 ? 'ready' : 'planned',
      attempts: 0,
      max_attempts: context.execution_budget.max_retries,
      checkpoint_key: deterministicId(context.session_id, nodeId, 'checkpoint'),
      deterministic_order: order,
      input,
    };
  }
}
