import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch lists with item count
  const { data: lists, error } = await supabase
    .from('lotofacil_bet_lists')
    .select('id, contest_no, title, is_favorite, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Get counts for each list
  const items: Array<{
    id: string;
    contestNo: number | null;
    title: string | null;
    count: number;
    isFavorite: boolean;
    createdAt: string;
  }> = [];

  for (const list of lists ?? []) {
    const { count } = await supabase
      .from('lotofacil_bet_list_items')
      .select('list_id', { count: 'exact' })
      .eq('list_id', list.id);
    items.push({
      id: list.id as string,
      contestNo: list.contest_no as number | null,
      title: list.title as string | null,
      count: count ?? 0,
      isFavorite: list.is_favorite as boolean,
      createdAt: list.created_at as string,
    });
  }

  return NextResponse.json({ items });
}
