import { NextResponse } from 'next/server';

// NOTE:
// We removed cookie-based auth gating here because Supabase client-side auth
// persists tokens in localStorage, não em cookies httpOnly. O gate correto
// já é feito no layout de /app com o server client (SSR) que redireciona
// para "/" quando não há sessão. Mantemos o middleware como pass-through.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/app', '/app/:path*'],
};
