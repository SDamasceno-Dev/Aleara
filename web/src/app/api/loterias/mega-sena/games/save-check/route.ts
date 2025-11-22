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
  const contestNo = Number(body?.contest ?? 0);
  const drawRaw: number[] = Array.isArray(body?.draw) ? body.draw : [];
  const draw = Array.from(new Set(drawRaw.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 60))).sort((a, b) => a - b);
  if (!setId) return NextResponse.json({ error: 'Missing setId' }, { status: 400 });
  if (!(contestNo > 0)) return NextResponse.json({ error: 'Invalid contest number' }, { status: 400 });
  if (draw.length !== 6) return NextResponse.json({ error: 'Provide 6 unique numbers for draw' }, { status: 400 });

  // verify set ownership (RLS handles, but we also fetch)
  const { data: setRow, error: setErr } = await supabase
    .from('megasena_user_sets')
    .select('id')
    .eq('id', setId)
    .maybeSingle();
  if (setErr || !setRow) return NextResponse.json({ error: 'Set not found' }, { status: 404 });

  // 1) Try to find any existing check for (user, contest_no)
  const { data: existingList, error: existListErr } = await supabase
    .from('megasena_checks')
    .select('id, draw_numbers, set_id, contest_no')
    .eq('user_id', user.id)
    .eq('contest_no', contestNo);
  if (existListErr) return NextResponse.json({ error: existListErr.message }, { status: 500 });
  let checkId: string | null = null;
  if (Array.isArray(existingList) && existingList.length > 0) {
    // Reuse the one with the same draw_numbers if present
    const sameRow = existingList.find((row: any) => {
      const prev = (row.draw_numbers as number[]) ?? [];
      return prev.length === draw.length && prev.every((v: number, i: number) => v === draw[i]);
    });
    if (sameRow) {
      checkId = sameRow.id as string;
    } else {
      // Some check(s) exist for this user+contest with a different draw -> reject to avoid ambiguity
      return NextResponse.json(
        { error: 'A saved check for this contest exists with a different draw. Clear it before saving another draw.' },
        { status: 409 },
      );
    }
  }
  // 2) If none found, create a new check for this set/contest/draw
  if (!checkId) {
    const { data: checkIns, error: chkErr } = await supabase
      .from('megasena_checks')
      .insert({
        user_id: user.id,
        set_id: setId,
        contest_no: contestNo,
        draw_numbers: draw,
      })
      .select('id')
      .single();
    if (chkErr || !checkIns) return NextResponse.json({ error: chkErr?.message || 'Cannot create check' }, { status: 500 });
    checkId = checkIns.id as string;
  }

  // stream items and insert into check_items with matches
  let offset = 0;
  const page = 1000;
  let total = 0;
  while (true) {
    const { data: batch, error } = await supabase
      .from('megasena_user_items')
      .select('position, numbers')
      .eq('set_id', setId)
      .order('position', { ascending: true })
      .range(offset, offset + page - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rows = batch ?? [];
    if (rows.length === 0) break;
    const toInsert = rows.map((r: any) => {
      const nums: number[] = Array.isArray(r?.numbers) ? (r.numbers as number[]) : [];
      const matches = countMatches(draw, nums);
      total += 1;
      // ensure numbers are normalized ascending for unique index on (check_id, numbers)
      const norm = [...nums].sort((a, b) => a - b);
      return { check_id: checkId as string, position: r.position as number, numbers: norm, matches };
    });
    const { error: insErr } = await supabase
      .from('megasena_check_items')
      .upsert(toInsert, { onConflict: 'check_id,numbers' });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    offset += rows.length;
    if (rows.length < page) break;
  }

  return NextResponse.json({ ok: true, checkId, contest: contestNo, total });
}


