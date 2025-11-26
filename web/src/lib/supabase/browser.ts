import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '@/env-client';

export function createSupabaseBrowserClient() {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createBrowserClient(url, anonKey, {
    auth: {
      flowType: 'implicit',
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}
