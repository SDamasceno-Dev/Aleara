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
    draw?: unknown;
    contest?: unknown;
  };
  const setId = String(parsed.setId ?? '');
  const draw: number[] = Array.isArray(parsed.draw)
    ? (parsed.draw as unknown[]).map((x) => Number(x))
    : [];
  const contest = Number(parsed.contest ?? 0);
  // Lotofácil: 15 números sorteados
  if (!setId || draw.length !== 15 || !Number.isInteger(contest) || contest <= 0)
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

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

  const drawSet = new Set(draw);

  // Fetch items with current matches
  const { data: items, error: itemsErr } = await supabase
    .from('lotofacil_user_items')
    .select('position, numbers, matches')
    .eq('set_id', setId)
    .order('position', { ascending: true });
  if (itemsErr)
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  // Create check record
  const { data: checkInsert, error: checkErr } = await supabase
    .from('lotofacil_checks')
    .insert({
      user_id: user.id,
      set_id: setId,
      contest_no: contest,
      draw_numbers: draw,
    })
    .select('id')
    .single();
  if (checkErr)
    return NextResponse.json({ error: checkErr.message }, { status: 500 });
  const checkId = checkInsert.id as string;

  // Insert check items
  const checkItems = (
    (items ?? []) as Array<{
      position: number;
      numbers: number[];
      matches?: number | null;
    }>
  ).map((it) => {
    const nums = it.numbers ?? [];
    let m = 0;
    for (const n of nums) if (drawSet.has(n)) m += 1;
    return {
      check_id: checkId,
      position: it.position,
      numbers: nums,
      matches: m,
    };
  });

  for (let i = 0; i < checkItems.length; i += 1000) {
    const batch = checkItems.slice(i, i + 1000);
    const { error } = await supabase.from('lotofacil_check_items').insert(batch);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    checkId,
    contest,
    total: checkItems.length,
  });
}
