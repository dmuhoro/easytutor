import { AgenticPersistence } from '../../agents/agenticPersistence';
import { AutonomousExecutionEngine } from '../../agents/autonomousExecutionEngine';
import { CognitivePlanner } from '../../agents/cognitivePlanner';
import { ReasoningChainExecutor } from '../../agents/reasoningChainExecutor';
import {
  AgentExecutionContext,
  AgentGoal,
  ExecutionPlan,
  MemoryAccessRequest,
  MemoryRecord,
} from '../../agents/agenticContracts';
import { CognitiveAgentKernel } from '../../agents/cognitiveAgentKernel';
import { Telemetry } from '../../observability/telemetry';
import { AgentExecutionGovernor } from './agentExecutionGovernor';
import { AutonomousBudgetManager } from './autonomousBudgetManager';
import { CognitiveSafetyEngine } from './cognitiveSafetyEngine';
import { DeterministicReasoningValidator } from './deterministicReasoningValidator';
import { HallucinationBoundaryGuard } from './hallucinationBoundaryGuard';

export class GovernedAgentRuntime {
  private readonly planner = new CognitivePlanner();
  private readonly engine = new AutonomousExecutionEngine();
  private readonly reasoning = new ReasoningChainExecutor();
  private readonly governor = new AgentExecutionGovernor();
  private readonly budgets = new AutonomousBudgetManager();
  private readonly safety = new CognitiveSafetyEngine();
  private readonly validator = new DeterministicReasoningValidator();
  private readonly guard = new HallucinationBoundaryGuard();

  registerAgent(agent: CognitiveAgentKernel): void {
    this.engine.getLifecycleManager().register(agent);
  }

  async plan(goal: AgentGoal, context: AgentExecutionContext): Promise<ExecutionPlan> {
    this.safety.assertSafe(goal);
    const plan = this.planner.buildPlan(goal, context);
    this.budgets.assertPlanWithinBudget(context, plan.nodes.length);
    await AgenticPersistence.write(this.planKey(plan.plan_id), plan);
    return plan;
  }

  async execute(goal: AgentGoal, context: AgentExecutionContext): Promise<ExecutionPlan> {
    const plan = await this.plan(goal, context);

    for (const node of plan.nodes) {
      this.budgets.assertNodeAttemptAllowed(context, node);
    }

    const executed = await this.engine.execute(plan);
    const chain = this.reasoning.materialize(executed);
    this.validator.validate(executed, chain);

    const boundary = this.guard.inspect(chain);
    if (!boundary.safe) {
      throw new Error(boundary.issues.join('; '));
    }

    await AgenticPersistence.write(this.planKey(executed.plan_id), executed);

    Telemetry.emit({
      event: 'GOVERNED_AGENT_PLAN_COMPLETED',
      source: 'runtime',
      canonicalId: context.canonical_id,
      userId: context.user_id,
      portalType: context.portal_type,
      operationType: 'GOVERNED_AGENT_RUNTIME',
      payload: {
        plan_id: executed.plan_id,
        status: executed.status,
      },
    });

    return executed;
  }

  async resume(plan_id: string): Promise<ExecutionPlan | null> {
    return AgenticPersistence.read<ExecutionPlan>(this.planKey(plan_id));
  }

  async readMemory<T extends Record<string, unknown>>(request: MemoryAccessRequest, key: string): Promise<MemoryRecord<T> | null> {
    this.governor.validateMemoryAccess(request);
    return AgenticPersistence.read<MemoryRecord<T>>(`${request.namespace}:${request.memory_kind}:${key}`);
  }

  async writeMemory<T extends Record<string, unknown>>(request: MemoryAccessRequest, key: string, record: MemoryRecord<T>): Promise<void> {
    this.governor.validateMemoryAccess(request);
    await AgenticPersistence.write(`${request.namespace}:${request.memory_kind}:${key}`, record);
  }

  private planKey(plan_id: string): string {
    return `agentic:plan:${plan_id}`;
  }
}
