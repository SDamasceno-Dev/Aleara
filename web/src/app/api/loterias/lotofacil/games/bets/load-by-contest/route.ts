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
  const contestNo = Number(parsed.contestNo ?? 0);
  const mode = String(parsed.mode ?? 'replace');
  let setId = parsed.setId ? String(parsed.setId) : null;

  if (!Number.isInteger(contestNo) || contestNo <= 0) {
    return NextResponse.json({ error: 'Invalid contestNo' }, { status: 400 });
  }

  // Find list for this contest
  const { data: list, error: listErr } = await supabase
    .from('lotofacil_bet_lists')
    .select('id')
    .eq('user_id', user.id)
    .eq('contest_no', contestNo)
    .single();
  if (listErr || !list) {
    return NextResponse.json(
      { error: 'No list found for this contest' },
      { status: 404 },
    );
  }

  // Fetch items
  const { data: items, error: itemsErr } = await supabase
    .from('lotofacil_bet_list_items')
    .select('position, numbers')
    .eq('list_id', list.id)
    .order('position', { ascending: true });
  if (itemsErr)
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items in list' }, { status: 400 });
  }

  // If no setId, create one
  if (!setId) {
    const firstItem = items[0] as { numbers: number[] };
    const { data: newSet, error: newSetErr } = await supabase
      .from('lotofacil_user_sets')
      .insert({
        user_id: user.id,
        source_numbers: firstItem.numbers,
        total_combinations: items.length,
        sample_size: items.length,
      })
      .select('id')
      .single();
    if (newSetErr)
      return NextResponse.json({ error: newSetErr.message }, { status: 500 });
    setId = newSet.id as string;
  } else {
    // Verify ownership
    const { data: setData, error: setErr } = await supabase
      .from('lotofacil_user_sets')
      .select('id, user_id')
      .eq('id', setId)
      .single();
    if (setErr || !setData)
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    if (setData.user_id !== user.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (mode === 'replace') {
      // Delete existing items
      await supabase.from('lotofacil_user_items').delete().eq('set_id', setId);
    }
  }

  // Get max position if appending
  let startPosition = 0;
  if (mode === 'append') {
    const { data: existingItems } = await supabase
      .from('lotofacil_user_items')
      .select('position')
      .eq('set_id', setId)
      .order('position', { ascending: false })
      .limit(1);
    if (existingItems && existingItems.length > 0) {
      startPosition = (existingItems[0].position as number) + 1;
    }
  }

  // Insert items
  const toInsert = (
    items as Array<{ position: number; numbers: number[] }>
  ).map((it, idx) => ({
    set_id: setId,
    position: startPosition + idx,
    numbers: it.numbers,
  }));

  for (let i = 0; i < toInsert.length; i += 1000) {
    const batch = toInsert.slice(i, i + 1000);
    const { error } = await supabase.from('lotofacil_user_items').insert(batch);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update sample_size
  const { count } = await supabase
    .from('lotofacil_user_items')
    .select('position', { count: 'exact' })
    .eq('set_id', setId);
  await supabase
    .from('lotofacil_user_sets')
    .update({ sample_size: count ?? 0 })
    .eq('id', setId);

  return NextResponse.json({
    setId,
    loaded: toInsert.length,
    items: toInsert.map((it) => ({
      position: it.position,
      numbers: it.numbers,
    })),
  });
}
