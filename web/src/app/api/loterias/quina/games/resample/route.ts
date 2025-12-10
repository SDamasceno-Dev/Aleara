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
    k?: unknown;
    seed?: unknown;
  };
  const setId: string = String(parsed.setId ?? '');
  const kInput = parsed.k != null ? Number(parsed.k) : null;
  const seedInput = parsed.seed != null ? Number(parsed.seed) : null;
  const reseed = Number.isFinite(seedInput as number)
    ? (seedInput as number)
    : Math.floor(Math.random() * 2 ** 31);
  if (!setId)
    return NextResponse.json({ error: 'Missing setId' }, { status: 400 });

  const { data: setRow, error } = await supabase
    .from('quina_user_sets')
    .select('id, source_numbers, sample_size')
    .eq('id', setId)
    .maybeSingle();
  if (error || !setRow)
    return NextResponse.json({ error: 'Set not found' }, { status: 404 });
  const src: number[] = (setRow.source_numbers as number[]) ?? [];
  if (src.length < 5 || src.length > 20)
    return NextResponse.json(
      { error: 'Invalid source_numbers' },
      { status: 400 },
    );
  const total = binom(src.length, 5);
  const k =
    kInput && kInput > 0
      ? Math.min(kInput, total)
      : (setRow.sample_size as number);
  const allIdx = generateAllCombIndices(src.length, 5);
  const rnd = mulberry32(reseed);
  const idxArr = Array.from({ length: allIdx.length }, (_, i) => i);
  for (let i = idxArr.length - 1; i > idxArr.length - 1 - k; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = idxArr[i];
    idxArr[i] = idxArr[j];
    idxArr[j] = tmp;
  }
  const chosen = idxArr.slice(idxArr.length - k).sort((a, b) => a - b);
  const items = chosen.map((pos) => ({
    position: pos,
    numbers: allIdx[pos].map((ii) => src[ii]).sort((a, b) => a - b),
  }));
  // Replace items
  const { error: delErr } = await supabase
    .from('quina_user_items')
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
    const { error: insErr } = await supabase
      .from('quina_user_items')
      .insert(batch);
    if (insErr)
      return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  await supabase
    .from('quina_user_sets')
    .update({ sample_size: k, seed: reseed })
    .eq('id', setId);
  return NextResponse.json({ ok: true, setId, seed: reseed, items });
}
