import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;

  let checksQuery = supabase
    .from('quina_checks')
    .select('id, contest_no, checked_at')
    .eq('user_id', user.id)
    .order('checked_at', { ascending: false });
  if (from) checksQuery = checksQuery.gte('checked_at', from);
  if (to) checksQuery = checksQuery.lte('checked_at', to);
  const { data: checks, error: chkErr } = await checksQuery;
  if (chkErr) return NextResponse.json({ error: chkErr.message }, { status: 500 });
  if (!checks || checks.length === 0) {
    return NextResponse.json({
      ok: true,
      empty: true,
      kpis: { totalConferences: 0, totalBets: 0, avgPerCheck: 0, c2: 0, c3: 0, c4: 0, c5: 0, hitRate: 0 },
      rows: [],
    });
  }

  const checkIdToRow = new Map<string, { contestNo: number; checkedAt: string; total: number; c2: number; c3: number; c4: number; c5: number }>();
  const ids = checks.map((c: any) => {
    checkIdToRow.set(c.id as string, { contestNo: c.contest_no as number, checkedAt: c.checked_at as string, total: 0, c2: 0, c3: 0, c4: 0, c5: 0 });
    return c.id as string;
  });

  const { data: items, error: itemsErr } = await supabase
    .from('quina_check_items')
    .select('check_id, matches')
    .in('check_id', ids);
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  for (const r of items ?? []) {
    const row = checkIdToRow.get(r.check_id as string);
    if (!row) continue;
    row.total += 1;
    const m = (r.matches as number) ?? 0;
    if (m === 2) row.c2 += 1;
    else if (m === 3) row.c3 += 1;
    else if (m === 4) row.c4 += 1;
    else if (m === 5) row.c5 += 1;
  }

  const rows = checks.map((c: any) => {
    const agg = checkIdToRow.get(c.id as string)!;
    const hitRate = agg.total > 0 ? (agg.c2 + agg.c3 + agg.c4 + agg.c5) / agg.total : 0;
    return { ...agg, hitRate };
  });

  const totalConferences = rows.length;
  const totalBets = rows.reduce((s, r) => s + r.total, 0);
  const c2 = rows.reduce((s, r) => s + r.c2, 0);
  const c3 = rows.reduce((s, r) => s + r.c3, 0);
  const c4 = rows.reduce((s, r) => s + r.c4, 0);
  const c5 = rows.reduce((s, r) => s + r.c5, 0);
  const avgPerCheck = totalConferences > 0 ? totalBets / totalConferences : 0;
  const hitRate = totalBets > 0 ? (c2 + c3 + c4 + c5) / totalBets : 0;

  return NextResponse.json({
    ok: true,
    kpis: { totalConferences, totalBets, avgPerCheck, c2, c3, c4, c5, hitRate },
    rows,
  });
}


