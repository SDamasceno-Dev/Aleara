import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions as SupabaseCookieOptions } from '@supabase/ssr';
import { env } from '@/env';

// Local minimal cookie options compatible with Next.js cookies().set(...)
type NextCookieOptionsLocal = {
  expires?: Date;
  maxAge?: number;
  path?: string;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  httpOnly?: boolean;
  domain?: string;
};

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
        cookieStore.set(name, value, options as unknown as NextCookieOptionsLocal);
      },
      remove(name: string, options: SupabaseCookieOptions) {
        cookieStore.set(name, '', {
          ...(options as unknown as NextCookieOptionsLocal),
          maxAge: 0,
        });
      },
    },
  });
}
