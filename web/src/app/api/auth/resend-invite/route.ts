import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { env } from '@/env';

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const baseUrl = env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || origin;
  if (
    process.env.NODE_ENV === 'production' &&
    !(env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL)
  ) {
    return NextResponse.json(
      {
        error:
          'Missing SITE_URL/NEXT_PUBLIC_SITE_URL in production. Configure your public app URL.',
      },
      { status: 500 },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = (body ?? {}) as { email?: unknown };
  const email = String(parsed.email ?? '')
    .trim()
    .toLowerCase();
  const re = /^[\w.!#$%&’*+/=?`{|}~^-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!re.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${baseUrl}/auth/definir-senha?email=${encodeURIComponent(email)}`,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
