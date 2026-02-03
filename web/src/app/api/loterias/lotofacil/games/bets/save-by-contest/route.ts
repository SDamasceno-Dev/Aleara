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
  const setId = String(parsed.setId ?? '');
  const contestNo = Number(parsed.contestNo ?? 0);
  const title = parsed.title ? String(parsed.title).trim() : null;

  if (!setId || !Number.isInteger(contestNo) || contestNo <= 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // Verify set ownership
  const { data: setData, error: setErr } = await supabase
    .from('lotofacil_user_sets')
    .select('id, user_id')
    .eq('id', setId)
    .single();
  if (setErr || !setData)
    return NextResponse.json({ error: 'Set not found' }, { status: 404 });
  if (setData.user_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Fetch all items from set
  const { data: items, error: itemsErr } = await supabase
    .from('lotofacil_user_items')
    .select('position, numbers')
    .eq('set_id', setId)
    .order('position', { ascending: true });
  if (itemsErr)
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items in set' }, { status: 400 });
  }

  // Check if list already exists for this contest
  const { data: existingList } = await supabase
    .from('lotofacil_bet_lists')
    .select('id')
    .eq('user_id', user.id)
    .eq('contest_no', contestNo)
    .single();

  let listId: string;
  if (existingList) {
    listId = existingList.id as string;
    // Delete existing items
    await supabase
      .from('lotofacil_bet_list_items')
      .delete()
      .eq('list_id', listId);
    // Update title if provided
    if (title) {
      await supabase
        .from('lotofacil_bet_lists')
        .update({ title })
        .eq('id', listId);
    }
  } else {
    // Create new list
    const { data: newList, error: newListErr } = await supabase
      .from('lotofacil_bet_lists')
      .insert({
        user_id: user.id,
        contest_no: contestNo,
        title,
      })
      .select('id')
      .single();
    if (newListErr)
      return NextResponse.json({ error: newListErr.message }, { status: 500 });
    listId = newList.id as string;
  }

  // Insert items
  const toInsert = (
    items as Array<{ position: number; numbers: number[] }>
  ).map((it) => ({
    list_id: listId,
    position: it.position,
    numbers: it.numbers,
  }));

  for (let i = 0; i < toInsert.length; i += 1000) {
    const batch = toInsert.slice(i, i + 1000);
    const { error } = await supabase
      .from('lotofacil_bet_list_items')
      .insert(batch);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    listId,
    contestNo,
    total: toInsert.length,
  });
}
