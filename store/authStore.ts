import { logError } from '../lib/logEvent';
import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, logSupabaseError } from '../lib/supabaseOps';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    });
  },
  signOut: async () => {
    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.signOut();
      if (error) {
        logSupabaseError('auth', 'delete', error);
        logError('AUTH_signOut_failed', error);
      }
      set({ session: null, user: null, isLoading: false });
    } catch (err) {
      logError('AUTH_signOut_failed', err);
      throw err;
    }
  },
}));
