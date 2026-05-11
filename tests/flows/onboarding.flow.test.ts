import { beforeEach, describe, expect, it } from 'vitest';
import { getAuthenticatedUser, getSupabaseClient } from '../../lib/supabaseOps';
import { useRoadmapStore } from '../../store/roadmapStore';
import { testLog } from '../utils/flowLogger';
import { mockSupabase } from '../utils/mockSupabase';

async function simulateCurrentOnboarding(mode: 'high_school' | 'university' | 'self_directed') {
  const store = useRoadmapStore.getState();
  testLog('[TEST_FLOW]', 'onboarding:start', { mode });

  try {
    const client = getSupabaseClient();
    const authUser = await getAuthenticatedUser();
    const { error } = await client.from('profiles').upsert({
      id: authUser.id,
      email: authUser.email,
      learning_mode: mode,
      onboarding_complete: true,
    });

    if (error) throw error;

    store.setLearningMode(mode);
    store.setOnboardingComplete(true);
  } catch (error) {
    testLog('[TEST_FAILURE]', 'onboarding db write failed and UI remains blocked', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

describe('onboarding flow', () => {
  beforeEach(() => {
    mockSupabase.reset();
    useRoadmapStore.setState({
      learningMode: null,
      onboardingComplete: false,
    });
  });

  it('creates a profile and only marks onboarding complete after the DB write succeeds', async () => {
    await simulateCurrentOnboarding('high_school');

    expect(mockSupabase.db.profiles).toContainEqual(
      expect.objectContaining({
        id: mockSupabase.user.id,
        learning_mode: 'high_school',
        onboarding_complete: true,
      }),
    );
    expect(useRoadmapStore.getState().onboardingComplete).toBe(true);
  });

  it('does not mark onboarding complete when profile persistence fails', async () => {
    mockSupabase.failNext('profiles', 'upsert', 'profiles write rejected');

    await simulateCurrentOnboarding('high_school');

    expect(mockSupabase.db.profiles).toHaveLength(1);
    expect(useRoadmapStore.getState().onboardingComplete).toBe(false);
  });
});
