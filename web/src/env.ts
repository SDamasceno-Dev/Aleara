function requireEnv(name: string): string {
  const value = (process.env as Record<string, string | undefined>)[name];
  if (!value || !value.trim()) {
    const msg = `Missing required environment variable: ${name}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    } else {
      // eslint-disable-next-line no-console
      console.error(msg);
    }
    return '';
  }
  return value.trim();
}

function validateSupabaseUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (!u.protocol.startsWith('http')) throw new Error('Invalid protocol');
    if (!u.host.endsWith('.supabase.co')) throw new Error('Must be a supabase.co host');
    if (u.pathname !== '/' && u.pathname !== '') throw new Error('URL must not have a path');
    return u.origin; // normalized without trailing path
  } catch (e) {
    const msg = `Invalid NEXT_PUBLIC_SUPABASE_URL: ${String(e)}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    } else {
      // eslint-disable-next-line no-console
      console.error(msg);
    }
    return raw;
  }
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: validateSupabaseUrl(requireEnv('NEXT_PUBLIC_SUPABASE_URL')),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
};


