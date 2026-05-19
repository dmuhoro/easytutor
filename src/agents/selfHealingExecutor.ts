import { ExecutionNode } from './agenticContracts';

export interface RecoveryDecision {
  strategy: 'retry' | 'fallback' | 'skip' | 'abort';
  reason: string;
  delay_ms: number;
}

export class SelfHealingExecutor {
  decide(node: ExecutionNode, error: Error): RecoveryDecision {
    if (node.attempts + 1 < node.max_attempts) {
      return {
        strategy: 'retry',
        reason: error.message,
        delay_ms: Math.min(1000 * (node.attempts + 1), 4000),
      };
    }

    if (node.kind === 'retrieval' || node.kind === 'memory') {
      return {
        strategy: 'fallback',
        reason: 'Switching to offline-safe degraded execution',
        delay_ms: 0,
      };
    }

    if (node.kind === 'assessment') {
      return {
        strategy: 'skip',
        reason: 'Assessment step may be deferred without breaking plan resumability',
        delay_ms: 0,
      };
    }

    return {
      strategy: 'abort',
      reason: error.message,
      delay_ms: 0,
    };
  }
}
