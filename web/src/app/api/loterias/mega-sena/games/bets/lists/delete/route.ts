import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {}
  const parsed = (body ?? {}) as { listIds?: unknown; deleteAll?: unknown };
  const ids: string[] = Array.isArray(parsed.listIds)
    ? (parsed.listIds as unknown[]).map((v) => String(v))
    : [];
  const deleteAll: boolean = Boolean(parsed.deleteAll);

  let query = supabase
    .from('megasena_bet_lists')
    .delete({ count: 'exact' })
    .eq('user_id', user.id);
  if (!deleteAll) {
    if (ids.length === 0)
      return NextResponse.json(
        { error: 'No listIds provided' },
        { status: 400 },
      );
    query = query.in('id', ids);
  }
  const { error, count } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: count ?? 0 });
}
