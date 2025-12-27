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
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: AddItemsRequest;
  try {
    body = (await request.json()) as AddItemsRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const items = body.items;
  const maybeSetId: string | undefined =
    'setId' in body ? body.setId : undefined;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Missing items' }, { status: 400 });
  }

  let setId = maybeSetId;

  // Build normalized bets exactly as provided (length 6..20), no combination expansion
  // Preserve insertion order for source_numbers, but normalize items (games) for storage
  const numbersKey = (a: number[]) => normalizeNumbers(a).join(',');
  const localKeys = new Set<string>();
  const betsFromPayload: number[][] = [];
  const firstOriginalForSource: number[] = [];
  for (const arr of items) {
    if (!Array.isArray(arr) || arr.length < 6 || arr.length > 20) continue;
    // For source_numbers: preserve order, remove duplicates
    if (firstOriginalForSource.length === 0) {
      const seen = new Set<number>();
      for (const n of arr) {
        if (!Number.isInteger(n) || n < 1 || n > 60) continue;
        if (seen.has(n)) continue;
        seen.add(n);
        firstOriginalForSource.push(n);
      }
    }
    // For items (games): normalize (sort) for storage
    const base = normalizeNumbers(arr).filter(
      (n) => Number.isInteger(n) && n >= 1 && n <= 60,
    );
    if (new Set(base).size !== base.length) continue;
    const key = numbersKey(base);
    if (localKeys.has(key)) continue;
    localKeys.add(key);
    betsFromPayload.push(base);
  }
  if (betsFromPayload.length === 0) {
    return NextResponse.json(
      { error: 'Nenhuma aposta válida (6..20 dezenas).' },
      { status: 400 },
    );
  }

  // If no set provided, create a minimal manual set using the first item's numbers in insertion order
  if (!setId) {
    const firstSix = firstOriginalForSource;
    const { data: created, error: createErr } = await supabase
      .from('megasena_user_sets')
      .insert({
        user_id: user.id,
        source_numbers: firstSix, // 6..20 allowed
        total_combinations: 1,
        sample_size: 0,
      })
      .select('id')
      .single();
    if (createErr || !created) {
      return NextResponse.json(
        { error: createErr?.message || 'Cannot create set' },
        { status: 500 },
      );
    }
    setId = created.id as string;
  }

  // Ensure ownership via RLS and compute next positions
  const { data: existing, error: exErr } = await supabase
    .from('megasena_user_items')
    .select('position, numbers')
    .eq('set_id', setId);
  if (exErr)
    return NextResponse.json({ error: exErr.message }, { status: 500 });

  const rows: Array<{
    set_id: string;
    position: number;
    numbers: number[];
    matches: number | null;
  }> = [];
  const existingKeys = new Set<string>(
    (existing ?? []).map((r) => numbersKey(r.numbers as number[])),
  );
  let maxPos = Math.max(
    -1,
    ...(existing ?? []).map((r) => r.position as number),
  );
  for (const nums of betsFromPayload) {
    const key = numbersKey(nums);
    if (existingKeys.has(key)) continue;
    maxPos += 1;
    rows.push({
      set_id: setId!,
      position: maxPos,
      numbers: nums,
      matches: null,
    });
    existingKeys.add(key);
  }

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, added: 0, items: [] });
  }

  const { error: insErr } = await supabase
    .from('megasena_user_items')
    .insert(rows);
  if (insErr)
    return NextResponse.json({ error: insErr.message }, { status: 500 });

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
    items: rows.map((r) => ({
      position: r.position,
      numbers: r.numbers,
      matches: null,
    })),
  });
}
