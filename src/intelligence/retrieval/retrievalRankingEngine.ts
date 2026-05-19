import { CanonicalContentNode } from '../../types/canonical';

export class RetrievalRankingEngine {
  static rankForMastery(chunks: CanonicalContentNode[], masteryLevel: number): CanonicalContentNode[] {
    return [...chunks].sort((a, b) => {
      const masteryBias = (b.mastery_weight - a.mastery_weight) * 2;
      const priorityBias = (b.retrieval_priority ?? 0) - (a.retrieval_priority ?? 0);
      const difficultyBias = Math.abs((a.difficulty_level === 'beginner' ? 0 : a.difficulty_level === 'intermediate' ? 1 : a.difficulty_level === 'advanced' ? 2 : 3) - masteryLevel);
      return priorityBias + masteryBias - difficultyBias;
    });
  }

  static rankForPrerequisite(chunks: CanonicalContentNode[], activePath: readonly string[]): CanonicalContentNode[] {
    return [...chunks].sort((a, b) => {
      const aMatches = activePath.filter((id) => a.taxonomy_path.includes(id)).length;
      const bMatches = activePath.filter((id) => b.taxonomy_path.includes(id)).length;
      return bMatches - aMatches;
    });
  }
}
