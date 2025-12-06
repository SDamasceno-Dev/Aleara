import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type AllowItem = {
  email: string;
  created_at: string | null;
  created_by: string | null;
};

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error) {
    return { ok: false as const, supabase, error };
  }
  if (!isAdmin) {
    return { ok: false as const, supabase, error: new Error('forbidden') };
  }
  return { ok: true as const, supabase };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  const limitRaw = Number(url.searchParams.get('limit') ?? '50');
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(200, Math.floor(limitRaw)))
    : 50;
  const cursor = url.searchParams.get('cursor') ?? null;

  if (q.length < 3) {
    return NextResponse.json(
      { error: 'Query term must be at least 3 characters' },
      { status: 400 },
    );
  }

  const admin = await assertAdmin();
  if (!admin.ok) {
    const status = admin.error?.message === 'forbidden' ? 403 : 500;
    return NextResponse.json({ error: 'Forbidden' }, { status });
  }
  const supabase = admin.supabase;

  const query = supabase
    .from('allowed_emails')
    .select('email, created_at, created_by')
    .ilike('email', `%${q}%`)
    .order('email', { ascending: true })
    .limit(limit);

  if (cursor) {
    // Lexicographic pagination on email ascending
    query.gt('email', cursor);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Array<{ email: string; created_at?: string | null; created_by?: string | null }>;
  const items: AllowItem[] = rows.map((r) => ({
    email: r.email,
    created_at: r.created_at ?? null,
    created_by: r.created_by ?? null,
  }));

  const nextCursor =
    items.length === limit ? (items[items.length - 1]?.email ?? null) : null;
  return NextResponse.json({ items, nextCursor });
}

export async function POST(request: Request) {
  const admin = await assertAdmin();
  if (!admin.ok) {
    const status = admin.error?.message === 'forbidden' ? 403 : 500;
    return NextResponse.json({ error: 'Forbidden' }, { status });
  }
  const supabase = admin.supabase;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = (body ?? {}) as { email?: unknown };
  const emailRaw = String(parsed.email ?? '').trim();
  if (!emailRaw) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }
  const email = emailRaw.toLowerCase();
  const re = /^[\w.!#$%&’*+/=?`{|}~^-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!re.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const { data: userData } = await supabase.auth.getUser();
  const createdBy = userData.user?.id ?? null;

  const { error } = await supabase
    .from('allowed_emails')
    .upsert({ email, created_by: createdBy }, { onConflict: 'email' });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = await assertAdmin();
  if (!admin.ok) {
    const status = admin.error?.message === 'forbidden' ? 403 : 500;
    return NextResponse.json({ error: 'Forbidden' }, { status });
  }
  const supabase = admin.supabase;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = (body ?? {}) as { emails?: unknown };
  const emails: string[] = Array.isArray(parsed.emails) ? (parsed.emails as unknown[]).map((e) => String(e)) : [];
  if (emails.length === 0) {
    return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
  }
  if (emails.length > 200) {
    return NextResponse.json(
      { error: 'Too many emails (max 200)' },
      { status: 400 },
    );
  }

  const normalized = emails
    .map((e) =>
      String(e ?? '')
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
  const { data, error } = await supabase
    .from('allowed_emails')
    .delete()
    .in('email', normalized)
    .select('email');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const removedRows = (data ?? []) as Array<{ email: string }>;
  return NextResponse.json({ ok: true, removed: removedRows.length });
}
