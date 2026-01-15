import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: checks, error } = await supabase
    .from('lotomania_checks')
    .select('id, contest_no, draw_numbers, checked_at, set_id')
    .eq('user_id', user.id)
    .order('checked_at', { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (checks ?? []).map((c) => ({
    id: c.id as string,
    contestNo: c.contest_no as number,
    drawNumbers: (c.draw_numbers as number[]) ?? [],
    checkedAt: c.checked_at as string,
    setId: c.set_id as string | null,
  }));

  return NextResponse.json({ ok: true, items });
}
