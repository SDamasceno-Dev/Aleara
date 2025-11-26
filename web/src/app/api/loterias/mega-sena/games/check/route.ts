import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function countMatches(a: number[], b: number[]): number {
  const set = new Set(a);
  let m = 0;
  for (const x of b) if (set.has(x)) m += 1;
  return m;
}

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
  const setId = String(body?.setId ?? '');
  const drawRaw: number[] = Array.isArray(body?.draw) ? body.draw : [];
  const draw = Array.from(new Set(drawRaw.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 60))).sort((a, b) => a - b);
  if (!setId) return NextResponse.json({ error: 'Missing setId' }, { status: 400 });
  if (draw.length !== 6) return NextResponse.json({ error: 'Provide 6 unique numbers for draw' }, { status: 400 });

  // Verify set ownership
  const { data: setRow, error: setErr } = await supabase
    .from('megasena_user_sets')
    .select('id')
    .eq('id', setId)
    .single();
  if (setErr || !setRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch items in pages to compute matches and update
  let offset = 0;
  const page = 1000;
  const updated: Array<{ position: number; numbers: number[]; matches: number }> = [];
  while (true) {
    const { data: batch, error } = await supabase
      .from('megasena_user_items')
      .select('position, numbers')
      .eq('set_id', setId)
      .range(offset, offset + page - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rows = batch ?? [];
    if (rows.length === 0) break;
    const updates = rows.map((r: any) => {
      const nums: number[] = Array.isArray(r?.numbers) ? (r.numbers as number[]) : [];
      const m = countMatches(draw, nums);
      updated.push({ position: r.position as number, numbers: nums, matches: m });
      // include numbers to satisfy NOT NULL even if an insert is attempted by upsert
      return { set_id: setId, position: r.position as number, numbers: nums, matches: m };
    });
    const { error: updErr } = await supabase
      .from('megasena_user_items')
      .upsert(updates, { onConflict: 'set_id,position' });
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    offset += rows.length;
    if (rows.length < page) break;
  }

  return NextResponse.json({ ok: true, setId, draw, items: updated });
}


