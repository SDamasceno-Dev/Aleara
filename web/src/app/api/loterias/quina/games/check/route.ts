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
  const parsed = (body ?? {}) as { setId?: unknown; draw?: unknown };
  const setId: string = String(parsed.setId ?? '');
  const draw: number[] = Array.isArray(parsed.draw)
    ? (parsed.draw as unknown[]).map((x) => Number(x))
    : [];
  if (!setId || draw.length !== 5)
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const drawSet = new Set(draw);

  // Fetch items
  const { data: items, error } = await supabase
    .from('quina_user_items')
    .select('position, numbers')
    .eq('set_id', setId)
    .order('position', { ascending: true });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const updated = (
    (items ?? []) as Array<{ position: number; numbers: number[] }>
  ).map((it) => {
    const nums = it.numbers ?? [];
    let m = 0;
    for (const n of nums) if (drawSet.has(n)) m += 1;
    return {
      set_id: setId,
      position: it.position,
      numbers: nums,
      matches: m,
    };
  });
  // Upsert back matches
  for (let i = 0; i < updated.length; i += 1000) {
    const batch = updated.slice(i, i + 1000);
    const { error: upErr } = await supabase
      .from('quina_user_items')
      .upsert(batch, { onConflict: 'set_id,position' });
    if (upErr)
      return NextResponse.json({ error: upErr.message }, { status: 500 });
  }
  return NextResponse.json({
    items: updated.map(({ position, numbers, matches }) => ({
      position,
      numbers,
      matches,
    })),
  });
}
