import { RetrievalContext } from '../../types/canonical';

export class DifficultyCalibrator {
  static calibrate(context: RetrievalContext): 'easy' | 'medium' | 'hard' {
    if ((context.mastery_level ?? 0) < 30) return 'easy';
    if ((context.mastery_level ?? 0) < 70) return 'medium';
    return 'hard';
  }

  static adjustParameters(context: RetrievalContext) {
    const difficulty = this.calibrate(context);
    return {
      maxChunks: difficulty === 'hard' ? 8 : difficulty === 'medium' ? 6 : 4,
      minSimilarity: difficulty === 'hard' ? 0.55 : difficulty === 'medium' ? 0.65 : 0.75,
    };
  }
}
