import { describe, expect, it, vi } from 'vitest';
import { LearningOrchestrator, createRuntimeContext } from '../../src/intelligence';
import { HybridInferenceRouter } from '../../src/intelligence/routing/hybridInferenceRouter';
import { LocalLLMRouter } from '../../src/intelligence/routing/localLLMRouter';
import { CloudLLMRouter } from '../../src/intelligence/routing/cloudLLMRouter';
import { MasteryCoordinator } from '../../src/intelligence/mastery/masteryCoordinator';
import { PredictivePrefetcher } from '../../src/intelligence/prefetch/predictivePrefetcher';

vi.mock('../../lib/retrieval', () => ({
  retrieveRelevantChunks: vi.fn(async () => [
    { content: 'Governed algebra context', similarity: 0.91, metadata: { index: 0 } },
  ]),
}));

vi.mock('../../lib/ollama', () => ({
  generateOfflineResponse: vi.fn(async () => 'Local generated explanation'),
}));

vi.mock('../../lib/cloud', () => ({
  generateCloudResponse: vi.fn(async () => 'Cloud generated explanation'),
}));

const baseInput = {
  user_id: '11111111-1111-4111-8111-111111111111',
  portal_type: 'high_school' as const,
  subject_id: 'HS-MATH',
  topic_id: 'ALG-001',
  mastery_state: {
    score: 35,
    attempts: 2,
    weak_points: ['linear equations'],
  },
  learning_goal: 'master linear equations',
  connectivity_state: 'online' as const,
};

describe('learning orchestration contracts', () => {
  it('creates canonical runtime context with governed retrieval policy', () => {
    const context = createRuntimeContext(baseInput);

    expect(context.portal_type).toBe('high_school');
    expect(context.canonical_id).toBe('HS-HS-MATH-ALG-001');
    expect(context.retrieval_policy).toMatchObject({
      portal_type: 'high_school',
      curriculum_scope: 'KICD_KCSE',
      taxonomy_scope: 'HS-MATH',
      mastery_level: 35,
      user_goal: 'master linear equations',
    });
  });

  it('routes offline requests to local model deterministically', () => {
    const context = createRuntimeContext({ ...baseInput, connectivity_state: 'offline' });
    const router = new HybridInferenceRouter(new LocalLLMRouter(), new CloudLLMRouter());

    expect(router.decide({
      prompt: 'Explain algebra',
      complexity: 'high',
      cacheKey: 'offline-routing-test',
    }, context)).toEqual({
      route: 'local',
      reason: 'offline-local-only',
    });
  });

  it('coordinates mastery decay and remediation scheduling', () => {
    const context = createRuntimeContext(baseInput);
    const plan = new MasteryCoordinator().evaluate(context);

    expect(plan.band).toBe('weak');
    expect(plan.remediation_required).toBe(true);
    expect(plan.xp_delta).toBe(5);
  });

  it('predicts and stages the next three learning nodes', async () => {
    const context = createRuntimeContext(baseInput);
    const result = await new PredictivePrefetcher().warm(context);

    expect(result.staged_count).toBe(3);
    expect(result.nodes).toHaveLength(3);
    expect(result.nodes[0].canonical_id).toContain('HS-HS-MATH-ALG-001-NEXT-1');
  });

  it('generates lessons through the orchestrator command layer', async () => {
    const result = await new LearningOrchestrator().generateLesson(baseInput);

    expect(result.context.portal_type).toBe('high_school');
    expect(result.pipeline.kind).toBe('lesson_generation');
    expect(result.pipeline.telemetry.retrieval_depth).toBe(1);
    expect(result.prefetch?.staged_count).toBe(3);
    expect(result.recommendations[0].action).toBe('remediate');
  });
});
