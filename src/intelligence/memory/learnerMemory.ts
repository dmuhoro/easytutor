import AsyncStorage from '@react-native-async-storage/async-storage';
import { PortalType } from '../../types/canonical';
import { PortalContextResolver } from '../../infrastructure/contextResolver';

export interface LearningEvent {
  user_id: string;
  portal_type: PortalType;
  node_id: string;
  event_type: 'study' | 'quiz' | 'review' | 'remediation';
  timestamp: string;
  payload: Record<string, unknown>;
}

export class LearnerMemory {
  private static storageKey(): string {
    const context = PortalContextResolver.resolve();
    return `learner_memory:${context.portal_type}`;
  }

  static async recordEvent(event: LearningEvent): Promise<void> {
    const key = this.storageKey();
    const existing = await this.getAllEvents();
    await AsyncStorage.setItem(key, JSON.stringify([...existing, event]));
  }

  static async getAllEvents(): Promise<LearningEvent[]> {
    const key = this.storageKey();
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }
}
