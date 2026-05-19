import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/infrastructure/contextResolver', () => ({
  PortalContextResolver: {
    resolve: vi.fn(() => ({
      portal_type: 'high_school',
      curriculum_scope: 'KICD_KCSE',
      knowledge_scope: 'namespace:high_school',
      user_context: 'test-user',
    })),
  },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => null),
  },
}));

import { LearnerMemory } from '../../src/intelligence/memory/learnerMemory';

describe('Learner Memory', () => {
  it('exports the LearnerMemory class and can record an event', async () => {
    const event = {
      user_id: 'learner-test',
      portal_type: 'high_school',
      node_id: 'learner_memory',
      event_type: 'study',
      timestamp: new Date().toISOString(),
      payload: { subject: 'HS-MATH', topic: 'HS-MATH-ALG' },
    } as const;

    await expect(LearnerMemory.recordEvent(event)).resolves.toBeUndefined();
  });
});
