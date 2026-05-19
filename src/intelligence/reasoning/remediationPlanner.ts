import { RetrievalContext } from '../../types/canonical';
import { PrerequisiteReasoner } from './prerequisiteReasoner';

export interface RemediationPlan {
  steps: string[];
  focus: 'prerequisite' | 'weak_point' | 'review';
  recommendedIntensity: 'low' | 'medium' | 'high';
}

export class RemediationPlanner {
  static plan(context: RetrievalContext): RemediationPlan {
    const missing = PrerequisiteReasoner.recommendedNext(context);
    const intensity = context.mastery_level && context.mastery_level < 40 ? 'high' : context.mastery_level && context.mastery_level < 70 ? 'medium' : 'low';

    return {
      steps: missing.length ? missing : (context.active_path ? [...context.active_path] : []),
      focus: missing.length ? 'prerequisite' : 'review',
      recommendedIntensity: intensity,
    };
  }
}
