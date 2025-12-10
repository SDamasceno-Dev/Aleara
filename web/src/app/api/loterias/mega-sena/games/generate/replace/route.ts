import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function binom(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  const nn = BigInt(n);
  let kk = BigInt(k);
  if (kk > nn - kk) kk = nn - kk;
  let result = BigInt(1);
  for (let i = BigInt(1); i <= kk; i = i + BigInt(1)) {
    result = (result * (nn - kk + i)) / i;
  }
  return Number(result);
}
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function generateAllCombIndices(m: number, k: number): number[][] {
  const res: number[][] = [];
  const cur: number[] = [];
  function dfs(start: number, need: number) {
    if (need === 0) {
      res.push([...cur]);
      return;
    }
    for (let i = start; i <= m - need; i++) {
      cur.push(i);
      dfs(i + 1, need - 1);
      cur.pop();
    }
  }
  dfs(0, k);
  return res;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = (body ?? {}) as {
    setId?: unknown;
    numbers?: unknown;
    k?: unknown;
    seed?: unknown;
  };
  const setId = String(parsed.setId ?? '');
  const src: number[] = Array.isArray(parsed.numbers)
    ? (parsed.numbers as unknown[]).map((x) => Number(x))
    : [];
  const k: number = Number(parsed.k ?? 0);
  const seedInput = parsed.seed != null ? Number(parsed.seed) : null;
  const newSeed = Number.isFinite(seedInput as number)
    ? (seedInput as number)
    : Math.floor(Math.random() * 2 ** 31);
  if (!setId)
    return NextResponse.json({ error: 'Missing setId' }, { status: 400 });

  const uniq = Array.from(
    new Set(src.filter((n) => Number.isInteger(n) && n >= 1 && n <= 60)),
  ).sort((a, b) => a - b);
  if (uniq.length < 7 || uniq.length > 15) {
    return NextResponse.json(
      { error: 'Provide 7 to 15 unique numbers between 1 and 60' },
      { status: 400 },
    );
  }
  const total = binom(uniq.length, 6);
  if (!Number.isFinite(total) || total <= 0) {
    return NextResponse.json(
      { error: 'Invalid combination count' },
      { status: 400 },
    );
  }
  const kk = Number.isInteger(k) && k > 0 ? Math.min(k, total) : total;

  const allIdx = generateAllCombIndices(uniq.length, 6);
  const rnd = mulberry32(newSeed);
  const idxArr = Array.from({ length: allIdx.length }, (_, i) => i);
  for (let i = idxArr.length - 1; i > idxArr.length - 1 - kk; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = idxArr[i];
    idxArr[i] = idxArr[j];
    idxArr[j] = tmp;
  }
  const chosen = idxArr.slice(idxArr.length - kk).sort((a, b) => a - b);
  const items = chosen.map((pos) => {
    const comb = allIdx[pos].map((ii) => uniq[ii]).sort((a, b) => a - b);
    return { position: pos, numbers: comb };
  });

  // Replace items and update set metadata (source_numbers, totals, sample_size, seed)
  const { error: delErr } = await supabase
    .from('megasena_user_items')
    .delete()
    .eq('set_id', setId);
  if (delErr)
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  for (let i = 0; i < items.length; i += 1000) {
    const batch = items.slice(i, i + 1000).map((it) => ({
      set_id: setId,
      position: it.position,
      numbers: it.numbers,
    }));
    const { error } = await supabase.from('megasena_user_items').insert(batch);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { error: updErr } = await supabase
    .from('megasena_user_sets')
    .update({
      source_numbers: uniq,
      total_combinations: total,
      sample_size: kk,
      seed: newSeed,
    })
    .eq('id', setId);
  if (updErr)
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, setId, seed: newSeed, items, total });
}


