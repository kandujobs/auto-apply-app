import { createClient } from '@supabase/supabase-js';

// Prefer .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) for your project. Fallback avoids white screen if unset.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDIxOTIwMDAsImV4cCI6MTk1Nzc2ODAwMH0.placeholder';
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    '[Supabase] Using placeholder config. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env or .env.local (Dashboard → Project Settings → API).'
  );
} else if (import.meta.env.DEV) {
  console.log('[Supabase] Using URL:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'job-app-frontend'
    }
  }
});

// Add error handling for network issues
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // User signed out
  } else if (event === 'SIGNED_IN') {
    // User signed in
  } else if (event === 'TOKEN_REFRESHED') {
    // Token refreshed
  }
});

// Helper function to check Supabase connectivity
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    return !error;
  } catch (error) {
    console.warn('Supabase connection check failed:', error);
    return false;
  }
};
