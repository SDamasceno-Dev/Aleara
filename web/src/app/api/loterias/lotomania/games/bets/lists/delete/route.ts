import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = (body ?? {}) as { listIds?: unknown };
  const listIds: string[] = Array.isArray(parsed.listIds)
    ? (parsed.listIds as unknown[]).map((v) => String(v))
    : [];
  if (!listIds.length)
    return NextResponse.json({ error: 'No listIds' }, { status: 400 });
  const { error } = await supabase
    .from('lotomania_bet_lists')
    .delete()
    .in('id', listIds)
    .eq('user_id', user.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: listIds.length });
}
