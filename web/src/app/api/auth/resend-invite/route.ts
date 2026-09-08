import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { env } from '@/env';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
  if (adminError) {
    return NextResponse.json(
      { error: 'Unable to verify authorization' },
      { status: 500 },
    );
  }
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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
      return NextResponse.json(
        { error: 'Unable to send invitation' },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Unable to send invitation' },
      { status: 500 },
    );
  }
}
