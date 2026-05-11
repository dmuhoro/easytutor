import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type SupabaseAction = 'select' | 'insert' | 'update' | 'upsert' | 'delete';

export const getSupabaseClient = () => {
  if (!supabase) {
    const error = new Error('Supabase client unavailable');
    console.error('[SUPABASE ERROR]', {
      table: 'client',
      action: 'initialize',
      error
    });
    throw error;
  }

  return supabase;
};

export const getAuthenticatedUser = async (): Promise<User> => {
  const client = getSupabaseClient();

  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError || !user) {
    const error = new Error('User not authenticated');
    console.error('[SUPABASE ERROR]', {
      table: 'auth',
      action: 'select',
      error: userError ?? error
    });
    throw error;
  }

  return user;
};

export const logSupabaseError = (table: string, action: SupabaseAction, error: unknown) => {
  console.error('[SUPABASE ERROR]', {
    table,
    action,
    error
  });
};

export const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const assertRequiredWriteFields = (payload: {
  user_id?: string | null;
  subject_id?: string | null;
  topic_id?: string | null;
}) => {
  if (!payload.user_id || !payload.subject_id || !payload.topic_id) {
    throw new Error('[FATAL] Missing required fields for DB write');
  }
};
