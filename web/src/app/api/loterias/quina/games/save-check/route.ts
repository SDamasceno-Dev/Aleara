import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const setId: string = String(body?.setId ?? '');
  const draw: number[] = Array.isArray(body?.draw) ? body.draw.map((x: any) => Number(x)) : [];
  const contestNo: number = Number(body?.contest ?? body?.contestNo ?? 0);
  if (!setId || draw.length !== 5 || !Number.isInteger(contestNo) || contestNo <= 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const drawSet = new Set(draw);
  // Upsert check header
  const { data: checkRow, error: upErr } = await supabase
    .from('quina_checks')
    .upsert(
      { user_id: user.id, set_id: setId, contest_no: contestNo, draw_numbers: draw },
      { onConflict: 'user_id,set_id,contest_no' },
    )
    .select('id')
    .single();
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  const checkId = checkRow.id as string;
  // Fetch items and compute matches
  const { data: items, error } = await supabase
    .from('quina_user_items')
    .select('position, numbers')
    .eq('set_id', setId)
    .order('position', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const payload = (items ?? []).map((it: any) => {
    const nums = (it.numbers as number[]) ?? [];
    let m = 0;
    for (const n of nums) if (drawSet.has(n)) m += 1;
    return { check_id: checkId, position: it.position as number, numbers: nums, matches: m };
  });
  for (let i = 0; i < payload.length; i += 1000) {
    const batch = payload.slice(i, i + 1000);
    const { error: insErr } = await supabase
      .from('quina_check_items')
      .upsert(batch, { onConflict: 'check_id,numbers' });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, checkId, contest: contestNo, total: payload.length });
}


