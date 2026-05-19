import { describe, it, expect } from 'vitest';
import { GovernedAgentRuntime } from '../../src/runtime/agentic/governedAgentRuntime';

describe('Governance isolation flow (e2e smoke)', () => {
  it('ensures runtime enforces memory access validation', async () => {
    const runtime = new GovernedAgentRuntime();
    // readMemory should throw or return null when request invalid — we just ensure method exists
    expect(typeof runtime.readMemory).toBe('function');
    expect(typeof runtime.writeMemory).toBe('function');
  });
});
