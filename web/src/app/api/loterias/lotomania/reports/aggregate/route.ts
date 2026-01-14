import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;

  let checksQuery = supabase
    .from('lotomania_checks')
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
        c15: 0,
        c16: 0,
        c17: 0,
        c18: 0,
        c19: 0,
        c20: 0,
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
      c15: number;
      c16: number;
      c17: number;
      c18: number;
      c19: number;
      c20: number;
    }
  >();
  type CheckRow = { id: string; contest_no: number; checked_at: string };
  const checkRows = checks as unknown[] as CheckRow[];
  const ids = checkRows.map((c) => {
    checkIdToRow.set(c.id, {
      contestNo: c.contest_no,
      checkedAt: c.checked_at,
      total: 0,
      c15: 0,
      c16: 0,
      c17: 0,
      c18: 0,
      c19: 0,
      c20: 0,
    });
    return c.id;
  });

  const { data: items, error: itemsErr } = await supabase
    .from('lotomania_check_items')
    .select('check_id, matches')
    .in('check_id', ids);
  if (itemsErr)
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  const itemRows = (items ?? []) as Array<{
    check_id: string;
    matches: number | null;
  }>;
  for (const r of itemRows) {
    const row = checkIdToRow.get(r.check_id);
    if (!row) continue;
    row.total += 1;
    const m = r.matches ?? 0;
    if (m === 15) row.c15 += 1;
    else if (m === 16) row.c16 += 1;
    else if (m === 17) row.c17 += 1;
    else if (m === 18) row.c18 += 1;
    else if (m === 19) row.c19 += 1;
    else if (m === 20) row.c20 += 1;
  }

  const rows = checkRows.map((c) => {
    const agg = checkIdToRow.get(c.id)!;
    const hitRate =
      agg.total > 0
        ? (agg.c15 + agg.c16 + agg.c17 + agg.c18 + agg.c19 + agg.c20) /
          agg.total
        : 0;
    return { ...agg, hitRate };
  });

  const totalConferences = rows.length;
  const totalBets = rows.reduce((s, r) => s + r.total, 0);
  const c15 = rows.reduce((s, r) => s + r.c15, 0);
  const c16 = rows.reduce((s, r) => s + r.c16, 0);
  const c17 = rows.reduce((s, r) => s + r.c17, 0);
  const c18 = rows.reduce((s, r) => s + r.c18, 0);
  const c19 = rows.reduce((s, r) => s + r.c19, 0);
  const c20 = rows.reduce((s, r) => s + r.c20, 0);
  const avgPerCheck = totalConferences > 0 ? totalBets / totalConferences : 0;
  const hitRate =
    totalBets > 0 ? (c15 + c16 + c17 + c18 + c19 + c20) / totalBets : 0;

  return NextResponse.json({
    ok: true,
    kpis: {
      totalConferences,
      totalBets,
      avgPerCheck,
      c15,
      c16,
      c17,
      c18,
      c19,
      c20,
      hitRate,
    },
    rows,
  });
}
