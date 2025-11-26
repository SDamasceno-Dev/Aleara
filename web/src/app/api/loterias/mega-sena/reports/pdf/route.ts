import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// NOTE: Requires dependencies:
//   puppeteer-core
//   @sparticuz/chromium
// Install in the web project to enable PDF generation.
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

type ContestRow = { contestNo: number; checkedAt: string; total: number; c4: number; c5: number; c6: number; hitRate: number };

function formatNumbers(nums: number[]): string {
  return (nums ?? []).map((n) => String(n).padStart(2, '0')).join(', ');
}

function renderHtmlAggregate(title: string, kpis: any, rows: ContestRow[]) {
  const rowsHtml = rows
    .map(
      (r) => `
      <tr>
        <td>${r.contestNo}</td>
        <td>${new Date(r.checkedAt).toLocaleString('pt-BR')}</td>
        <td>${r.total}</td>
        <td>${r.c4}</td>
        <td>${r.c5}</td>
        <td>${r.c6}</td>
        <td>${(r.hitRate * 100).toFixed(1)}%</td>
      </tr>`,
    )
    .join('');
  return `<!doctype html>
  <html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 24px; color: #111827; }
      .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 16px; }
      .brand { font-weight: 700; letter-spacing: 2px; }
      .kpis { display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap: 8px; margin: 12px 0 16px; }
      .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
      .label { font-size: 11px; color: #6b7280; }
      .value { font-size: 18px; font-weight: 700; color: #111827; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { padding: 8px; border-top: 1px solid #e5e7eb; text-align: left; }
      th { color: #6b7280; font-weight: 600; }
      .muted { color: #6b7280; font-size: 12px; }
      .green { color: #16a34a; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="brand">ALEARA</div>
        <div class="muted">${title}</div>
      </div>
      <div class="muted">${new Date().toLocaleString('pt-BR')}</div>
    </div>
    <div class="kpis">
      <div class="card"><div class="label">Conferências</div><div class="value">${kpis.totalConferences}</div></div>
      <div class="card"><div class="label">Apostas</div><div class="value">${kpis.totalBets}</div></div>
      <div class="card"><div class="label">Média/conferência</div><div class="value">${kpis.avgPerCheck.toFixed(1)}</div></div>
      <div class="card"><div class="label">Acertos 4</div><div class="value">${kpis.c4}</div></div>
      <div class="card"><div class="label">Acertos 5</div><div class="value">${kpis.c5}</div></div>
      <div class="card"><div class="label">Acertos 6</div><div class="value green">${kpis.c6}</div></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Concurso</th><th>Conferido em</th><th>Apostas</th><th>4</th><th>5</th><th>6</th><th>Taxa</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </body>
  </html>`;
}

function renderHtmlContest(title: string, contestNo: number, draw: number[], kpis: any, items: { position: number; numbers: number[]; matches: number }[]) {
  const itemsHtml = items
    .map(
      (it, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>( ${it.position} )</td>
        <td>${formatNumbers(it.numbers)}</td>
        <td>${it.matches}</td>
      </tr>`,
    )
    .join('');
  return `<!doctype html>
  <html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 24px; color: #111827; }
      .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 16px; }
      .brand { font-weight: 700; letter-spacing: 2px; }
      .muted { color: #6b7280; font-size: 12px; }
      .kpis { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 8px; margin: 12px 0 16px; }
      .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
      .label { font-size: 11px; color: #6b7280; }
      .value { font-size: 18px; font-weight: 700; color: #111827; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { padding: 8px; border-top: 1px solid #e5e7eb; text-align: left; }
      th { color: #6b7280; font-weight: 600; }
      .green { color: #16a34a; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="brand">ALEARA</div>
        <div class="muted">${title}</div>
      </div>
      <div class="muted">${new Date().toLocaleString('pt-BR')}</div>
    </div>
    <div class="muted" style="margin: 4px 0 12px;">Concurso: <strong>${contestNo}</strong> • Sorteio: <strong>${formatNumbers(draw)}</strong></div>
    <div class="kpis">
      <div class="card"><div class="label">Apostas</div><div class="value">${kpis.total}</div></div>
      <div class="card"><div class="label">Acertos 4</div><div class="value">${kpis.c4}</div></div>
      <div class="card"><div class="label">Acertos 5</div><div class="value">${kpis.c5}</div></div>
      <div class="card"><div class="label">Acertos 6</div><div class="value green">${kpis.c6}</div></div>
      <div class="card"><div class="label">Taxa</div><div class="value">${(kpis.hitRate * 100).toFixed(1)}%</div></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th><th>Posição</th><th>Dezenas</th><th>Acertos</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
  </body>
  </html>`;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const mode = (url.searchParams.get('mode') || 'aggregate') as 'aggregate' | 'contest';
  const contestNo = Number(url.searchParams.get('contestNo') || '0');

  let html = '';
  if (mode === 'aggregate') {
    // reuse logic from aggregate endpoint
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
        map.set(c.id as string, {
          contestNo: c.contest_no as number,
          checkedAt: c.checked_at as string,
          total: 0,
          c4: 0,
          c5: 0,
          c6: 0,
          hitRate: 0,
        });
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
    html = renderHtmlAggregate('Relatório geral — Mega‑Sena', kpis, rows);
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
    html = renderHtmlContest(
      'Relatório por concurso — Mega‑Sena',
      contestNo,
      (check.draw_numbers as number[]) ?? [],
      { total, c4, c5, c6, hitRate },
      (items ?? []).map((r) => ({
        position: r.position as number,
        numbers: (r.numbers as number[]) ?? [],
        matches: (r.matches as number) ?? 0,
      })),
    );
  }

  // Resolve executable path: prefer @sparticuz/chromium (prod), fallback to local Chrome (dev)
  async function resolveExecutablePath(): Promise<string | null> {
    try {
      const p = await chromium.executablePath();
      if (p && p.length > 0) return p;
    } catch {
      // ignore
    }
    // ENV overrides take precedence for local/dev
    const envPath =
      process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || '';
    if (envPath && existsSync(envPath)) return envPath;
    const candidates: string[] = [];
    if (process.platform === 'darwin') {
      candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
      candidates.push('/Applications/Chromium.app/Contents/MacOS/Chromium');
    } else if (process.platform === 'win32') {
      candidates.push('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
      candidates.push('C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe');
    } else {
      candidates.push('/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium');
    }
    for (const c of candidates) {
      if (existsSync(c)) return c;
    }
    return null;
  }

  const execPath = await resolveExecutablePath();
  if (!execPath) {
    return NextResponse.json(
      {
        error:
          'Chromium/Chrome executable not found locally. Set PUPPETEER_EXECUTABLE_PATH (e.g., /Applications/Google Chrome.app/Contents/MacOS/Google Chrome) or deploy with @sparticuz/chromium in production.',
      },
      { status: 500 },
    );
  }
  const launchOpts: any = {
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' },
    });
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
  } finally {
    await browser.close();
  }
}


