import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type AppendGenerateRequest = {
  setId: string;
  numbers: number[]; // 7..15 unique in [1,60]
  k: number; // sample size
  seed?: number;
};

function combinationsOfSix(sortedNums: number[]): number[][] {
  const a = sortedNums;
  const n = a.length;
  const out: number[][] = [];
  for (let i = 0; i < n - 5; i++) {
    for (let j = i + 1; j < n - 4; j++) {
      for (let k = j + 1; k < n - 3; k++) {
        for (let l = k + 1; l < n - 2; l++) {
          for (let m = l + 1; m < n - 1; m++) {
            for (let o = m + 1; o < n; o++) {
              out.push([a[i], a[j], a[k], a[l], a[m], a[o]]);
            }
          }
        }
      }
    }
  }
  return out;
}

function seededRandom(seed: number) {
  // simple LCG for determinism
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: AppendGenerateRequest;
  try {
    body = (await request.json()) as AppendGenerateRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { setId, numbers, k, seed } = body || {};
  if (!setId || !Array.isArray(numbers) || !Number.isInteger(k) || k <= 0) {
    return NextResponse.json(
      { error: 'Missing setId, numbers or k' },
      { status: 400 },
    );
  }

  const unique = Array.from(
    new Set(numbers.filter((n) => Number.isInteger(n) && n >= 1 && n <= 60)),
  ).sort((a, b) => a - b);
  if (unique.length < 7 || unique.length > 15) {
    return NextResponse.json(
      { error: 'numbers must contain 7..15 unique values between 1 and 60' },
      { status: 400 },
    );
  }

  // Validate ownership by selecting some set data (RLS enforced)
  const { data: existingItems, error: exErr } = await supabase
    .from('megasena_user_items')
    .select('position, numbers')
    .eq('set_id', setId);
  if (exErr)
    return NextResponse.json({ error: exErr.message }, { status: 500 });
  let maxPos = Math.max(
    -1,
    ...(existingItems ?? []).map((r) => r.position as number),
  );

  // Generate all C(N,6)
  const all = combinationsOfSix(unique);
  const total = all.length;
  if (k > total)
    return NextResponse.json(
      { error: `k cannot exceed total combinations (${total})` },
      { status: 400 },
    );

  // Deterministic partial shuffle
  const rnd = seededRandom(seed ?? Math.floor(Date.now() % 2147483647));
  for (let i = total - 1; i > total - 1 - Math.min(k, total); i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = all[i];
    all[i] = all[j];
    all[j] = tmp;
  }
  const sample = all.slice(total - k);

  const rows = sample.map((nums) => ({
    set_id: setId,
    position: ++maxPos,
    numbers: nums,
    matches: null as number | null,
  }));

  const { error: insErr } = await supabase
    .from('megasena_user_items')
    .insert(rows);
  if (insErr)
    return NextResponse.json({ error: insErr.message }, { status: 500 });

  // Optionally: update sample_size to reflect appended items
  await supabase
    .from('megasena_user_sets')
    .update({ sample_size: (existingItems?.length ?? 0) + rows.length })
    .eq('id', setId);

  return NextResponse.json({
    ok: true,
    setId,
    items: rows.map((r) => ({
      position: r.position,
      numbers: r.numbers,
      matches: null,
    })),
  });
}
