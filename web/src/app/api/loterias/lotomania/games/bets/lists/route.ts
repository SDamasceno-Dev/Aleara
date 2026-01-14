import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('lotomania_bet_lists')
    .select(
      'id, contest_no, title, is_favorite, created_at, lotomania_bet_list_items(count)',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  type Row = {
    id: string;
    contest_no: number | null;
    title: string | null;
    is_favorite: boolean | null;
    created_at: string;
    lotomania_bet_list_items?: Array<{ count?: number }>;
  };
  const rows = (data ?? []) as Row[];
  const items = rows.map((r) => ({
    id: r.id,
    contestNo: r.contest_no,
    title: r.title ?? null,
    isFavorite: Boolean(r.is_favorite),
    createdAt: r.created_at,
    count: r.lotomania_bet_list_items?.[0]?.count ?? 0,
  }));
  return NextResponse.json({ items });
}
