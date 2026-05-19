import { describe, it, expect } from 'vitest';
import { GovernedAgentRuntime } from '../../src/runtime/agentic/governedAgentRuntime';

describe('Multi-agent execution flow (e2e smoke)', () => {
  it('can plan and execute a simple agent goal', async () => {
    const runtime = new GovernedAgentRuntime();
    
    // Register mock agents for all roles used in the test
    const roles: any[] = ['orchestrator', 'tutor', 'retrieval', 'memory', 'remediation', 'assessment', 'planner', 'governance'];
    roles.forEach(role => {
      runtime.registerAgent({
        agent_id: `mock-${role}`,
        role,
        executeNode: async (goal: any, node: any) => ({
          node_id: node.node_id,
          role,
          success: true,
          summary: `Mock ${role} executed ${node.title}`,
          output: { result: 'ok' }
        })
      } as any);
    });

    const goal = {
      goal_id: 'g1',
      title: 'Test goal',
      description: 'A simple test',
      success_criteria: ['done'],
      priority: 'low',
      horizon: 'session',
    } as any;

    const context = {
      canonical_id: 'c1',
      portal_type: 'high_school',
      user_id: 'u1',
      learner_id: 'l1',
      session_id: 's1',
      deterministic_seed: 'seed',
      telemetry_correlation_id: 'corr1',
      offline_available: true,
      execution_budget: {
        max_steps: 10,
        max_runtime_ms: 5000,
        max_retries: 3,
        max_memory_reads: 100,
        max_memory_writes: 100,
      },
      governance_tags: [],
      memory_namespace: 'high_school:l1',
      state_version: 1,
    } as any;

    const plan = await runtime.plan(goal, context);
    expect(plan).toBeDefined();

    const executed = await runtime.execute(goal, context);
    expect(executed).toBeDefined();
    expect(executed.plan_id).toBeDefined();
  });
});
