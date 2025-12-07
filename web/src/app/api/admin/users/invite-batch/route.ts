import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { env } from '@/env';

type InviteResult = {
  email: string;
  status: 'invited' | 'exists' | 'error';
  message?: string;
};

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error) return { ok: false as const, supabase, status: 500 };
  if (!isAdmin) return { ok: false as const, supabase, status: 403 };
  return { ok: true as const, supabase };
}

export async function POST(request: Request) {
  const adminAssert = await assertAdmin();
  if (!adminAssert.ok) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: adminAssert.status },
    );
  }
  const supabase = adminAssert.supabase;
  const { origin } = new URL(request.url);
  const baseUrl =
    env.SITE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL /* dummy to ensure tree-shake safe access */
      ? env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || origin
      : origin;
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
  const parsed = (body ?? {}) as { emails?: unknown; role?: unknown };
  const emails: string[] = Array.isArray(parsed.emails)
    ? (parsed.emails as unknown[]).map((e) => String(e))
    : [];
  const role = (parsed.role as 'USER' | 'ADMIN' | undefined) ?? 'USER';
  if (emails.length === 0) {
    return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
  }
  if (emails.length > 200) {
    return NextResponse.json(
      { error: 'Too many emails (max 200)' },
      { status: 400 },
    );
  }

  const { data: currentUserData } = await supabase.auth.getUser();
  const createdBy = currentUserData.user?.id ?? null;

  const admin = createSupabaseAdminClient();
  const re = /^[\w.!#$%&’*+/=?`{|}~^-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const normalized = Array.from(
    new Set(
      emails
        .map((e) =>
          String(e ?? '')
            .trim()
            .toLowerCase(),
        )
        .filter((e) => e.length > 0 && re.test(e)),
    ),
  );

  const results: InviteResult[] = [];
  for (const email of normalized) {
    try {
      // Insert into allowlist (idempotent via upsert on email)
      const { error: upsertErr } = await supabase
        .from('allowed_emails')
        .upsert({ email, created_by: createdBy }, { onConflict: 'email' });
      if (upsertErr) throw upsertErr;

      // Try inviting the user via Supabase Auth
      const { data, error: inviteErr } =
        await admin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${baseUrl}/auth/definir-senha?email=${encodeURIComponent(email)}`,
        });
      if (inviteErr) {
        // If already exists, mark as exists; otherwise error
        if (
          String(inviteErr.message || '')
            .toLowerCase()
            .includes('already registered')
        ) {
          results.push({
            email,
            status: 'exists',
            message: 'User already exists',
          });
          continue;
        }
        results.push({ email, status: 'error', message: inviteErr.message });
        continue;
      }
      // Optionally set profile role when user object exists
      const userId = data?.user?.id ?? null;
      if (userId) {
        await admin.from('profiles').upsert(
          {
            user_id: userId,
            role,
          },
          { onConflict: 'user_id' },
        );
      }
      results.push({ email, status: 'invited' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      results.push({
        email,
        status: 'error',
        message,
      });
    }
  }

  const invited = results.filter((r) => r.status === 'invited').length;
  const exists = results.filter((r) => r.status === 'exists').length;
  const errors = results.filter((r) => r.status === 'error').length;
  if (invited === 0 && exists === 0 && errors > 0) {
    const firstError =
      results.find((r) => r.status === 'error')?.message ?? 'Invite failed';
    return NextResponse.json(
      { ok: false, error: firstError, invited, exists, errors, results },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, invited, exists, errors, results });
}
