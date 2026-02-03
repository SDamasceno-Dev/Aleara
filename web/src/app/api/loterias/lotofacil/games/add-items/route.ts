import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
    items?: unknown;
  };
  let setId = parsed.setId ? String(parsed.setId) : null;
  const itemsInput = Array.isArray(parsed.items) ? parsed.items : [];

  // Validate items: each must be array of 15-20 numbers between 1-25
  const validItems: number[][] = [];
  for (const it of itemsInput) {
    if (!Array.isArray(it)) continue;
    const nums = (it as unknown[])
      .map((x) => Number(x))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 25);
    const unique = Array.from(new Set(nums)).sort((a, b) => a - b);
    if (unique.length >= 15 && unique.length <= 20) {
      validItems.push(unique);
    }
  }

  if (validItems.length === 0) {
    return NextResponse.json(
      { error: 'No valid items provided (each must have 15-20 unique numbers 1-25)' },
      { status: 400 },
    );
  }

  // If no setId, create one
  if (!setId) {
    const { data: newSet, error: newSetErr } = await supabase
      .from('lotofacil_user_sets')
      .insert({
        user_id: user.id,
        source_numbers: validItems[0], // Use first item as source
        total_combinations: 1,
        sample_size: 0,
      })
      .select('id')
      .single();
    if (newSetErr)
      return NextResponse.json({ error: newSetErr.message }, { status: 500 });
    setId = newSet.id as string;
  } else {
    // Verify ownership
    const { data: setData, error: setErr } = await supabase
      .from('lotofacil_user_sets')
      .select('id, user_id')
      .eq('id', setId)
      .single();
    if (setErr || !setData)
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    if (setData.user_id !== user.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get max position
  const { data: existingItems } = await supabase
    .from('lotofacil_user_items')
    .select('position')
    .eq('set_id', setId)
    .order('position', { ascending: false })
    .limit(1);
  let nextPosition =
    existingItems && existingItems.length > 0
      ? (existingItems[0].position as number) + 1
      : 0;

  // Use negative positions for manually added items (to distinguish from generated)
  const startPosition = nextPosition > 0 ? -nextPosition - 1 : -1;

  // Insert items
  const toInsert = validItems.map((nums, idx) => ({
    set_id: setId,
    position: startPosition - idx,
    numbers: nums,
  }));

  const { error: insertErr } = await supabase
    .from('lotofacil_user_items')
    .insert(toInsert);
  if (insertErr)
    return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Update sample_size
  const { count } = await supabase
    .from('lotofacil_user_items')
    .select('position', { count: 'exact' })
    .eq('set_id', setId);
  await supabase
    .from('lotofacil_user_sets')
    .update({ sample_size: count ?? 0 })
    .eq('id', setId);

  return NextResponse.json({
    setId,
    items: toInsert.map((it) => ({
      position: it.position,
      numbers: it.numbers,
    })),
  });
}
