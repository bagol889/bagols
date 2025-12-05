import { createClient } from '@supabase/supabase-js';

// Helper to safely get env vars without crashing if process is undefined
const getEnv = (key: string) => {
  try {
    return process.env[key];
  } catch (e) {
    return undefined;
  }
};

// --- BAGIAN INI DIUBAH ---
// Hapus string panjangnya, ganti dengan '' (kutip kosong)
// Supaya jika di Vercel lupa diisi, dia tidak pakai kunci default yang bocor
const SUPABASE_URL = getEnv('SUPABASE_URL') || ''; 
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY') || '';

// Create client
// Note: Jika URL kosong, createClient mungkin akan error di console browser,
// tapi itu bagus sebagai indikator bahwa Env Var di Vercel belum diset.
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);

export const isSupabaseConfigured = () => {
  try {
    // Cek apakah Environment Variable benar-benar ada
    return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  } catch (e) {
    return false;
  }
};