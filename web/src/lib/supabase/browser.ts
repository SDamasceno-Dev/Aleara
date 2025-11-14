import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/env';

export function createSupabaseBrowserClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createBrowserClient(url, anonKey);
}
