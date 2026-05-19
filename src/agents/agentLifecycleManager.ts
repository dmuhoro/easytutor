import { Telemetry } from '../observability/telemetry';
import { AgentExecutionContext, AgentRole } from './agenticContracts';
import { CognitiveAgentKernel } from './cognitiveAgentKernel';

export type AgentLifecycleState =
  | 'created'
  | 'ready'
  | 'busy'
  | 'recovering'
  | 'paused'
  | 'terminated';

export interface LifecycleRecord {
  agent_id: string;
  role: AgentRole;
  state: AgentLifecycleState;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export class AgentLifecycleManager {
  private readonly agents = new Map<AgentRole, CognitiveAgentKernel>();
  private readonly states = new Map<AgentRole, AgentLifecycleState>();
  private readonly history: LifecycleRecord[] = [];

  register(agent: CognitiveAgentKernel): void {
    this.agents.set(agent.role, agent);
    this.states.set(agent.role, 'created');
    this.record(agent.role, 'created', { agent_id: agent.agent_id });
    this.transition(agent.role, 'ready');
  }

  get(role: AgentRole): CognitiveAgentKernel {
    const agent = this.agents.get(role);
    if (!agent) {
      throw new Error(`Agent role '${role}' is not registered`);
    }

    return agent;
  }

  list(): CognitiveAgentKernel[] {
    return [...this.agents.values()];
  }

  transition(role: AgentRole, state: AgentLifecycleState, metadata?: Record<string, unknown>): void {
    this.states.set(role, state);
    this.record(role, state, metadata);
  }

  attachContext(_context: AgentExecutionContext): void {
    for (const role of this.agents.keys()) {
      if (this.states.get(role) === 'created') {
        this.transition(role, 'ready');
      }
    }
  }

  snapshot(): Record<AgentRole, AgentLifecycleState> {
    return Object.fromEntries(this.states.entries()) as Record<AgentRole, AgentLifecycleState>;
  }

  historyFor(role?: AgentRole): LifecycleRecord[] {
    return role ? this.history.filter((entry) => entry.role === role) : [...this.history];
  }

  private record(role: AgentRole, state: AgentLifecycleState, metadata?: Record<string, unknown>): void {
    const agent = this.agents.get(role);
    const record: LifecycleRecord = {
      agent_id: agent?.agent_id ?? role,
      role,
      state,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.history.push(record);

    Telemetry.emit({
      event: 'AGENT_LIFECYCLE_UPDATED',
      source: 'lifecycle',
      operationType: 'AGENT_LIFECYCLE',
      payload: record as unknown as Record<string, unknown>,
    });
  }
}
