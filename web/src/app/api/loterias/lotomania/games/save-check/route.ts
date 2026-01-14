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
    contestNo?: unknown;
  };
  const setId: string = String(parsed.setId ?? '');
  const draw: number[] = Array.isArray(parsed.draw)
    ? (parsed.draw as unknown[]).map((x) => {
        const n = Number(x);
        return n === 0 ? 100 : n; // Convert 0 to 100
      })
    : [];
  const contestNo: number = Number(parsed.contest ?? parsed.contestNo ?? 0);
  if (
    !setId ||
    draw.length !== 20 ||
    !Number.isInteger(contestNo) ||
    contestNo <= 0
  ) {
    return NextResponse.json(
      { error: 'Invalid input: draw must have exactly 20 numbers' },
      { status: 400 },
    );
  }

  const drawSet = new Set(draw);
  // Upsert check header
  const { data: checkRow, error: upErr } = await supabase
    .from('lotomania_checks')
    .upsert(
      {
        user_id: user.id,
        set_id: setId,
        contest_no: contestNo,
        draw_numbers: draw,
      },
      { onConflict: 'user_id,set_id,contest_no' },
    )
    .select('id')
    .single();
  if (upErr)
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  const checkId = checkRow.id as string;
  // Fetch items and compute matches
  const { data: items, error } = await supabase
    .from('lotomania_user_items')
    .select('position, numbers')
    .eq('set_id', setId)
    .order('position', { ascending: true });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const payload = (
    (items ?? []) as Array<{ position: number; numbers: number[] }>
  ).map((it) => {
    const nums = it.numbers ?? [];
    let m = 0;
    for (const n of nums) if (drawSet.has(n)) m += 1;
    // Matches should be between 15 and 20 for Lotomania
    return {
      check_id: checkId,
      position: it.position,
      numbers: nums,
      matches: m >= 15 && m <= 20 ? m : null,
    };
  });
  for (let i = 0; i < payload.length; i += 1000) {
    const batch = payload.slice(i, i + 1000);
    const { error: insErr } = await supabase
      .from('lotomania_check_items')
      .upsert(batch, { onConflict: 'check_id,position' });
    if (insErr)
      return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    checkId,
    contest: contestNo,
    total: payload.length,
  });
}
