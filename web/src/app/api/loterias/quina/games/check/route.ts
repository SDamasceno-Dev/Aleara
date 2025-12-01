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
  const setId: string = String(body?.setId ?? '');
  const draw: number[] = Array.isArray(body?.draw) ? body.draw.map((x: any) => Number(x)) : [];
  if (!setId || draw.length !== 5) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const drawSet = new Set(draw);

  // Fetch items
  const { data: items, error } = await supabase
    .from('quina_user_items')
    .select('position, numbers')
    .eq('set_id', setId)
    .order('position', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const updated = (items ?? []).map((it: any) => {
    const nums = (it.numbers as number[]) ?? [];
    let m = 0;
    for (const n of nums) if (drawSet.has(n)) m += 1;
    return { set_id: setId, position: it.position as number, numbers: nums, matches: m };
  });
  // Upsert back matches
  for (let i = 0; i < updated.length; i += 1000) {
    const batch = updated.slice(i, i + 1000);
    const { error: upErr } = await supabase
      .from('quina_user_items')
      .upsert(batch, { onConflict: 'set_id,position' });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  }
  return NextResponse.json({ items: updated.map(({ position, numbers, matches }) => ({ position, numbers, matches })) });
}


