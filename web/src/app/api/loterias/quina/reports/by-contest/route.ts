import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return new NextResponse(JSON.stringify({ error: 'Proibido' }), {
      status: 401,
    });

  const url = new URL(request.url);
  const contestNo = Number(url.searchParams.get('contestNo') || '0');
  if (!(contestNo > 0)) {
    return NextResponse.json({ error: 'Invalid contestNo' }, { status: 400 });
  }

  const { data: check, error: chkErr } = await supabase
    .from('quina_checks')
    .select('id, draw_numbers, checked_at')
    .eq('user_id', user.id)
    .eq('contest_no', contestNo)
    .maybeSingle();
  if (chkErr)
    return NextResponse.json({ error: chkErr.message }, { status: 500 });
  if (!check)
    return NextResponse.json(
      { error: 'No check found for this contest' },
      { status: 404 },
    );

  const checkId = check.id as string;
  const { data: items, error: itemsErr } = await supabase
    .from('quina_check_items')
    .select('position, numbers, matches')
    .eq('check_id', checkId)
    .order('position', { ascending: true });
  if (itemsErr)
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  let c2 = 0,
    c3 = 0,
    c4 = 0,
    c5 = 0;
  for (const r of items ?? []) {
    const m = (r.matches as number) ?? 0;
    if (m === 2) c2 += 1;
    else if (m === 3) c3 += 1;
    else if (m === 4) c4 += 1;
    else if (m === 5) c5 += 1;
  }
  const total = items?.length ?? 0;
  const hitRate = total > 0 ? (c2 + c3 + c4 + c5) / total : 0;

  return NextResponse.json({
    ok: true,
    contestNo,
    draw: (check.draw_numbers as number[]) ?? [],
    checkedAt: check.checked_at as string,
    kpis: { total, c2, c3, c4, c5, hitRate },
    items: (items ?? []).map((r) => ({
      position: r.position as number,
      numbers: (r.numbers as number[]) ?? [],
      matches: (r.matches as number) ?? 0,
    })),
  });
}
