import { AgentGoal } from '../../agents/agenticContracts';

export class CognitiveSafetyEngine {
  score(goal: AgentGoal): number {
    const text = `${goal.title} ${goal.description}`.toLowerCase();
    const risky = ['delete', 'bypass', 'exfiltrate', 'unguarded'].some((token) => text.includes(token));
    return risky ? 0.2 : 0.95;
  }

  assertSafe(goal: AgentGoal): void {
    if (this.score(goal) < 0.5) {
      throw new Error('Goal rejected by cognitive safety engine');
    }
  }
}
