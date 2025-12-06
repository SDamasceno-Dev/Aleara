import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const setId: string = String(body?.setId ?? '');
  const contestNo: number = Number(body?.contestNo ?? 0);
  const title: string | undefined = body?.title
    ? String(body.title)
    : undefined;
  if (!setId || !Number.isInteger(contestNo) || contestNo <= 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  // Load items from set
  const { data: items, error } = await supabase
    .from('quina_user_items')
    .select('position, numbers')
    .eq('set_id', setId)
    .order('position', { ascending: true });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  // Upsert list
  const { data: listRow, error: listErr } = await supabase
    .from('quina_bet_lists')
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
    .from('quina_bet_list_items')
    .delete()
    .eq('list_id', listId);
  if (delErr)
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  const payload = (items ?? []).map((it: any) => ({
    list_id: listId,
    position: it.position as number,
    numbers: (it.numbers as number[]) ?? [],
  }));
  for (let i = 0; i < payload.length; i += 1000) {
    const batch = payload.slice(i, i + 1000);
    const { error: insErr } = await supabase
      .from('quina_bet_list_items')
      .insert(batch);
    if (insErr)
      return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, total: payload.length });
}
