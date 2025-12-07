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
  const dd = m[1];
  const mm = m[2];
  const yyyy = m[3];
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
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const nameToIndex: Record<string, number> = {};
  header.forEach((h, idx) => {
    nameToIndex[normalize(h)] = idx;
  });
  return nameToIndex;
}

function mapRow(
  headerMap: Record<string, number>,
  cols: string[],
  line: number,
): { ok: true; row: DrawRow } | { ok: false; error: string } {
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
    return {
      ok: false,
      error: `Linha ${line}: dados obrigatórios ausentes/invalidos`,
    };
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
    cidades_uf: get('cidade / uf').trim() || null,
    rateio_6: parseCurrencyBR(get('rateio 6 acertos')),
    ganhadores_5: parseIntSafe(get('ganhadores 5 acertos')),
    rateio_5: parseCurrencyBR(get('rateio 5 acertos')),
    ganhadores_4: parseIntSafe(get('ganhadores 4 acertos')),
    rateio_4: parseCurrencyBR(get('rateio 4 acertos')),
    acumulado_6: parseCurrencyBR(get('acumulado 6 acertos')),
    arrecadacao_total: parseCurrencyBR(get('arrecadação total')),
    estimativa_premio: parseCurrencyBR(get('estimativa prêmio')),
    acumulado_mega_da_virada: parseCurrencyBR(
      get('acumulado sorteio especial mega da virada'),
    ),
    observacao: get('observação').trim() || null,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = (body ?? {}) as { csv?: unknown; reconcileLastN?: unknown };
  const csv = String(parsed.csv ?? '');
  if (!csv.trim()) {
    return NextResponse.json({ error: 'Missing csv' }, { status: 400 });
  }
  const reconcileWindow = Math.max(
    0,
    Math.min(100, Number(parsed.reconcileLastN ?? 20) || 20),
  ); // default 20, cap 100

  // Parse CSV
  const table = parseCsv(csv);
  if (table.length < 2) {
    return NextResponse.json(
      { error: 'CSV vazio ou sem dados' },
      { status: 400 },
    );
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
      return NextResponse.json(
        { error: `Cabeçalho ausente: ${r}` },
        { status: 400 },
      );
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
    return NextResponse.json(
      { error: 'Nenhuma linha válida encontrada', errors },
      { status: 400 },
    );
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
  const newRows =
    maxConcurso == null ? rows : rows.filter((r) => r.concurso > maxConcurso!);

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
  for (const batch of chunk(rowsToUpsert, 500)) {
    const { error } = await supabase
      .from('megasena_draws')
      .upsert(batch, { onConflict: 'concurso' });
    if (error) {
      errors.push({
        line: 0,
        reason: `Falha ao salvar lote: ${error.message}`,
      });
      continue;
    }
  }

  const insertedCount = upsertIds.filter((id) => !existingIds.has(id)).length;
  const updatedCount = upsertIds.length - insertedCount;
  const skippedCount = rows.length - rowsToUpsert.length; // lines valid but not necessary to touch

  // Recompute frequency stats (server-side, admin via RLS) + other studies
  let statsUpdated = false;
  let studiesUpdated = false;
  try {
    function getGlobalMap(name: string): Record<string, number> {
      const g = globalThis as unknown as Record<string, unknown>;
      const cur = g[name];
      if (typeof cur === 'object' && cur !== null) return cur as Record<string, number>;
      const m: Record<string, number> = {};
      g[name] = m;
      return m;
    }
    function getExistingGlobalMap(name: string): Record<string, number> | undefined {
      const g = globalThis as unknown as Record<string, unknown>;
      const cur = g[name];
      return typeof cur === 'object' && cur !== null ? (cur as Record<string, number>) : undefined;
    }
    // Count total draws (also get max concurso)
    const countRes = await supabase
      .from('megasena_draws')
      .select('concurso', { count: 'exact' })
      .order('concurso', { ascending: false })
      .limit(1);
    const totalDraws = countRes.count ?? 0;
    const lastConcursoGlobal = countRes.data?.[0]?.concurso as
      | number
      | undefined;
    // Build aggregates scanning all draws
    const freq = Array.from({ length: 61 }, () => 0); // index 1..60
    const lastSeen = Array.from({ length: 61 }, () => 0);
    const pairCounts: Record<string, number> = {};
    const consecutiveCounts: Record<string, number> = {};
    const sumRangeCounts: Record<string, number> = {};
    const parityCounts: Record<string, number> = {};
    const repeatersCounts: Record<string, number> = {};
    const decadeCounts: Record<string, number> = {};
    const lastDigitCounts: Record<string, number> = {};
    const windowK = 200;
    const windowFreq = Array.from({ length: 61 }, () => 0);
    const pageSize = 1000;
    let fetched = 0;
    let prevSet: Set<number> | null = null;
    while (true) {
      const { data, error } = await supabase
        .from('megasena_draws')
        .select(
          'concurso, bola1, bola2, bola3, bola4, bola5, bola6, acumulado_6',
        )
        .order('concurso', { ascending: true })
        .range(fetched, fetched + pageSize - 1);
      if (error) break;
      const rowsPage = (data ?? []) as Array<{
        concurso: number;
        bola1: number;
        bola2: number;
        bola3: number;
        bola4: number;
        bola5: number;
        bola6: number;
        acumulado_6?: number | null;
      }>;
      if (rowsPage.length === 0) break;
      for (const r of rowsPage) {
        const concursoNum = r.concurso;
        const arr = [r.bola1, r.bola2, r.bola3, r.bola4, r.bola5, r.bola6]
          .map((n) => Number(n))
          .sort((a, b) => a - b);
        for (const n of arr) {
          if (typeof n === 'number' && n >= 1 && n <= 60) {
            freq[n] += 1;
            lastSeen[n] = concursoNum;
          }
        }
        // window (last K)
        if (lastConcursoGlobal && concursoNum > lastConcursoGlobal - windowK) {
          for (const n of arr) {
            if (n >= 1 && n <= 60) windowFreq[n] += 1;
          }
        }
        // decades and last digit
        for (const n of arr) {
          const decadeStart = Math.floor((n - 1) / 10) * 10 + 1;
          const decadeKey = `${String(decadeStart).padStart(2, '0')}-${String(decadeStart + 9).padStart(2, '0')}`;
          decadeCounts[decadeKey] = (decadeCounts[decadeKey] ?? 0) + 1;
          const ldKey = `final:${n % 10}`;
          lastDigitCounts[ldKey] = (lastDigitCounts[ldKey] ?? 0) + 1;
        }
        // pairs and consecutive pairs
        for (let i = 0; i < arr.length; i += 1) {
          for (let j = i + 1; j < arr.length; j += 1) {
            const a = arr[i];
            const b = arr[j];
            const key = `${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
            pairCounts[key] = (pairCounts[key] ?? 0) + 1;
            if (b === a + 1) {
              consecutiveCounts[key] = (consecutiveCounts[key] ?? 0) + 1;
            }
          }
        }
        // triples and quads (top-K later)
        const tripleCounts = getGlobalMap('_tripleCounts');
        const quadCounts = getGlobalMap('_quadCounts');
        // triples
        for (let i = 0; i < arr.length; i += 1) {
          for (let j = i + 1; j < arr.length; j += 1) {
            for (let k = j + 1; k < arr.length; k += 1) {
              const key = `${String(arr[i]).padStart(2, '0')}-${String(arr[j]).padStart(2, '0')}-${String(arr[k]).padStart(2, '0')}`;
              tripleCounts[key] = (tripleCounts[key] ?? 0) + 1;
            }
          }
        }
        // quads
        for (let i = 0; i < arr.length; i += 1) {
          for (let j = i + 1; j < arr.length; j += 1) {
            for (let k = j + 1; k < arr.length; k += 1) {
              for (let m = k + 1; m < arr.length; m += 1) {
                const key = `${String(arr[i]).padStart(2, '0')}-${String(arr[j]).padStart(2, '0')}-${String(arr[k]).padStart(2, '0')}-${String(arr[m]).padStart(2, '0')}`;
                quadCounts[key] = (quadCounts[key] ?? 0) + 1;
              }
            }
          }
        }
        // sum ranges (bins of 20)
        const sum = arr.reduce((s: number, n: number) => s + n, 0);
        const start = Math.floor(sum / 20) * 20;
        const sumKey = `${start}-${start + 19}`;
        sumRangeCounts[sumKey] = (sumRangeCounts[sumKey] ?? 0) + 1;
        // exact sum (top K later)
        const sumExact = getGlobalMap('_sumExact');
        sumExact[String(sum)] = (sumExact[String(sum)] ?? 0) + 1;
        // parity composition
        const evens = arr.filter((n: number) => n % 2 === 0).length;
        const parKey = `${evens}p-${6 - evens}i`;
        parityCounts[parKey] = (parityCounts[parKey] ?? 0) + 1;
        // high/low composition (<=30 vs >30)
        const lows = arr.filter((n: number) => n <= 30).length;
        const hlKey = `${lows}b-${6 - lows}a`;
        const highLowCounts = getGlobalMap('_highLow');
        highLowCounts[hlKey] = (highLowCounts[hlKey] ?? 0) + 1;
        // average gap and AC
        const gaps: number[] = [];
        for (let i = 1; i < arr.length; i += 1) gaps.push(arr[i] - arr[i - 1]);
        const meanGap = gaps.reduce((s, n) => s + n, 0) / gaps.length;
        const gapKey = meanGap.toFixed(1);
        const gapAvg = getGlobalMap('_gapAvg');
        gapAvg[gapKey] = (gapAvg[gapKey] ?? 0) + 1;
        const diffSet = new Set<number>();
        for (let i = 0; i < arr.length; i += 1)
          for (let j = i + 1; j < arr.length; j += 1)
            diffSet.add(arr[j] - arr[i]);
        const acVal = diffSet.size;
        const acCounts = getGlobalMap('_acCounts');
        acCounts[String(acVal)] = (acCounts[String(acVal)] ?? 0) + 1;
        // repeaters vs previous draw
        const currSet = new Set(arr);
        if (prevSet) {
          let rep = 0;
          for (const n of currSet) if (prevSet.has(n)) rep += 1;
          const repKey = String(rep);
          repeatersCounts[repKey] = (repeatersCounts[repKey] ?? 0) + 1;
        }
        // repeaters under accumulation (faixa de prêmio)
        if ((r.acumulado_6 ?? 0) > 0 && prevSet) {
          const repAcc = getGlobalMap('_repeatersAccum');
          let rep = 0;
          for (const n of currSet) if (prevSet.has(n)) rep += 1;
          repAcc[String(rep)] = (repAcc[String(rep)] ?? 0) + 1;
        }
        prevSet = currSet;
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

    // Helper to upsert studies
    async function upsertStudy(
      key: string,
      title: string,
      items: Array<{ item_key: string; value: number; extra?: Record<string, unknown> }>,
    ) {
      const sorted = items.sort((a, b) => b.value - a.value);
      const payload = sorted.map((it, idx) => ({
        study_key: key,
        item_key: it.item_key,
        rank: idx + 1,
        value: it.value,
        extra: it.extra ?? {},
      }));
      await supabase
        .from('megasena_stats_catalog')
        .upsert(
          { study_key: key, title, params: {} },
          { onConflict: 'study_key' },
        );
      await supabase.from('megasena_stats_items').delete().eq('study_key', key);
      for (const batch of chunk(payload, 1000)) {
        await supabase
          .from('megasena_stats_items')
          .upsert(batch, { onConflict: 'study_key,item_key' });
      }
    }

    // Build studies datasets
    const overdueItems: Array<{ item_key: string; value: number }> = [];
    const lastC = lastConcursoGlobal ?? Math.max(0, ...lastSeen);
    for (let n = 1; n <= 60; n += 1) {
      const last = lastSeen[n] || 0;
      const overdue = last ? lastC - last : lastC;
      overdueItems.push({
        item_key: `dezena:${String(n).padStart(2, '0')}`,
        value: overdue,
      });
    }
    await upsertStudy('overdue_dezena', 'Atraso por dezena', overdueItems);
    // Frequency (all time) and hot/cold
    const freqItems = Array.from({ length: 60 }, (_, i) => {
      const n = i + 1;
      return {
        item_key: `dezena:${String(n).padStart(2, '0')}`,
        value: freq[n] ?? 0,
      };
    });
    await upsertStudy(
      'freq_all',
      'Frequência por dezena (histórico)',
      freqItems,
    );
    const hotTop = [...freqItems]
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
    const coldTop = [...freqItems]
      .sort((a, b) => a.value - b.value)
      .slice(0, 20);
    await upsertStudy('hot_top', 'Quentes (top frequentes)', hotTop);
    await upsertStudy('cold_top', 'Frias (menos frequentes)', coldTop);

    const pairItems = Object.entries(pairCounts).map(([k, v]) => ({
      item_key: `par:${k}`,
      value: v,
    }));
    await upsertStudy('pair_freq', 'Pares mais frequentes', pairItems);

    const consecItems = Object.entries(consecutiveCounts).map(([k, v]) => ({
      item_key: `consec:${k}`,
      value: v,
    }));
    await upsertStudy(
      'consecutive_pair',
      'Pares consecutivos mais frequentes',
      consecItems,
    );

    const sumItems = Object.entries(sumRangeCounts).map(([k, v]) => ({
      item_key: `faixa_soma:${k}`,
      value: v,
    }));
    await upsertStudy('sum_range_20', 'Faixas de soma (largura 20)', sumItems);

    const parityItems = Object.entries(parityCounts).map(([k, v]) => ({
      item_key: `paridade:${k}`,
      value: v,
    }));
    await upsertStudy('parity_comp', 'Composições Par/Ímpar', parityItems);

    const repItems = Object.entries(repeatersCounts).map(([k, v]) => ({
      item_key: `repetidores:${k}`,
      value: v,
    }));
    await upsertStudy(
      'repeaters_prev',
      'Repetições vs. sorteio anterior',
      repItems,
    );

    const windowHotItems = Array.from({ length: 60 }, (_, i) => {
      const n = i + 1;
      return {
        item_key: `dezena:${String(n).padStart(2, '0')}`,
        value: windowFreq[n] ?? 0,
      };
    });
    await upsertStudy(
      'window200_hot',
      'Frequência (últimos 200 concursos)',
      windowHotItems,
    );

    const decadeItems = Object.entries(decadeCounts).map(([k, v]) => ({
      item_key: `decada:${k}`,
      value: v,
    }));
    await upsertStudy('decade_dist', 'Distribuição por décadas', decadeItems);

    const lastDigitItems = Object.entries(lastDigitCounts).map(([k, v]) => ({
      item_key: k,
      value: v,
    }));
    await upsertStudy(
      'last_digit',
      'Distribuição por finais (0–9)',
      lastDigitItems,
    );

    // high/low composition
    const highLowCounts = getExistingGlobalMap('_highLow');
    if (highLowCounts) {
      const hlItems = Object.entries(highLowCounts).map(([k, v]) => ({
        item_key: `baixas_altas:${k}`,
        value: v,
      }));
      await upsertStudy('high_low_comp', 'Composições Baixas/Altas', hlItems);
    }
    // sum exact (top)
    const sumExact = getExistingGlobalMap('_sumExact');
    if (sumExact) {
      const items = Object.entries(sumExact).map(([k, v]) => ({
        item_key: `soma:${k}`,
        value: v,
      }));
      await upsertStudy('sum_exact', 'Soma das dezenas (exata)', items);
    }
    // mean gap distribution
    const gapAvg = getExistingGlobalMap('_gapAvg');
    if (gapAvg) {
      const items = Object.entries(gapAvg).map(([k, v]) => ({
        item_key: `gap_medio:${k}`,
        value: v,
      }));
      await upsertStudy('mean_gap', 'Distância média entre dezenas', items);
    }
    // AC distribution
    const acCounts = getExistingGlobalMap('_acCounts');
    if (acCounts) {
      const items = Object.entries(acCounts).map(([k, v]) => ({
        item_key: `ac:${k}`,
        value: v,
      }));
      await upsertStudy('ac_value', 'Valor AC (dispersão)', items);
    }
    // triples / quads top-k
    const tripleCounts = getExistingGlobalMap('_tripleCounts');
    if (tripleCounts) {
      const items = Object.entries(tripleCounts).map(([k, v]) => ({
        item_key: `trinca:${k}`,
        value: v,
      }));
      await upsertStudy('triple_freq', 'Trincas mais frequentes', items);
    }
    const quadCounts = getExistingGlobalMap('_quadCounts');
    if (quadCounts) {
      const items = Object.entries(quadCounts).map(([k, v]) => ({
        item_key: `quadra:${k}`,
        value: v,
      }));
      await upsertStudy('quad_freq', 'Quadras mais frequentes', items);
    }
    // repeaters under accumulation
    const repAcc = getExistingGlobalMap('_repeatersAccum');
    if (repAcc) {
      const items = Object.entries(repAcc).map(([k, v]) => ({
        item_key: `repetidores_acum:${k}`,
        value: v,
      }));
      await upsertStudy(
        'repeaters_accum',
        'Repetidores em sorteios com acúmulo',
        items,
      );
    }
    // Regression to mean for each dezena (lambda=5)
    const regItems = Array.from({ length: 60 }, (_, i) => {
      const n = i + 1;
      const obs = freq[n] ?? 0;
      const exp = totalDraws * 0.1;
      const lambda = 5;
      const reg = (obs + lambda * exp) / (1 + lambda);
      return {
        item_key: `dezena:${String(n).padStart(2, '0')}`,
        value: Number(reg.toFixed(4)),
      };
    });
    await upsertStudy('regress_mean', 'Regressão à média (dezena)', regItems);
    // Chi-square diagnostic
    const expPer = totalDraws * 0.1;
    let chi2 = 0;
    for (let n = 1; n <= 60; n += 1) {
      const obs = freq[n] ?? 0;
      const diff = obs - expPer;
      chi2 += (diff * diff) / (expPer || 1);
    }
    await upsertStudy('chi_square', 'Qui-quadrado (diagnóstico)', [
      { item_key: 'chi2', value: Number(chi2.toFixed(4)) },
      { item_key: 'df', value: 59 },
      { item_key: 'expected_per_dezena', value: Number(expPer.toFixed(4)) },
    ]);
    // Tool placeholders (sem pré-cálculo histórico)
    await upsertStudy('wheels_tool', 'Coberturas/Reduções (wheels)', []);
    await upsertStudy('monte_carlo_tool', 'Simulação Monte Carlo', []);
    await upsertStudy('ev_rollover_tool', 'EV simples por rollover', []);

    studiesUpdated = true;
  } catch {
    statsUpdated = false;
    studiesUpdated = false;
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
    studiesUpdated,
  });
}
