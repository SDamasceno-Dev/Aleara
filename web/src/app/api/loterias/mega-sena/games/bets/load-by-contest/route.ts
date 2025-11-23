import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any = {};
  try {
    body = await request.json();
  } catch {}
  const contestNo: number = Number(body?.contestNo || 0);
  const mode: 'append' | 'replace' = body?.mode === 'append' ? 'append' : 'replace';
  let setId: string | null = body?.setId ? String(body.setId) : null;
  if (!(contestNo > 0))
    return NextResponse.json({ error: 'Invalid contest number' }, { status: 400 });

  // Locate bet list for (user, contestNo)
  const { data: list, error: listErr } = await supabase
    .from('megasena_bet_lists')
    .select('id, contest_no')
    .eq('user_id', user.id)
    .eq('contest_no', contestNo)
    .maybeSingle();
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });
  if (!list) return NextResponse.json({ error: 'No saved bets for this contest' }, { status: 404 });

  const listId = list.id as string;
  const { data: items, error: itemsErr } = await supabase
    .from('megasena_bet_list_items')
    .select('position, numbers')
    .eq('list_id', listId)
    .order('position', { ascending: true });
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  if (!items || items.length === 0) return NextResponse.json({ ok: true, loaded: 0 });

  // Choose or create set
  if (!setId) {
    // create a set with source_numbers = first bet's numbers
    const first = (items[0].numbers as number[]).slice().sort((a, b) => a - b);
    const { data: created, error: createErr } = await supabase
      .from('megasena_user_sets')
      .insert({
        user_id: user.id,
        source_numbers: first,
        total_combinations: 1,
        sample_size: 0,
      })
      .select('id')
      .single();
    if (createErr || !created)
      return NextResponse.json({ error: createErr?.message || 'Cannot create set' }, { status: 500 });
    setId = created.id as string;
  }

  // Load into megasena_user_items
  let maxPos = -1;
  if (mode === 'append') {
    const { data: existing, error: exErr } = await supabase
      .from('megasena_user_items')
      .select('position')
      .eq('set_id', setId!);
    if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });
    maxPos = Math.max(-1, ...((existing ?? []).map((r) => r.position as number)));
  } else {
    // replace
    await supabase.from('megasena_user_items').delete().eq('set_id', setId!);
    maxPos = -1;
  }

  const rows = (items ?? []).map((r: any) => ({
    set_id: setId!,
    position: ++maxPos,
    numbers: (r.numbers as number[]).slice().sort((a, b) => a - b),
    matches: null as number | null,
  }));

  if (rows.length > 0) {
    const { error: insErr } = await supabase.from('megasena_user_items').insert(rows);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  // Fetch all items for the set to return to client and update sample_size accurately
  const { data: allItems, error: allErr } = await supabase
    .from('megasena_user_items')
    .select('position, numbers')
    .eq('set_id', setId!)
    .order('position', { ascending: true });
  if (allErr) return NextResponse.json({ error: allErr.message }, { status: 500 });

  await supabase
    .from('megasena_user_sets')
    .update({ sample_size: (allItems?.length ?? 0) })
    .eq('id', setId!);

  return NextResponse.json({
    ok: true,
    setId,
    loaded: rows.length,
    mode,
    items: (allItems ?? []).map((r: any) => ({
      position: r.position as number,
      numbers: (r.numbers as number[]) ?? [],
    })),
  });
}


