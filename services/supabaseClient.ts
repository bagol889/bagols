import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  try { return process.env[key]; } catch (e) { return undefined; }
};
const SUPABASE_URL = getEnv('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY') || '';

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder'
);

export const isSupabaseConfigured = () => {
  try {
    return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  } catch (e) { return false; }
};
