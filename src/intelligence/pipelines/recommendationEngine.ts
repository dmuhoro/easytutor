import { RuntimeContext } from '../runtime/runtimeContext';
import { MasteryPlan } from '../mastery/masteryCoordinator';

export interface Recommendation {
  canonical_id: string;
  portal_type: RuntimeContext['portal_type'];
  reason: string;
  priority: number;
  action: 'review' | 'continue' | 'remediate' | 'accelerate';
}

export class RecommendationEngine {
  recommend(context: RuntimeContext, masteryPlan: MasteryPlan): Recommendation[] {
    const base = {
      canonical_id: context.canonical_id,
      portal_type: context.portal_type,
    };

    if (masteryPlan.remediation_required) {
      return [{
        ...base,
        reason: 'Mastery gaps detected inside the active portal taxonomy.',
        priority: 100,
        action: 'remediate',
      }];
    }

    if (masteryPlan.band === 'strong') {
      return [{
        ...base,
        reason: 'Learner is ready for a higher-complexity continuation.',
        priority: 70,
        action: 'accelerate',
      }];
    }

    return [{
      ...base,
      reason: 'Continue with reinforced practice before progression.',
      priority: 50,
      action: 'continue',
    }];
  }
}
