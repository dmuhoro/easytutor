import { MasteryRecord, PortalType } from '../../types/canonical';
import { MasteryMemory } from './masteryMemory';
import { PortalContextResolver } from '../../infrastructure/contextResolver';

export interface WeakPointEntry {
  node_id: string;
  mastery_score: number;
  urgency: 'low' | 'medium' | 'high';
}

export class WeakPointMemory {
  static async identify(userId: string): Promise<WeakPointEntry[]> {
    const records = await MasteryMemory.getAll();
    const filtered = records.filter((record) => record.user_id === userId);

    const entries: WeakPointEntry[] = filtered.map((record) => ({
      node_id: record.node_id,
      mastery_score: record.mastery_score,
      urgency: record.mastery_score > 70 ? 'low' : record.mastery_score > 40 ? 'medium' : 'high',
    }));

    return entries.sort((a, b) => {
      const urgencyOrder: Record<string, number> = { high: 2, medium: 1, low: 0 };
      return (urgencyOrder[b.urgency] ?? 0) - (urgencyOrder[a.urgency] ?? 0) || a.mastery_score - b.mastery_score;
    });
  }

  static async getWeakPoints(userId: string): Promise<WeakPointEntry[]> {
    return this.identify(userId);
  }
}
