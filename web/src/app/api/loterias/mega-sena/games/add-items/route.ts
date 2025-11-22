import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type AddItemsRequest =
  | { setId: string; items: number[][] }
  | { items: number[][]; setId?: undefined };

function normalizeNumbers(nums: number[]): number[] {
  return [...nums].sort((a, b) => a - b);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: AddItemsRequest;
  try {
    body = (await request.json()) as AddItemsRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { items } = body as any;
  const maybeSetId: string | undefined = (body as any).setId;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Missing items' }, { status: 400 });
  }

  let setId = maybeSetId;
  // If no set provided, create a minimal manual set using the first valid aposta (6 dezenas)
  if (!setId) {
    // Find first valid 6-number item
    let firstValid: number[] | null = null;
    for (const arr of items) {
      if (Array.isArray(arr) && arr.length === 6) {
        const norm = normalizeNumbers(arr);
        const ok =
          norm.every((n) => Number.isInteger(n) && n >= 1 && n <= 60) &&
          new Set(norm).size === 6;
        if (ok) {
          firstValid = norm;
          break;
        }
      }
    }
    if (!firstValid) {
      return NextResponse.json({ error: 'No valid 6-number item found' }, { status: 400 });
    }
    const { data: created, error: createErr } = await supabase
      .from('megasena_user_sets')
      .insert({
        user_id: user.id,
        source_numbers: firstValid, // length 6 supported by new constraint
        total_combinations: 1,
        sample_size: 0,
      })
      .select('id')
      .single();
    if (createErr || !created) {
      return NextResponse.json({ error: createErr?.message || 'Cannot create set' }, { status: 500 });
    }
    setId = created.id as string;
  }

  // Ensure ownership via RLS and compute next positions
  const { data: existing, error: exErr } = await supabase
    .from('megasena_user_items')
    .select('position, numbers')
    .eq('set_id', setId);
  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });

  const numbersKey = (a: number[]) => normalizeNumbers(a).join(',');
  const existingKeys = new Set<string>(
    (existing ?? []).map((r) => numbersKey(r.numbers as number[])),
  );
  let maxPos = Math.max(-1, ...((existing ?? []).map((r) => r.position as number)));

  const rows = [];
  for (const arr of items) {
    if (!Array.isArray(arr) || arr.length !== 6) continue;
    const nums = normalizeNumbers(arr);
    const allValid =
      nums.every(
        (n) => Number.isInteger(n) && n >= 1 && n <= 60,
      ) && new Set(nums).size === 6;
    if (!allValid) continue;
    const key = numbersKey(nums);
    if (existingKeys.has(key)) continue; // skip duplicates within the set
    maxPos += 1;
    rows.push({
    set_id: setId,
      position: maxPos,
      numbers: nums,
      matches: null,
    });
    existingKeys.add(key);
  }

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, added: 0, items: [] });
  }

  const { error: insErr } = await supabase.from('megasena_user_items').insert(rows);
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // Atualiza sample_size do set para refletir os novos itens
  const newCount = (existing?.length ?? 0) + rows.length;
  await supabase
    .from('megasena_user_sets')
    .update({ sample_size: newCount })
    .eq('id', setId);

  return NextResponse.json({
    ok: true,
    added: rows.length,
    setId,
    items: rows.map((r) => ({ position: r.position, numbers: r.numbers, matches: null })),
  });
}


