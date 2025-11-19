import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/app')) {
    // Supabase session requires both auth/access token and refresh token
    const all = request.cookies.getAll();
    const hasAuthToken = all.some(
      (c) =>
        c.name.startsWith('sb-') &&
        (c.name.endsWith('-auth-token') || c.name.endsWith('-access-token')) &&
        c.value != null &&
        c.value !== '',
    );
    const hasRefreshToken = all.some(
      (c) =>
        c.name.startsWith('sb-') &&
        c.name.endsWith('-refresh-token') &&
        c.value != null &&
        c.value !== '',
    );
    const hasSupabaseSession = hasAuthToken && hasRefreshToken;
    if (!hasSupabaseSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/app', '/app/:path*'],
};
