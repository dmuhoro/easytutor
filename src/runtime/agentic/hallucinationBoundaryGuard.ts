import { ReasoningStepRecord } from '../../agents/agenticContracts';

export class HallucinationBoundaryGuard {
  inspect(steps: readonly ReasoningStepRecord[]): { safe: boolean; issues: string[] } {
    const issues = steps
      .filter((step) => step.evidence.length === 0 || step.assumptions.length > step.evidence.length + 1)
      .map((step) => `Reasoning step ${step.step_id} lacks enough evidence`);

    return {
      safe: issues.length === 0,
      issues,
    };
  }
}
