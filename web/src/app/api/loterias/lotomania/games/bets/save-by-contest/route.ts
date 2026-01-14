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
  const parsed = (body ?? {}) as {
    setId?: unknown;
    contestNo?: unknown;
    title?: unknown;
  };
  const setId: string = String(parsed.setId ?? '');
  const contestNo: number = Number(parsed.contestNo ?? 0);
  const title: string | undefined =
    parsed.title != null ? String(parsed.title) : undefined;
  if (!setId || !Number.isInteger(contestNo) || contestNo <= 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  // Load items from set
  const { data: items, error } = await supabase
    .from('lotomania_user_items')
    .select('position, numbers')
    .eq('set_id', setId)
    .order('position', { ascending: true });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  // Upsert list
  const { data: listRow, error: listErr } = await supabase
    .from('lotomania_bet_lists')
    .upsert(
      { user_id: user.id, contest_no: contestNo, title: title ?? null },
      { onConflict: 'user_id,contest_no' },
    )
    .select('id')
    .single();
  if (listErr)
    return NextResponse.json({ error: listErr.message }, { status: 500 });
  const listId = listRow.id as string;
  // Replace items
  const { error: delErr } = await supabase
    .from('lotomania_bet_list_items')
    .delete()
    .eq('list_id', listId);
  if (delErr)
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  const payload = (
    (items ?? []) as Array<{ position: number; numbers: number[] }>
  ).map((it) => ({
    list_id: listId,
    position: it.position,
    numbers: it.numbers ?? [],
  }));
  for (let i = 0; i < payload.length; i += 1000) {
    const batch = payload.slice(i, i + 1000);
    const { error: insErr } = await supabase
      .from('lotomania_bet_list_items')
      .insert(batch);
    if (insErr)
      return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, total: payload.length });
}
