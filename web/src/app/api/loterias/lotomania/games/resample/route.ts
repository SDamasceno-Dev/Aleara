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

// Convert index to combination without generating all combinations
function indexToCombination(index: number, n: number, k: number): number[] {
  const comb: number[] = [];
  let idx = BigInt(index);
  let nVal = BigInt(n);
  let kVal = BigInt(k);

  for (let i = 0; i < k; i++) {
    let found = false;
    let candidate = nVal;

    while (!found && candidate >= kVal) {
      const c = binom(Number(candidate - BigInt(1)), Number(kVal - BigInt(1)));
      if (idx < c) {
        comb.push(Number(candidate - BigInt(1)));
        kVal = kVal - BigInt(1);
        nVal = candidate - BigInt(1);
        found = true;
      } else {
        idx = idx - BigInt(c);
        candidate = candidate - BigInt(1);
      }
    }

    if (!found) {
      comb.push(Number(nVal - BigInt(1)));
      kVal = kVal - BigInt(1);
      nVal = nVal - BigInt(1);
    }
  }

  return comb.reverse();
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
    .from('lotomania_user_sets')
    .select('id, source_numbers, sample_size')
    .eq('id', setId)
    .maybeSingle();
  if (error || !setRow)
    return NextResponse.json({ error: 'Set not found' }, { status: 404 });
  const src: number[] = (setRow.source_numbers as number[]) ?? [];
  if (src.length < 50 || src.length > 100)
    return NextResponse.json(
      { error: 'Invalid source_numbers' },
      { status: 400 },
    );
  const total = binom(src.length, 50);
  const k =
    kInput && kInput > 0
      ? Math.min(kInput, 5000) // Cap at 5000
      : Math.min((setRow.sample_size as number) || 0, 5000);
  // Generate random indices without creating all combinations in memory
  const rnd = mulberry32(reseed);
  const indices = new Set<number>();

  while (indices.size < k) {
    let candidate: number;
    if (total <= 2 ** 32) {
      candidate = Math.floor(rnd() * total);
    } else {
      candidate = Number(BigInt(Math.floor(rnd() * 2 ** 31)) % BigInt(total));
    }
    indices.add(candidate);
  }

  const chosen = Array.from(indices).sort((a, b) => a - b);
  const items = chosen.map((pos) => {
    const idxs = indexToCombination(pos, src.length, 50);
    const nums = idxs.map((ii) => src[ii]).sort((a, b) => a - b);
    return { position: pos, numbers: nums };
  });
  // Replace items
  const { error: delErr } = await supabase
    .from('lotomania_user_items')
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
      .from('lotomania_user_items')
      .insert(batch);
    if (insErr)
      return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  await supabase
    .from('lotomania_user_sets')
    .update({ sample_size: k, seed: reseed })
    .eq('id', setId);
  return NextResponse.json({ ok: true, setId, seed: reseed, items });
}
