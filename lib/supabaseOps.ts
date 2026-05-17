import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Database } from '../src/infrastructure/database';

/**
 * LEGACY SUPABASE OPS (PROXIED)
 * 
 * This file is now a proxy to src/infrastructure/database.
 * All new code should use the Database class directly.
 */

export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error('[INFRASTRUCTURE ERROR] Supabase client unavailable');
  }
  return supabase;
};

export const getAuthenticatedUser = async (): Promise<User> => {
  return Database.getAuthenticatedUser();
};

export const logSupabaseError = (table: string, action: string, error: unknown) => {
  console.error(`[SUPABASE ERROR] [${table}] [${action}]`, error);
};

export const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

/**
 * @deprecated Use Database.governedWrite instead
 */
export const assertRequiredWriteFields = (payload: {
  user_id?: string | null;
  subject_id?: string | null;
  topic_id?: string | null;
}) => {
  if (!payload.user_id || !payload.subject_id || !payload.topic_id) {
    throw new Error('[FATAL] Missing required fields for DB write');
  }
};
