import { Telemetry } from '../observability/telemetry';
import { AgentLifecycleManager } from './agentLifecycleManager';
import {
  AgentTaskResult,
  ExecutionCheckpoint,
  ExecutionNode,
  ExecutionPlan,
  deterministicId,
} from './agenticContracts';
import { ContextualDecisionEngine } from './contextualDecisionEngine';
import { ExecutionStateMachine } from './executionStateMachine';
import { SelfHealingExecutor } from './selfHealingExecutor';

export class AutonomousExecutionEngine {
  constructor(
    private readonly lifecycle = new AgentLifecycleManager(),
    private readonly stateMachine = new ExecutionStateMachine(),
    private readonly decisions = new ContextualDecisionEngine(),
    private readonly healing = new SelfHealingExecutor(),
  ) {}

  getLifecycleManager(): AgentLifecycleManager {
    return this.lifecycle;
  }

  async execute(plan: ExecutionPlan): Promise<ExecutionPlan> {
    this.lifecycle.attachContext(plan.context);
    this.stateMachine.transitionPlan(plan, 'running');

    while (true) {
      const [node] = this.stateMachine.nextRunnableNodes(plan);
      if (!node) {
        break;
      }

      plan.resume_cursor = node.deterministic_order;
      const decision = this.decisions.decide(node, plan.context);
      if (!decision.execute_now) {
        node.status = 'waiting';
        continue;
      }

      const agent = this.lifecycle.get(node.role);
      this.lifecycle.transition(node.role, 'busy', { node_id: node.node_id });
      
      if (node.status === 'planned') {
        this.stateMachine.transitionNode(node, 'ready');
      }
      this.stateMachine.transitionNode(node, 'running');

      try {
        const result: AgentTaskResult = await agent.executeNode(plan.goal, node, plan.context);
        node.output = result.output;
        node.error = undefined;
        this.stateMachine.transitionNode(node, 'completed');
        plan.checkpoints.push(this.createCheckpoint(plan, node));
      } catch (error) {
        node.attempts += 1;
        node.error = (error as Error).message;
        const recovery = this.healing.decide(node, error as Error);

        if (recovery.strategy === 'retry' || recovery.strategy === 'fallback') {
          this.stateMachine.transitionNode(node, 'recovering');
          this.lifecycle.transition(node.role, 'recovering', {
            node_id: node.node_id,
            strategy: recovery.strategy,
          });
          this.stateMachine.transitionNode(node, 'ready');
          continue;
        }

        if (recovery.strategy === 'skip') {
          this.stateMachine.transitionNode(node, 'completed');
          plan.checkpoints.push(this.createCheckpoint(plan, node));
          continue;
        }

        this.stateMachine.transitionNode(node, 'failed');
        this.stateMachine.transitionPlan(plan, 'failed');
        throw error;
      } finally {
        if (this.lifecycle.snapshot()[node.role] !== 'recovering') {
          this.lifecycle.transition(node.role, 'ready', { node_id: node.node_id });
        }
      }
    }

    if (plan.nodes.every((node) => node.status === 'completed')) {
      this.stateMachine.transitionPlan(plan, 'completed');
    } else if (plan.status === 'running') {
      this.stateMachine.transitionPlan(plan, 'paused');
    }

    Telemetry.emit({
      event: 'AUTONOMOUS_PLAN_EXECUTED',
      source: 'execution',
      canonicalId: plan.context.canonical_id,
      userId: plan.context.user_id,
      portalType: plan.context.portal_type,
      operationType: 'AUTONOMOUS_PLAN',
      payload: {
        plan_id: plan.plan_id,
        status: plan.status,
        completed_nodes: plan.nodes.filter((node) => node.status === 'completed').length,
        total_nodes: plan.nodes.length,
      },
    });

    return plan;
  }

  private createCheckpoint(plan: ExecutionPlan, node: ExecutionNode): ExecutionCheckpoint {
    return {
      checkpoint_id: deterministicId(plan.plan_id, node.node_id, 'checkpoint', plan.checkpoints.length),
      node_id: node.node_id,
      status: node.status,
      created_at: new Date().toISOString(),
      snapshot: {
        plan_status: plan.status,
        node_output: node.output ?? null,
        resume_cursor: plan.resume_cursor,
      },
    };
  }
}
