import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { renderToStream, type DocumentProps } from '@react-pdf/renderer';
import React from 'react';
import { buildAggregateDoc, buildContestDoc, type ContestRow } from './PdfDoc';

function formatNumbers(nums: number[]): string {
  return (nums ?? []).map((n) => String(n).padStart(2, '0')).join(', ');
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const mode = (url.searchParams.get('mode') || 'aggregate') as 'aggregate' | 'contest';
  const contestNo = Number(url.searchParams.get('contestNo') || '0');

  let doc: React.ReactElement<DocumentProps>;
  const origin = new URL(request.url).origin;
  // Prefer PNG/JPG for @react-pdf Image (SVG não é suportado)
  const logoSrc = `${origin}/assets/Logo_AlearaReport.png`;

  if (mode === 'aggregate') {
    const { data: checks } = await supabase
      .from('megasena_checks')
      .select('id, contest_no, checked_at')
      .eq('user_id', user.id)
      .order('checked_at', { ascending: false });
    const ids = (checks ?? []).map((c: any) => c.id as string);
    let rows: ContestRow[] = [];
    let kpis = { totalConferences: 0, totalBets: 0, avgPerCheck: 0, c4: 0, c5: 0, c6: 0, hitRate: 0 };
    if (ids.length > 0) {
      const map = new Map<string, ContestRow>();
      for (const c of checks ?? []) {
        map.set(c.id as string, { contestNo: c.contest_no as number, checkedAt: c.checked_at as string, total: 0, c4: 0, c5: 0, c6: 0, hitRate: 0 });
      }
      const { data: items } = await supabase
        .from('megasena_check_items')
        .select('check_id, matches')
        .in('check_id', ids);
      for (const r of items ?? []) {
        const row = map.get(r.check_id as string);
        if (!row) continue;
        row.total += 1;
        const m = (r.matches as number) ?? 0;
        if (m === 4) row.c4 += 1;
        else if (m === 5) row.c5 += 1;
        else if (m === 6) row.c6 += 1;
      }
      rows = (checks ?? []).map((c: any) => {
        const r = map.get(c.id as string)!;
        r.hitRate = r.total > 0 ? (r.c4 + r.c5 + r.c6) / r.total : 0;
        return r;
      });
      kpis.totalConferences = rows.length;
      kpis.totalBets = rows.reduce((s, r) => s + r.total, 0);
      kpis.c4 = rows.reduce((s, r) => s + r.c4, 0);
      kpis.c5 = rows.reduce((s, r) => s + r.c5, 0);
      kpis.c6 = rows.reduce((s, r) => s + r.c6, 0);
      kpis.avgPerCheck = kpis.totalConferences > 0 ? kpis.totalBets / kpis.totalConferences : 0;
      kpis.hitRate = kpis.totalBets > 0 ? (kpis.c4 + kpis.c5 + kpis.c6) / kpis.totalBets : 0;
    }
    doc = buildAggregateDoc(kpis, rows, { logoSrc });
  } else {
    if (!(contestNo > 0)) {
      return NextResponse.json({ error: 'contestNo required for mode=contest' }, { status: 400 });
    }
    const { data: check } = await supabase
      .from('megasena_checks')
      .select('id, draw_numbers, checked_at')
      .eq('user_id', user.id)
      .eq('contest_no', contestNo)
      .maybeSingle();
    if (!check) return NextResponse.json({ error: 'No check found' }, { status: 404 });
    const { data: items } = await supabase
      .from('megasena_check_items')
      .select('position, numbers, matches')
      .eq('check_id', check.id as string)
      .order('position', { ascending: true });
    let c4 = 0, c5 = 0, c6 = 0;
    for (const r of items ?? []) {
      const m = (r.matches as number) ?? 0;
      if (m === 4) c4 += 1;
      else if (m === 5) c5 += 1;
      else if (m === 6) c6 += 1;
    }
    const total = items?.length ?? 0;
    const hitRate = total > 0 ? (c4 + c5 + c6) / total : 0;
    const rows = (items ?? []).map((r) => ({
      position: r.position as number,
      numbers: (r.numbers as number[]) ?? [],
      matches: (r.matches as number) ?? 0,
    }));

    doc = buildContestDoc(
      contestNo,
      (check.draw_numbers as number[]) ?? [],
      { total, c4, c5, c6, hitRate },
      rows,
      { logoSrc },
    );
  }

  const stream = await renderToStream(doc);
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  const pdf = Buffer.concat(chunks);
  const filename =
    mode === 'aggregate'
      ? `relatorio-geral-megasena.pdf`
      : `relatorio-concurso-${contestNo}.pdf`;
  return new NextResponse(pdf, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}


