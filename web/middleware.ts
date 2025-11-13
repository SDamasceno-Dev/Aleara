import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/app')) {
    // Supabase sets auth cookies named like: sb-<project-ref>-auth-token / refresh-token
    const hasSupabaseSession = request.cookies
      .getAll()
      .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token') && !!c.value);
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
