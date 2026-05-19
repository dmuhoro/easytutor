import { RetrievalContext, CanonicalContentNode } from '../../types/canonical';
import { DifficultyCalibrator } from './difficultyCalibrator';
import { PrerequisiteReasoner } from './prerequisiteReasoner';
import { RemediationPlanner, RemediationPlan } from './remediationPlanner';

export interface AdaptiveTutorPlan {
  difficulty: 'easy' | 'medium' | 'hard';
  remediation: RemediationPlan;
  learning_sequence: readonly string[];
  context_summary: string;
}

export class AdaptiveTutorReasoner {
  static reason(context: RetrievalContext, content: CanonicalContentNode[]): AdaptiveTutorPlan {
    const difficulty = DifficultyCalibrator.calibrate(context);
    const remediation = RemediationPlanner.plan(context);
    const gaps = PrerequisiteReasoner.recommendedNext(context);

    return {
      difficulty,
      remediation,
      learning_sequence: content.map((chunk) => chunk.canonical_id),
      context_summary: `Adaptive plan for ${context.user_goal ?? 'learning'} in ${context.portal_type}.`,
    };
  }
}
