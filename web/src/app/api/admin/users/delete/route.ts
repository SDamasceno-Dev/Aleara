import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type DeleteResult = {
  email: string;
  removedAllowed: boolean;
  deletedUser: boolean;
  message?: string;
};

type MinimalIdentity = {
  identity_data?: { email?: string | null } | null;
} | null;

type MinimalUser = {
  id?: string | null;
  email?: string | null;
  identities?: MinimalIdentity[] | null;
};

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error) return { ok: false as const, supabase, status: 500 };
  if (!isAdmin) return { ok: false as const, supabase, status: 403 };
  return { ok: true as const, supabase };
}

async function findUserIdByEmail(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
  maxPages = 10,
  perPage = 1000,
): Promise<string | null> {
  const target = email.toLowerCase();
  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return null;
    const users = data?.users ?? [];
    const found = users.find(
      (u: MinimalUser) =>
        (u.email ?? '').toLowerCase() === target ||
        (u.identities ?? []).some(
          (id: MinimalIdentity) =>
            (id?.identity_data?.email ?? '').toLowerCase() === target,
        ),
    );
    if (found) return found.id ?? null;
    if (users.length < perPage) break;
  }
  return null;
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
  const admin = createSupabaseAdminClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const raw = (body ?? {}) as { emails?: unknown; hardDelete?: unknown };
  const emails: string[] = Array.isArray(raw.emails) ? (raw.emails as unknown[]).map((e) => String(e)) : [];
  const hardDelete = Boolean(raw.hardDelete);
  if (emails.length === 0) {
    return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
  }
  const re = /^[\w.!#$%&’*+/=?`{|}~^-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const list = Array.from(
    new Set(
      emails
        .map((e) =>
          String(e ?? '')
            .trim()
            .toLowerCase(),
        )
        .filter((e) => re.test(e)),
    ),
  );

  const results: DeleteResult[] = [];

  // Remove from allowlist first (using server client with RLS+is_admin)
  const { data: removed, error: remErr } = await supabase
    .from('allowed_emails')
    .delete()
    .in('email', list)
    .select('email');
  const removedRows = (removed ?? []) as Array<{ email: string }>;
  const removedSet = new Set<string>(removedRows.map((r) => r.email.toLowerCase()));

  if (remErr) {
    for (const email of list) {
      results.push({
        email,
        removedAllowed: false,
        deletedUser: false,
        message: remErr.message,
      });
    }
    return NextResponse.json({ ok: false, results }, { status: 400 });
  }

  if (hardDelete) {
    for (const email of list) {
      try {
        const userId = await findUserIdByEmail(admin, email);
        if (!userId) {
          results.push({
            email,
            removedAllowed: removedSet.has(email),
            deletedUser: false,
            message: 'User not found in auth',
          });
          continue;
        }
        // Delete profile (service role bypasses RLS)
        await admin.from('profiles').delete().eq('user_id', userId);
        // Delete auth user
        const { error: delErr } = await admin.auth.admin.deleteUser(userId);
        if (delErr) {
          results.push({
            email,
            removedAllowed: removedSet.has(email),
            deletedUser: false,
            message: delErr.message,
          });
          continue;
        }
        results.push({
          email,
          removedAllowed: removedSet.has(email),
          deletedUser: true,
        });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        results.push({
          email,
          removedAllowed: removedSet.has(email),
          deletedUser: false,
          message,
        });
      }
    }
  } else {
    for (const email of list) {
      results.push({
        email,
        removedAllowed: removedSet.has(email),
        deletedUser: false,
      });
    }
  }

  const removedAllowed = results.filter((r) => r.removedAllowed).length;
  const deletedUsers = results.filter((r) => r.deletedUser).length;
  const errors = results.filter((r) => r.message).length;
  const ok = errors === 0;
  return NextResponse.json(
    { ok, removedAllowed, deletedUsers, errors, results },
    { status: ok ? 200 : 400 },
  );
}
