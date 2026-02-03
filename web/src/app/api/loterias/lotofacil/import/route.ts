import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type DrawRow = {
  concurso: number;
  data_sorteio: string; // ISO
  bola1: number;
  bola2: number;
  bola3: number;
  bola4: number;
  bola5: number;
  bola6: number;
  bola7: number;
  bola8: number;
  bola9: number;
  bola10: number;
  bola11: number;
  bola12: number;
  bola13: number;
  bola14: number;
  bola15: number;
  ganhadores_15: number | null;
  cidades_uf: string | null;
  rateio_15: number | null;
  ganhadores_14: number | null;
  rateio_14: number | null;
  ganhadores_13: number | null;
  rateio_13: number | null;
  ganhadores_12: number | null;
  rateio_12: number | null;
  ganhadores_11: number | null;
  rateio_11: number | null;
  acumulado_15: number | null;
  arrecadacao_total: number | null;
  estimativa_premio: number | null;
  observacao: string | null;
};

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error) return { ok: false as const, supabase, status: 500 };
  if (!isAdmin) return { ok: false as const, supabase, status: 403 };
  return { ok: true as const, supabase };
}

function detectDelimiter(firstLine: string): string {
  const candidates: Array<string> = [',', ';', '\t'];
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  let inQuotes = false;
  for (let i = 0; i < firstLine.length; i += 1) {
    const ch = firstLine[i];
    if (ch === '"') {
      if (firstLine[i + 1] !== '"') {
        inQuotes = !inQuotes;
      } else {
        i += 1;
      }
      continue;
    }
    if (!inQuotes && (ch === ',' || ch === ';' || ch === '\n' || ch === '\t')) {
      if (ch in counts) counts[ch] += 1;
    }
  }
  let best = ',';
  let bestCount = -1;
  for (const c of candidates) {
    if (counts[c] > bestCount) {
      best = c;
      bestCount = counts[c];
    }
  }
  return best;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const nl = s.indexOf('\n');
  const firstLine = nl >= 0 ? s.slice(0, nl) : s;
  const delim = detectDelimiter(firstLine);
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      if (field.length === 0) {
        inQuotes = true;
      } else {
        field += '"';
      }
      continue;
    }
    if (ch === delim) {
      row.push(field);
      field = '';
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += ch;
  }
  row.push(field);
  if (row.length > 1 || (row.length === 1 && row[0].trim().length > 0)) {
    rows.push(row);
  }
  if (rows.length && rows[0].length) {
    rows[0][0] = rows[0][0].replace(/^\uFEFF/, '');
  }
  return rows;
}

function parseDateBR(v: string): string | null {
  const t = (v ?? '').trim();
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function parseCurrencyBR(v: string): number | null {
  const t = (v ?? '').trim();
  if (!t) return null;
  const cleaned = t
    .replace(/^R\$\s*/i, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseIntSafe(v: string): number | null {
  const t = (v ?? '').trim();
  if (!t) return null;
  const num = Number(t.replace(/\./g, ''));
  return Number.isInteger(num) ? num : null;
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function headerIndexMap(header: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((h, idx) => (map[normalizeKey(h)] = idx));
  return map;
}

function mapRow(
  hm: Record<string, number>,
  cols: string[],
  line: number,
): { ok: true; row: DrawRow } | { ok: false; error: string } {
  const get = (key: string) => {
    const idx = hm[normalizeKey(key)];
    return idx != null ? (cols[idx] ?? '') : '';
  };
  const getAny = (...keys: string[]) => {
    for (const k of keys) {
      const idx = hm[normalizeKey(k)];
      if (idx != null) return cols[idx] ?? '';
    }
    return '';
  };
  const concurso = parseIntSafe(get('concurso'));
  const dataISO = parseDateBR(getAny('data sorteio', 'data do sorteio'));
  const bolas: (number | null)[] = [];
  for (let i = 1; i <= 15; i++) {
    bolas.push(parseIntSafe(get(`bola${i}`)));
  }
  if (concurso == null || !dataISO || bolas.some((b) => b == null)) {
    return {
      ok: false,
      error: `Linha ${line}: dados obrigatórios ausentes/invalidos`,
    };
  }
  const row: DrawRow = {
    concurso,
    data_sorteio: dataISO,
    bola1: bolas[0]!,
    bola2: bolas[1]!,
    bola3: bolas[2]!,
    bola4: bolas[3]!,
    bola5: bolas[4]!,
    bola6: bolas[5]!,
    bola7: bolas[6]!,
    bola8: bolas[7]!,
    bola9: bolas[8]!,
    bola10: bolas[9]!,
    bola11: bolas[10]!,
    bola12: bolas[11]!,
    bola13: bolas[12]!,
    bola14: bolas[13]!,
    bola15: bolas[14]!,
    ganhadores_15: parseIntSafe(get('ganhadores 15 acertos')),
    cidades_uf:
      getAny('cidade / uf', 'cidade/uf', 'cidades / uf', 'cidades/uf').trim() ||
      null,
    rateio_15: parseCurrencyBR(get('rateio 15 acertos')),
    ganhadores_14: parseIntSafe(get('ganhadores 14 acertos')),
    rateio_14: parseCurrencyBR(get('rateio 14 acertos')),
    ganhadores_13: parseIntSafe(get('ganhadores 13 acertos')),
    rateio_13: parseCurrencyBR(get('rateio 13 acertos')),
    ganhadores_12: parseIntSafe(get('ganhadores 12 acertos')),
    rateio_12: parseCurrencyBR(get('rateio 12 acertos')),
    ganhadores_11: parseIntSafe(get('ganhadores 11 acertos')),
    rateio_11: parseCurrencyBR(get('rateio 11 acertos')),
    acumulado_15: parseCurrencyBR(get('acumulado 15 acertos')),
    arrecadacao_total: parseCurrencyBR(
      getAny('arrecadacao total', 'arrecadação total'),
    ),
    estimativa_premio: parseCurrencyBR(
      getAny('estimativa premio', 'estimativa prêmio'),
    ),
    observacao: getAny('observacao', 'observação').trim() || null,
  };
  return { ok: true, row };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function POST(request: Request) {
  const admin = await assertAdmin();
  if (!admin.ok)
    return NextResponse.json({ error: 'Forbidden' }, { status: admin.status });
  const supabase = admin.supabase;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = (body ?? {}) as { csv?: unknown; reconcileLastN?: unknown };
  const csv = String(parsed.csv ?? '');
  if (!csv.trim())
    return NextResponse.json({ error: 'Missing csv' }, { status: 400 });
  const reconcileWindow = Math.max(
    0,
    Math.min(100, Number(parsed.reconcileLastN ?? 20) || 20),
  );

  const table = parseCsv(csv);
  if (table.length < 2)
    return NextResponse.json(
      { error: 'CSV vazio ou sem dados' },
      { status: 400 },
    );
  const header = table[0].map((h) => h.trim());
  const hmap = headerIndexMap(header);
  const missing: string[] = [];
  const has = (k: string) => normalizeKey(k) in hmap;
  if (!has('concurso')) missing.push('Concurso');
  if (!(has('data sorteio') || has('data do sorteio')))
    missing.push('Data Sorteio');
  for (let i = 1; i <= 15; i++) {
    if (!has(`bola${i}`)) missing.push(`bola${i}`);
  }
  if (missing.length) {
    return NextResponse.json(
      {
        error: `Cabeçalho ausente/inesperado: ${missing.join(', ')}.`,
        headerReceived: header,
        headerNormalized: header.map((h) => normalizeKey(h)),
      },
      { status: 400 },
    );
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
  if (rows.length === 0)
    return NextResponse.json(
      { error: 'Nenhuma linha válida encontrada', errors },
      { status: 400 },
    );

  // Determine max concurso in DB
  let maxConcurso: number | null = null;
  {
    const { data, error } = await supabase
      .from('lotofacil_draws')
      .select('concurso')
      .order('concurso', { ascending: false })
      .limit(1);
    if (!error && data && data.length) maxConcurso = data[0].concurso as number;
  }

  rows.sort((a, b) => a.concurso - b.concurso);
  const lastN = rows.slice(-reconcileWindow);
  const newRows =
    maxConcurso == null ? rows : rows.filter((r) => r.concurso > maxConcurso!);
  const upsertMap = new Map<number, DrawRow>();
  for (const r of lastN) upsertMap.set(r.concurso, r);
  for (const r of newRows) upsertMap.set(r.concurso, r);
  const rowsToUpsert = Array.from(upsertMap.values());
  const upsertIds = rowsToUpsert.map((r) => r.concurso);

  // existing ids
  const existingIds = new Set<number>();
  for (const batch of chunk(upsertIds, 1000)) {
    const { data, error } = await supabase
      .from('lotofacil_draws')
      .select('concurso')
      .in('concurso', batch);
    if (!error && data)
      for (const r of data) existingIds.add(r.concurso as number);
  }

  // upsert
  for (const batch of chunk(rowsToUpsert, 500)) {
    const { error } = await supabase
      .from('lotofacil_draws')
      .upsert(batch, { onConflict: 'concurso' });
    if (error)
      errors.push({
        line: 0,
        reason: `Falha ao salvar lote: ${error.message}`,
      });
  }
  const insertedCount = upsertIds.filter((id) => !existingIds.has(id)).length;
  const updatedCount = upsertIds.length - insertedCount;
  const skippedCount = rows.length - rowsToUpsert.length;

  // Recompute stats and studies
  let statsUpdated = false;
  let studiesUpdated = false;
  try {
    const countRes = await supabase
      .from('lotofacil_draws')
      .select('concurso', { count: 'exact' })
      .order('concurso', { ascending: false })
      .limit(1);
    const totalDraws = countRes.count ?? 0;
    const lastConcursoGlobal = countRes.data?.[0]?.concurso as
      | number
      | undefined;
    const freq = Array.from({ length: 26 }, () => 0); // 1..25
    const lastSeen = Array.from({ length: 26 }, () => 0);
    const pairCounts: Record<string, number> = {};
    const consecutiveCounts: Record<string, number> = {};
    const sumRangeCounts: Record<string, number> = {};
    const parityCounts: Record<string, number> = {};
    const decadeCounts: Record<string, number> = {};
    const lastDigitCounts: Record<string, number> = {};
    const windowK = 200;
    const windowFreq = Array.from({ length: 26 }, () => 0);
    const pageSize = 1000;
    let fetched = 0;
    // scan all draws
    while (true) {
      const { data, error } = await supabase
        .from('lotofacil_draws')
        .select(
          'concurso, bola1, bola2, bola3, bola4, bola5, bola6, bola7, bola8, bola9, bola10, bola11, bola12, bola13, bola14, bola15',
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
        bola7: number;
        bola8: number;
        bola9: number;
        bola10: number;
        bola11: number;
        bola12: number;
        bola13: number;
        bola14: number;
        bola15: number;
      }>;
      if (rowsPage.length === 0) break;
      for (const r of rowsPage) {
        const concursoNum = r.concurso;
        const arr = [
          r.bola1,
          r.bola2,
          r.bola3,
          r.bola4,
          r.bola5,
          r.bola6,
          r.bola7,
          r.bola8,
          r.bola9,
          r.bola10,
          r.bola11,
          r.bola12,
          r.bola13,
          r.bola14,
          r.bola15,
        ]
          .map((n) => Number(n))
          .sort((a, b) => a - b);
        for (const n of arr) {
          if (n >= 1 && n <= 25) {
            freq[n] += 1;
            lastSeen[n] = concursoNum;
          }
        }
        if (lastConcursoGlobal && concursoNum > lastConcursoGlobal - windowK) {
          for (const n of arr) if (n >= 1 && n <= 25) windowFreq[n] += 1;
        }
        // decades (1-10, 11-20, 21-25) and last digit
        for (const n of arr) {
          let decadeKey: string;
          if (n <= 10) decadeKey = '01-10';
          else if (n <= 20) decadeKey = '11-20';
          else decadeKey = '21-25';
          decadeCounts[decadeKey] = (decadeCounts[decadeKey] ?? 0) + 1;
          const ldKey = `final:${n % 10}`;
          lastDigitCounts[ldKey] = (lastDigitCounts[ldKey] ?? 0) + 1;
        }
        // pairs and consecutive
        for (let i = 0; i < arr.length; i += 1) {
          for (let j = i + 1; j < arr.length; j += 1) {
            const a = arr[i];
            const b = arr[j];
            const key = `${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
            pairCounts[key] = (pairCounts[key] ?? 0) + 1;
            if (b === a + 1)
              consecutiveCounts[key] = (consecutiveCounts[key] ?? 0) + 1;
          }
        }
        // sum ranges (bins of 20)
        const sum = arr.reduce((s: number, n: number) => s + n, 0);
        const start = Math.floor(sum / 20) * 20;
        const sumKey = `${start}-${start + 19}`;
        sumRangeCounts[sumKey] = (sumRangeCounts[sumKey] ?? 0) + 1;
        // parity composition (15 numbers)
        const evens = arr.filter((n: number) => n % 2 === 0).length;
        const parKey = `${evens}p-${15 - evens}i`;
        parityCounts[parKey] = (parityCounts[parKey] ?? 0) + 1;
      }
      fetched += rowsPage.length;
      if (rowsPage.length < pageSize) break;
    }
    // Replace stats table content
    await supabase.from('lotofacil_stats_dezenas').delete().neq('dezena', -1);
    const statsRows = [];
    for (let n = 1; n <= 25; n += 1) {
      const vezes = freq[n] ?? 0;
      const pct = totalDraws > 0 ? Number((vezes / totalDraws).toFixed(6)) : 0;
      statsRows.push({
        dezena: n,
        vezes_sorteada: vezes,
        pct_sorteios: pct,
        total_sorteios: totalDraws,
      });
    }
    for (const batch of chunk(statsRows, 25)) {
      await supabase
        .from('lotofacil_stats_dezenas')
        .upsert(batch, { onConflict: 'dezena' });
    }
    statsUpdated = true;

    async function upsertStudy(
      key: string,
      title: string,
      items: Array<{
        item_key: string;
        value: number;
        extra?: Record<string, unknown>;
      }>,
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
        .from('lotofacil_stats_catalog')
        .upsert(
          { study_key: key, title, params: {} },
          { onConflict: 'study_key' },
        );
      await supabase
        .from('lotofacil_stats_items')
        .delete()
        .eq('study_key', key);
      for (const batch of chunk(payload, 1000)) {
        await supabase
          .from('lotofacil_stats_items')
          .upsert(batch, { onConflict: 'study_key,item_key' });
      }
    }
    // Overdue
    const overdueItems: Array<{ item_key: string; value: number }> = [];
    const lastC = lastConcursoGlobal ?? Math.max(0, ...lastSeen);
    for (let n = 1; n <= 25; n += 1) {
      const last = lastSeen[n] || 0;
      const overdue = last ? lastC - last : lastC;
      overdueItems.push({
        item_key: `dezena:${String(n).padStart(2, '0')}`,
        value: overdue,
      });
    }
    await upsertStudy('overdue_dezena', 'Atraso por dezena', overdueItems);
    // Frequência (histórico)
    const freqItems = Array.from({ length: 25 }, (_, i) => {
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
    // Quentes e frias (top 10)
    const hotTop = [...freqItems]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    const coldTop = [...freqItems]
      .sort((a, b) => a.value - b.value)
      .slice(0, 10);
    await upsertStudy('hot_top', 'Quentes (top frequentes)', hotTop);
    await upsertStudy('cold_top', 'Frias (menos frequentes)', coldTop);
    // Pares e consecutivos
    await upsertStudy(
      'pair_freq',
      'Pares mais frequentes',
      Object.entries(pairCounts).map(([k, v]) => ({
        item_key: `par:${k}`,
        value: v,
      })),
    );
    await upsertStudy(
      'consecutive_pair',
      'Pares consecutivos mais frequentes',
      Object.entries(consecutiveCounts).map(([k, v]) => ({
        item_key: `consec:${k}`,
        value: v,
      })),
    );
    // Faixas de soma (20)
    await upsertStudy(
      'sum_range_20',
      'Faixas de soma (largura 20)',
      Object.entries(sumRangeCounts).map(([k, v]) => ({
        item_key: `faixa_soma:${k}`,
        value: v,
      })),
    );
    // Paridade
    await upsertStudy(
      'parity_comp',
      'Composições Par/Ímpar',
      Object.entries(parityCounts).map(([k, v]) => ({
        item_key: `paridade:${k}`,
        value: v,
      })),
    );
    // Décadas e finais
    await upsertStudy(
      'decade_dist',
      'Distribuição por décadas',
      Object.entries(decadeCounts).map(([k, v]) => ({
        item_key: `decada:${k}`,
        value: v,
      })),
    );
    await upsertStudy(
      'last_digit',
      'Distribuição por finais (0–9)',
      Object.entries(lastDigitCounts).map(([k, v]) => ({
        item_key: k,
        value: v,
      })),
    );
    // Janela (últ. 200 concursos)
    const windowHotItems = Array.from({ length: 25 }, (_, i) => {
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
