import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('quina_bet_lists')
    .select(
      'id, contest_no, title, is_favorite, created_at, quina_bet_list_items(count)',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const items = (data ?? []).map((r: any) => ({
    id: r.id as string,
    contestNo: r.contest_no as number | null,
    title: r.title as string | null,
    isFavorite: !!r.is_favorite,
    createdAt: r.created_at as string,
    count: (r.quina_bet_list_items?.[0]?.count as number) ?? 0,
  }));
  return NextResponse.json({ items });
}
