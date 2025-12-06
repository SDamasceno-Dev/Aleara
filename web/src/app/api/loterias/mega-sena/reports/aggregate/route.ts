import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const from = url.searchParams.get('from') || undefined; // ISO
  const to = url.searchParams.get('to') || undefined; // ISO

  // 1) Fetch checks for the user (optionally bounded by date range)
  let checksQuery = supabase
    .from('megasena_checks')
    .select('id, contest_no, checked_at')
    .eq('user_id', user.id)
    .order('checked_at', { ascending: false });
  if (from) checksQuery = checksQuery.gte('checked_at', from);
  if (to) checksQuery = checksQuery.lte('checked_at', to);
  const { data: checks, error: chkErr } = await checksQuery;
  if (chkErr)
    return NextResponse.json({ error: chkErr.message }, { status: 500 });
  if (!checks || checks.length === 0) {
    return NextResponse.json({
      ok: true,
      empty: true,
      kpis: {
        totalConferences: 0,
        totalBets: 0,
        avgPerCheck: 0,
        c4: 0,
        c5: 0,
        c6: 0,
        hitRate: 0,
      },
      rows: [],
    });
  }

  const checkIdToRow = new Map<
    string,
    {
      contestNo: number;
      checkedAt: string;
      total: number;
      c4: number;
      c5: number;
      c6: number;
    }
  >();
  const ids = checks.map((c: any) => {
    checkIdToRow.set(c.id as string, {
      contestNo: c.contest_no as number,
      checkedAt: c.checked_at as string,
      total: 0,
      c4: 0,
      c5: 0,
      c6: 0,
    });
    return c.id as string;
  });

  // 2) Fetch all items for those checks in one go and aggregate in-memory
  const { data: items, error: itemsErr } = await supabase
    .from('megasena_check_items')
    .select('check_id, matches')
    .in('check_id', ids);
  if (itemsErr)
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  for (const r of items ?? []) {
    const row = checkIdToRow.get(r.check_id as string);
    if (!row) continue;
    row.total += 1;
    const m = (r.matches as number) ?? 0;
    if (m === 4) row.c4 += 1;
    else if (m === 5) row.c5 += 1;
    else if (m === 6) row.c6 += 1;
  }

  // 3) Build rows sorted by date desc (keep original checks order)
  const rows = checks.map((c: any) => {
    const agg = checkIdToRow.get(c.id as string)!;
    const hitRate = agg.total > 0 ? (agg.c4 + agg.c5 + agg.c6) / agg.total : 0;
    return {
      contestNo: agg.contestNo,
      checkedAt: agg.checkedAt,
      total: agg.total,
      c4: agg.c4,
      c5: agg.c5,
      c6: agg.c6,
      hitRate,
    };
  });

  // 4) Global KPIs
  const totalConferences = rows.length;
  const totalBets = rows.reduce((s, r) => s + r.total, 0);
  const c4 = rows.reduce((s, r) => s + r.c4, 0);
  const c5 = rows.reduce((s, r) => s + r.c5, 0);
  const c6 = rows.reduce((s, r) => s + r.c6, 0);
  const avgPerCheck = totalConferences > 0 ? totalBets / totalConferences : 0;
  const hitRate = totalBets > 0 ? (c4 + c5 + c6) / totalBets : 0;

  return NextResponse.json({
    ok: true,
    kpis: { totalConferences, totalBets, avgPerCheck, c4, c5, c6, hitRate },
    rows,
  });
}
