import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type DrawRow = {
  concurso: number;
  data_sorteio: string; // ISO date
  bola1: number;
  bola2: number;
  bola3: number;
  bola4: number;
  bola5: number;
  bola6: number;
  ganhadores_6: number | null;
  cidades_uf: string | null;
  rateio_6: number | null;
  ganhadores_5: number | null;
  rateio_5: number | null;
  ganhadores_4: number | null;
  rateio_4: number | null;
  acumulado_6: number | null;
  arrecadacao_total: number | null;
  estimativa_premio: number | null;
  acumulado_mega_da_virada: number | null;
  observacao: string | null;
};

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error) return { ok: false as const, supabase, status: 500 };
  if (!isAdmin) return { ok: false as const, supabase, status: 403 };
  return { ok: true as const, supabase };
}

function parseCsv(text: string): string[][] {
  // Simple RFC4180-ish parser supporting quotes and commas in quoted fields
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  while (i < s.length) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i += 1;
          continue;
        }
      } else {
        field += ch;
        i += 1;
        continue;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i += 1;
        continue;
      }
      if (ch === ',') {
        row.push(field);
        field = '';
        i += 1;
        continue;
      }
      if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
    }
  }
  // Flush last field/row
  row.push(field);
  if (row.length > 1 || (row.length === 1 && row[0].trim().length > 0)) {
    rows.push(row);
  }
  // Trim BOM from first field if present
  if (rows.length && rows[0].length) {
    rows[0][0] = rows[0][0].replace(/^\uFEFF/, '');
  }
  return rows;
}

function parseDateBR(d: string): string | null {
  const t = d.trim();
  if (!t) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (!m) return null;
  const [_, dd, mm, yyyy] = m;
  const iso = `${yyyy}-${mm}-${dd}`;
  return iso;
}

function parseCurrencyBR(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const cleaned = t
    .replace(/^R\$\s*/i, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseIntSafe(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const num = Number(t.replace(/\./g, ''));
  return Number.isInteger(num) ? num : null;
}

function headerIndexMap(header: string[]): Record<string, number> {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/\s+/g, ' ').trim();
  const nameToIndex: Record<string, number> = {};
  header.forEach((h, idx) => {
    nameToIndex[normalize(h)] = idx;
  });
  return nameToIndex;
}

function mapRow(headerMap: Record<string, number>, cols: string[], line: number): { ok: true; row: DrawRow } | { ok: false; error: string } {
  const get = (key: string) => {
    const idx = headerMap[key];
    return idx != null ? (cols[idx] ?? '') : '';
  };
  const concurso = parseIntSafe(get('concurso'));
  const dataISO = parseDateBR(get('data do sorteio'));
  const bola1 = parseIntSafe(get('bola1'));
  const bola2 = parseIntSafe(get('bola2'));
  const bola3 = parseIntSafe(get('bola3'));
  const bola4 = parseIntSafe(get('bola4'));
  const bola5 = parseIntSafe(get('bola5'));
  const bola6 = parseIntSafe(get('bola6'));
  if (
    concurso == null ||
    !dataISO ||
    bola1 == null ||
    bola2 == null ||
    bola3 == null ||
    bola4 == null ||
    bola5 == null ||
    bola6 == null
  ) {
    return { ok: false, error: `Linha ${line}: dados obrigatórios ausentes/invalidos` };
  }
  const row: DrawRow = {
    concurso,
    data_sorteio: dataISO,
    bola1,
    bola2,
    bola3,
    bola4,
    bola5,
    bola6,
    ganhadores_6: parseIntSafe(get('ganhadores 6 acertos')),
    cidades_uf: (get('cidade / uf').trim() || null),
    rateio_6: parseCurrencyBR(get('rateio 6 acertos')),
    ganhadores_5: parseIntSafe(get('ganhadores 5 acertos')),
    rateio_5: parseCurrencyBR(get('rateio 5 acertos')),
    ganhadores_4: parseIntSafe(get('ganhadores 4 acertos')),
    rateio_4: parseCurrencyBR(get('rateio 4 acertos')),
    acumulado_6: parseCurrencyBR(get('acumulado 6 acertos')),
    arrecadacao_total: parseCurrencyBR(get('arrecadação total')),
    estimativa_premio: parseCurrencyBR(get('estimativa prêmio')),
    acumulado_mega_da_virada: parseCurrencyBR(get('acumulado sorteio especial mega da virada')),
    observacao: (get('observação').trim() || null),
  };
  return { ok: true, row };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export async function POST(request: Request) {
  const admin = await assertAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: admin.status });
  }
  const supabase = admin.supabase;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const csv = String(body?.csv ?? '');
  if (!csv.trim()) {
    return NextResponse.json({ error: 'Missing csv' }, { status: 400 });
  }
  const reconcileWindow = Math.max(0, Math.min(100, Number(body?.reconcileLastN ?? 20) || 20)); // default 20, cap 100

  // Parse CSV
  const table = parseCsv(csv);
  if (table.length < 2) {
    return NextResponse.json({ error: 'CSV vazio ou sem dados' }, { status: 400 });
  }
  const header = table[0].map((h) => h.trim());
  const hmap = headerIndexMap(header);
  const required = [
    'concurso',
    'data do sorteio',
    'bola1',
    'bola2',
    'bola3',
    'bola4',
    'bola5',
    'bola6',
  ];
  for (const r of required) {
    if (!(r in hmap)) {
      return NextResponse.json({ error: `Cabeçalho ausente: ${r}` }, { status: 400 });
    }
  }

  const rows: DrawRow[] = [];
  const errors: Array<{ line: number; reason: string }> = [];

  for (let i = 1; i < table.length; i += 1) {
    const cols = table[i];
    const allEmpty = cols.every((c) => (c ?? '').trim() === '');
    if (allEmpty) continue;
    const mapped = mapRow(hmap, cols, i + 1);
    if (!mapped.ok) {
      errors.push({ line: i + 1, reason: mapped.error });
      continue;
    }
    rows.push(mapped.row);
  }
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Nenhuma linha válida encontrada', errors }, { status: 400 });
  }

  // Determine max(concurso) in DB
  let maxConcurso: number | null = null;
  {
    const { data, error } = await supabase
      .from('megasena_draws')
      .select('concurso')
      .order('concurso', { ascending: false })
      .limit(1);
    if (!error && data && data.length) {
      maxConcurso = data[0].concurso as number;
    }
  }

  // Sort rows by concurso asc to determine last-N
  rows.sort((a, b) => a.concurso - b.concurso);
  const lastN = rows.slice(-reconcileWindow);
  const lastNIds = new Set(lastN.map((r) => r.concurso));
  const newRows = maxConcurso == null ? rows : rows.filter((r) => r.concurso > maxConcurso!);

  // Union set to upsert: lastN union newRows
  const upsertMap = new Map<number, DrawRow>();
  for (const r of lastN) upsertMap.set(r.concurso, r);
  for (const r of newRows) upsertMap.set(r.concurso, r);
  const rowsToUpsert = Array.from(upsertMap.values());
  const upsertIds = rowsToUpsert.map((r) => r.concurso);

  // Determine existing concursos among rowsToUpsert to compute updated vs inserted
  const existingIds = new Set<number>();
  for (const batch of chunk(upsertIds, 1000)) {
    const { data, error } = await supabase
      .from('megasena_draws')
      .select('concurso')
      .in('concurso', batch);
    if (!error && data) {
      for (const r of data) existingIds.add(r.concurso as number);
    }
  }

  // Perform upserts in batches
  let affected = 0;
  for (const batch of chunk(rowsToUpsert, 500)) {
    const { error } = await supabase
      .from('megasena_draws')
      .upsert(batch, { onConflict: 'concurso' });
    if (error) {
      errors.push({ line: 0, reason: `Falha ao salvar lote: ${error.message}` });
      continue;
    }
    affected += batch.length;
  }

  const insertedCount = upsertIds.filter((id) => !existingIds.has(id)).length;
  const updatedCount = upsertIds.length - insertedCount;
  const skippedCount =
    rows.length - rowsToUpsert.length; // lines valid but not necessary to touch

  // Recompute frequency stats (server-side, admin via RLS)
  let statsUpdated = false;
  try {
    // Count total draws
    const countRes = await supabase
      .from('megasena_draws')
      .select('*', { count: 'exact', head: true });
    const totalDraws = countRes.count ?? 0;
    // Build counts for 1..60
    const freq = Array.from({ length: 61 }, () => 0);
    const pageSize = 1000;
    let fetched = 0;
    while (true) {
      const { data, error } = await supabase
        .from('megasena_draws')
        .select('bola1, bola2, bola3, bola4, bola5, bola6')
        .order('concurso', { ascending: true })
        .range(fetched, fetched + pageSize - 1);
      if (error) break;
      const rowsPage = data ?? [];
      if (rowsPage.length === 0) break;
      for (const r of rowsPage as any[]) {
        const arr = [r.bola1, r.bola2, r.bola3, r.bola4, r.bola5, r.bola6];
        for (const n of arr) {
          if (typeof n === 'number' && n >= 1 && n <= 60) {
            freq[n] += 1;
          }
        }
      }
      fetched += rowsPage.length;
      if (rowsPage.length < pageSize) break;
    }
    // Replace stats table content
    await supabase.from('megasena_stats_dezenas').delete().neq('dezena', -1);
    const statsRows = [];
    for (let n = 1; n <= 60; n += 1) {
      const vezes = freq[n] ?? 0;
      const pct = totalDraws > 0 ? Number((vezes / totalDraws).toFixed(6)) : 0;
      statsRows.push({
        dezena: n,
        vezes_sorteada: vezes,
        pct_sorteios: pct,
        total_sorteios: totalDraws,
      });
    }
    // upsert in one or two batches
    for (const batch of chunk(statsRows, 60)) {
      const { error } = await supabase
        .from('megasena_stats_dezenas')
        .upsert(batch, { onConflict: 'dezena' });
      if (error) {
        // if stats fail, continue; do not fail import
        // eslint-disable-next-line no-continue
        continue;
      }
    }
    statsUpdated = true;
  } catch {
    statsUpdated = false;
  }

  return NextResponse.json({
    ok: true,
    imported: insertedCount,
    updated: updatedCount,
    skipped: skippedCount,
    processed: rows.length,
    reconcileWindow,
    errors,
    statsUpdated,
  });
}


