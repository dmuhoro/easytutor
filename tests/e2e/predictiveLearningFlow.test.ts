import { describe, it, expect } from 'vitest';
import { PredictivePrefetcher } from '../../src/intelligence/prefetch/predictivePrefetcher';

describe('Predictive learning flow (e2e smoke)', () => {
  it('prefetcher warms context without throwing', async () => {
    const prefetcher = new PredictivePrefetcher();
    const fakeContext: any = { 
      canonical_id: 'c3', 
      portal_type: 'high_school',
      subject_id: 'physics',
      topic_id: 'mechanics'
    };
    const res = await prefetcher.warm(fakeContext);
    expect(res).toBeDefined();
    expect(typeof res.staged_count).toBe('number');
  });
});
