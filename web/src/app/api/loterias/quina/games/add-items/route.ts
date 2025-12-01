import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const setId: string | null = body?.setId ?? null;
  const items: number[][] = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return NextResponse.json({ error: 'No items' }, { status: 400 });

  // Ensure all numbers valid and lengths 5..20
  const normItems = items.map((arr) =>
    Array.from(
      new Set(arr.map((n: any) => Number(n)).filter((n: number) => Number.isInteger(n) && n >= 1 && n <= 80)),
    ).sort((a, b) => a - b),
  );
  if (normItems.some((a) => a.length < 5 || a.length > 20)) {
    return NextResponse.json({ error: 'Each item must have 5 to 20 numbers between 1 and 80' }, { status: 400 });
  }

  let targetSetId = setId;
  if (!targetSetId) {
    // create a new set
    const first = normItems[0];
    const { data, error } = await supabase
      .from('quina_user_sets')
      .insert({
        user_id: user.id,
        source_numbers: first,
        total_combinations: 0,
        sample_size: 0,
        seed: null,
      })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetSetId = data.id as string;
  } else {
    // Validate ownership
    const { data, error } = await supabase.from('quina_user_sets').select('id,user_id').eq('id', targetSetId).maybeSingle();
    if (error || !data || (data.user_id as string) !== user.id) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    }
  }

  // Determine next position
  let nextPos = 0;
  {
    const { data } = await supabase
      .from('quina_user_items')
      .select('position')
      .eq('set_id', targetSetId)
      .order('position', { ascending: false })
      .limit(1);
    if (data && data.length) nextPos = (data[0].position as number) + 1;
  }
  const payload = normItems.map((nums, i) => ({
    set_id: targetSetId,
    position: nextPos + i,
    numbers: nums,
  }));
  for (let i = 0; i < payload.length; i += 1000) {
    const batch = payload.slice(i, i + 1000);
    const { error } = await supabase.from('quina_user_items').insert(batch);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await supabase
    .from('quina_user_sets')
    .update({ sample_size: nextPos + payload.length })
    .eq('id', targetSetId);
  return NextResponse.json({ setId: targetSetId, items: payload.map((p) => ({ position: p.position, numbers: p.numbers })) });
}


