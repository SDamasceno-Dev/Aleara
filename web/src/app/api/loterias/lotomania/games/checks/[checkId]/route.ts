import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ checkId: string }> },
) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { checkId } = await params;
  if (!checkId)
    return NextResponse.json({ error: 'Missing checkId' }, { status: 400 });

  const { data: check, error: chkErr } = await supabase
    .from('lotomania_checks')
    .select('id, contest_no, draw_numbers, checked_at, set_id')
    .eq('id', checkId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (chkErr)
    return NextResponse.json({ error: chkErr.message }, { status: 500 });
  if (!check)
    return NextResponse.json(
      { error: 'Check not found' },
      { status: 404 },
    );

  const { data: items, error: itemsErr } = await supabase
    .from('lotomania_check_items')
    .select('position, numbers, matches')
    .eq('check_id', checkId)
    .order('position', { ascending: true });
  if (itemsErr)
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  let c0 = 0,
    c15 = 0,
    c16 = 0,
    c17 = 0,
    c18 = 0,
    c19 = 0,
    c20 = 0;
  for (const r of items ?? []) {
    const m = (r.matches as number) ?? 0;
    if (m === 0) c0 += 1;
    else if (m === 15) c15 += 1;
    else if (m === 16) c16 += 1;
    else if (m === 17) c17 += 1;
    else if (m === 18) c18 += 1;
    else if (m === 19) c19 += 1;
    else if (m === 20) c20 += 1;
  }
  const total = items?.length ?? 0;
  const hitRate =
    total > 0 ? (c0 + c15 + c16 + c17 + c18 + c19 + c20) / total : 0;

  return NextResponse.json({
    ok: true,
    check: {
      id: check.id as string,
      contestNo: check.contest_no as number,
      drawNumbers: (check.draw_numbers as number[]) ?? [],
      checkedAt: check.checked_at as string,
      setId: check.set_id as string | null,
    },
    kpis: { total, c0, c15, c16, c17, c18, c19, c20, hitRate },
    items: (items ?? []).map((r) => ({
      position: r.position as number,
      numbers: (r.numbers as number[]) ?? [],
      matches: (r.matches as number) ?? 0,
    })),
  });
}
