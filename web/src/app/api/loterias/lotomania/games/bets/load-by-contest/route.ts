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
    contestNo?: unknown;
    mode?: unknown;
    setId?: unknown;
  };
  const contestNo: number = Number(parsed.contestNo ?? 0);
  const mode: 'append' | 'replace' =
    parsed.mode === 'replace' ? 'replace' : 'append';
  const setId: string | undefined =
    parsed.setId != null ? String(parsed.setId) : undefined;
  if (!Number.isInteger(contestNo) || contestNo <= 0)
    return NextResponse.json({ error: 'Invalid contestNo' }, { status: 400 });

  const { data: list } = await supabase
    .from('lotomania_bet_lists')
    .select('id')
    .eq('user_id', user.id)
    .eq('contest_no', contestNo)
    .maybeSingle();
  if (!list)
    return NextResponse.json({ error: 'List not found' }, { status: 404 });
  const listId = list.id as string;
  const { data: items } = await supabase
    .from('lotomania_bet_list_items')
    .select('position, numbers')
    .eq('list_id', listId)
    .order('position', { ascending: true });
  const toLoad = ((items ?? []) as Array<{ numbers: number[] }>).map((it) => ({
    numbers: it.numbers ?? [],
  }));
  if (!toLoad.length) return NextResponse.json({ loaded: 0, items: [] });

  let targetSetId = setId;
  if (!targetSetId) {
    // create new set with first item's numbers as source
    const src = toLoad[0].numbers;
    const { data: created, error: cErr } = await supabase
      .from('lotomania_user_sets')
      .insert({
        user_id: user.id,
        source_numbers: src, // Preserve order
        total_combinations: 0,
        sample_size: 0,
      })
      .select('id')
      .single();
    if (cErr)
      return NextResponse.json({ error: cErr.message }, { status: 500 });
    targetSetId = created.id as string;
  } else if (mode === 'replace') {
    await supabase
      .from('lotomania_user_items')
      .delete()
      .eq('set_id', targetSetId);
  }

  // Determine next position if append
  let nextPos = 0;
  if (mode === 'append') {
    const { data: last } = await supabase
      .from('lotomania_user_items')
      .select('position')
      .eq('set_id', targetSetId)
      .order('position', { ascending: false })
      .limit(1);
    if (last && last.length) nextPos = (last[0].position as number) + 1;
  }
  const payload = toLoad.map((it, i) => ({
    set_id: targetSetId!,
    position: mode === 'append' ? nextPos + i : i,
    numbers: it.numbers,
  }));
  for (let i = 0; i < payload.length; i += 1000) {
    const batch = payload.slice(i, i + 1000);
    const { error: insErr } = await supabase
      .from('lotomania_user_items')
      .insert(batch);
    if (insErr)
      return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  await supabase
    .from('lotomania_user_sets')
    .update({ sample_size: payload.length })
    .eq('id', targetSetId!);
  return NextResponse.json({
    setId: targetSetId,
    loaded: payload.length,
    items: payload.map((p) => ({ position: p.position, numbers: p.numbers })),
  });
}
