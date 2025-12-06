import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any = {};
  try {
    body = await request.json();
  } catch {}
  const setId: string = String(body?.setId || '');
  const contestNo: number = Number(body?.contestNo || 0);
  const title: string | undefined = body?.title
    ? String(body.title)
    : undefined;

  if (!setId)
    return NextResponse.json({ error: 'Missing setId' }, { status: 400 });
  if (!(contestNo > 0))
    return NextResponse.json(
      { error: 'Invalid contest number' },
      { status: 400 },
    );

  // Upsert bet list for (user, contestNo)
  let listId: string | null = null;
  {
    const { data: existing, error } = await supabase
      .from('megasena_bet_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('contest_no', contestNo)
      .maybeSingle();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    if (existing) {
      listId = existing.id as string;
      if (title) {
        await supabase
          .from('megasena_bet_lists')
          .update({ title })
          .eq('id', listId);
      }
    } else {
      const { data: created, error: insErr } = await supabase
        .from('megasena_bet_lists')
        .insert({
          user_id: user.id,
          contest_no: contestNo,
          title: title ?? null,
        })
        .select('id')
        .single();
      if (insErr || !created)
        return NextResponse.json(
          { error: insErr?.message || 'Cannot create list' },
          { status: 500 },
        );
      listId = created.id as string;
    }
  }

  // Fetch all items from the set
  const { data: items, error: itemsErr } = await supabase
    .from('megasena_user_items')
    .select('position, numbers')
    .eq('set_id', setId)
    .order('position', { ascending: true });
  if (itemsErr)
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  // Replace items in the list (idempotent via unique constraint)
  const rows =
    (items ?? []).map((r: any, idx: number) => ({
      list_id: listId!,
      position: idx,
      numbers: r.numbers as number[],
    })) ?? [];

  // Clear existing then insert to keep positions compact
  await supabase
    .from('megasena_bet_list_items')
    .delete()
    .eq('list_id', listId!);
  if (rows.length > 0) {
    const { error: insErr } = await supabase
      .from('megasena_bet_list_items')
      .insert(rows);
    if (insErr)
      return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, listId, contestNo, total: rows.length });
}
