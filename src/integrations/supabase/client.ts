import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Safe storage adapter: uses window.localStorage in browser, handles SSR and incognito storage gracefully
const getStorage = () => {
  if (typeof window === 'undefined') return undefined;
  try {
    const testKey = '__scalvea_test_storage__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (e) {
    console.warn('[Supabase Client] localStorage not available; using in-memory session:', e);
    return undefined;
  }
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: getStorage(),
    storageKey: 'sb-dtehgajreecaonqalxlf-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});