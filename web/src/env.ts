function validateSupabaseUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (!u.protocol.startsWith('http')) throw new Error('Invalid protocol');
    if (!u.host.endsWith('.supabase.co'))
      throw new Error('Must be a supabase.co host');
    if (u.pathname !== '/' && u.pathname !== '')
      throw new Error('URL must not have a path');
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
  // Use direct property access so Next.js can inline on the client
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
  // Server-only: never import this in client components
  SUPABASE_SERVICE_ROLE_KEY: (() => {
    const raw = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
    if (!raw) {
      const msg =
        'Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY';
      if (process.env.NODE_ENV === 'production') {
        throw new Error(msg);
      }
      // eslint-disable-next-line no-console
      console.warn(msg);
      return '';
    }
    return raw;
  })(),
  // Preferred absolute base URL for building auth links in emails (server-side only)
  SITE_URL: (() => {
    const raw = (
      process.env.SITE_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      ''
    ).trim();
    if (!raw) {
      // optional; warn only
      // eslint-disable-next-line no-console
      console.warn(
        'Optional SITE_URL/NEXT_PUBLIC_SITE_URL not set. Falling back to request origin at runtime.',
      );
      return '';
    }
    try {
      const u = new URL(raw);
      if (!/^https?:$/.test(u.protocol)) throw new Error('Invalid protocol');
      return u.origin;
    } catch (e) {
      const msg = `Invalid SITE_URL/NEXT_PUBLIC_SITE_URL: ${String(e)}`;
      if (process.env.NODE_ENV === 'production') {
        // eslint-disable-next-line no-console
        console.warn(msg);
      } else {
        // eslint-disable-next-line no-console
        console.error(msg);
      }
      return '';
    }
  })(),
};
