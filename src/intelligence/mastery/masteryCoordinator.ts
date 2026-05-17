import { calculateNextReview } from '../../../lib/intelligence/spacedRepetition';
import { getMasteryBand } from '../../../lib/mastery';
import { SYSTEM_CONFIG } from '../../config/registry';
import { Telemetry } from '../../observability/telemetry';
import { RuntimeContext } from '../runtime/runtimeContext';

export interface MasterySignal {
  canonical_id: string;
  score: number;
  timestamp: string;
}

export interface MasteryPlan {
  canonical_id: string;
  current_score: number;
  decayed_score: number;
  band: 'weak' | 'developing' | 'strong';
  weak_points: readonly string[];
  next_review_at: string;
  remediation_required: boolean;
  xp_delta: number;
}

export class MasteryCoordinator {
  evaluate(context: RuntimeContext, signals: readonly MasterySignal[] = []): MasteryPlan {
    const start = Date.now();
    const latestSignal = signals.at(-1);
    const rawScore = latestSignal?.score ?? context.mastery_state.score;
    const daysSinceActivity = context.mastery_state.last_activity
      ? Math.max(0, Math.floor((Date.now() - new Date(context.mastery_state.last_activity).getTime()) / 86400000))
      : 0;
    const decayedScore = Math.max(
      0,
      Math.round(rawScore * Math.pow(1 - SYSTEM_CONFIG.MASTERY.DECAY_RATE, daysSinceActivity)),
    );
    const band = getMasteryBand(decayedScore);
    const quality = decayedScore >= 80 ? 5 : decayedScore >= 60 ? 4 : decayedScore >= 40 ? 3 : 2;
    const review = calculateNextReview({
      id: context.canonical_id,
      interval: context.mastery_state.attempts > 0 ? 1 : 0,
      easeFactor: 2.5,
      lastReview: context.mastery_state.last_activity ?? new Date().toISOString(),
    }, quality);

    const plan: MasteryPlan = {
      canonical_id: context.canonical_id,
      current_score: rawScore,
      decayed_score: decayedScore,
      band,
      weak_points: context.mastery_state.weak_points,
      next_review_at: new Date(Date.now() + review.interval * 86400000).toISOString(),
      remediation_required: band === 'weak' || context.mastery_state.weak_points.length > 0,
      xp_delta: decayedScore >= SYSTEM_CONFIG.MASTERY.PASSING_SCORE ? 20 : decayedScore >= 50 ? 10 : 5,
    };

    Telemetry.emit({
      event: 'MASTERY_UPDATED',
      source: 'intelligence',
      canonicalId: context.canonical_id,
      userId: context.user_id,
      portalType: context.portal_type,
      latency: Date.now() - start,
      operationType: 'MASTERY_COORDINATION',
      payload: {
        band: plan.band,
        decayed_score: plan.decayed_score,
        remediation_required: plan.remediation_required,
        xp_delta: plan.xp_delta,
      },
    });

    return plan;
  }
}
