import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions as SupabaseCookieOptions } from '@supabase/ssr';
import type { CookieOptions as NextCookieOptions } from 'next/headers';
import { env } from '@/env';

export async function createSupabaseServerClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: SupabaseCookieOptions) {
        cookieStore.set(name, value, options as NextCookieOptions);
      },
      remove(name: string, options: SupabaseCookieOptions) {
        cookieStore.set(name, '', {
          ...(options as NextCookieOptions),
          maxAge: 0,
        });
      },
    },
  });
}
