import { ExecutionPlan, ReasoningStepRecord } from '../../agents/agenticContracts';

export class DeterministicReasoningValidator {
  validate(plan: ExecutionPlan, steps: readonly ReasoningStepRecord[]): void {
    if (steps.length !== plan.nodes.length) {
      throw new Error('Reasoning chain length does not match deterministic plan length');
    }

    for (let index = 0; index < steps.length; index += 1) {
      const expectedNode = plan.nodes[index];
      if (steps[index].node_id !== expectedNode.node_id) {
        throw new Error('Reasoning chain diverged from deterministic execution order');
      }
    }
  }
}
