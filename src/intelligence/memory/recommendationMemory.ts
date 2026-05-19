import { MasteryRecord } from '../../types/canonical';
import { MasteryMemory } from './masteryMemory';

export interface RecommendationMemoryEntry {
  node_id: string;
  recommendation_score: number;
  reason: string;
}

export class RecommendationMemory {
  static async recommendForUser(userId: string): Promise<RecommendationMemoryEntry[]> {
    const masteryRecords = await MasteryMemory.getAll();
    const userRecords = masteryRecords.filter((record) => record.user_id === userId);

    return userRecords
      .map((record) => ({
        node_id: record.node_id,
        recommendation_score: 100 - record.mastery_score,
        reason: record.mastery_score < 60 ? 'Review weak point' : 'Strengthen mastery',
      }))
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, 5);
  }
}
