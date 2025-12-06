function validateSupabaseUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (!u.protocol.startsWith('http')) throw new Error('Invalid protocol');
    if (u.pathname !== '/' && u.pathname !== '')
      throw new Error('URL must not have a path');
    return u.origin;
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

export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: (() => {
    const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
    if (!raw) {
      const msg =
        'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL';
      if (process.env.NODE_ENV === 'production') throw new Error(msg);
      // eslint-disable-next-line no-console
      console.error(msg);
      return '';
    }
    return validateSupabaseUrl(raw);
  })(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: (() => {
    const raw = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
    if (!raw) {
      const msg =
        'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY';
      if (process.env.NODE_ENV === 'production') throw new Error(msg);
      // eslint-disable-next-line no-console
      console.error(msg);
      return '';
    }
    return raw;
  })(),
};
