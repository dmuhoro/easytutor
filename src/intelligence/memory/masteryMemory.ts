import AsyncStorage from '@react-native-async-storage/async-storage';
import { MasteryRecord, PortalType } from '../../types/canonical';
import { PortalContextResolver } from '../../infrastructure/contextResolver';

export class MasteryMemory {
  private static storageKey(): string {
    const context = PortalContextResolver.resolve();
    return `mastery_memory:${context.portal_type}`;
  }

  static async update(record: MasteryRecord): Promise<MasteryRecord> {
    const existing = await this.getAll();
    const filtered = existing.filter((item) => item.node_id !== record.node_id || item.user_id !== record.user_id);
    const updated = [...filtered, record];
    await AsyncStorage.setItem(this.storageKey(), JSON.stringify(updated));
    return record;
  }

  static async getAll(): Promise<MasteryRecord[]> {
    const raw = await AsyncStorage.getItem(this.storageKey());
    return raw ? JSON.parse(raw) : [];
  }

  static async getForNode(userId: string, nodeId: string): Promise<MasteryRecord | undefined> {
    return (await this.getAll()).find((record) => record.user_id === userId && record.node_id === nodeId);
  }
}
