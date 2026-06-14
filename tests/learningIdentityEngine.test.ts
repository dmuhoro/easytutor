import { beforeEach, describe, expect, it, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createIdentity, updateIdentity, getIdentity } from '../lib/learningIdentityEngine';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        })),
      })),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe('learningIdentityEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new identity with defaults', async () => {
    const identity = await createIdentity('user-1', {
      learner_type: 'university',
      goals: ['Pass Calculus'],
      interests: ['Math'],
      preferred_learning_style: 'visual',
      target_outcomes: ['A+'],
    });

    expect(identity.user_id).toBe('user-1');
    expect(identity.learner_type).toBe('university');
    expect(identity.goals).toContain('Pass Calculus');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'learning_identity_cache_v1:user-1',
      expect.any(String)
    );
  });

  it('updates an existing identity', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify({
      user_id: 'user-1',
      learner_type: 'secondary',
      goals: [],
      interests: [],
      preferred_learning_style: 'text',
      target_outcomes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const updated = await updateIdentity('user-1', {
      goals: ['New Goal'],
    });

    expect(updated.learner_type).toBe('secondary'); // unchanged
    expect(updated.goals).toContain('New Goal'); // updated
  });
});
