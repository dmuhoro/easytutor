import {
  ExecutionPlan,
  ReasoningStepRecord,
  deterministicId,
} from './agenticContracts';

export class ReasoningChainExecutor {
  materialize(plan: ExecutionPlan): ReasoningStepRecord[] {
    return plan.nodes.map((node) => ({
      step_id: deterministicId(plan.plan_id, node.node_id, 'reasoning'),
      node_id: node.node_id,
      summary: `${node.title} executed under ${plan.goal.horizon} horizon`,
      evidence: [
        `depends_on:${node.depends_on.join(',') || 'none'}`,
        `kind:${node.kind}`,
      ],
      assumptions: [
        `portal:${plan.context.portal_type}`,
        `offline_available:${String(plan.context.offline_available)}`,
      ],
      validator_status: 'pending',
      derived_from: node.depends_on,
    }));
  }
}
