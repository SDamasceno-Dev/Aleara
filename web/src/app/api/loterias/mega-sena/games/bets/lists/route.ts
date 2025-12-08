import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('megasena_bet_lists')
    .select(
      'id, contest_no, title, is_favorite, created_at, megasena_bet_list_items(count)',
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
    megasena_bet_list_items?: Array<{ count?: number }>;
  };
  const rows = (data ?? []) as Row[];
  const items = rows.map((row) => {
    const count =
      Array.isArray(row.megasena_bet_list_items) &&
      row.megasena_bet_list_items[0]?.count
        ? Number(row.megasena_bet_list_items[0]?.count)
        : 0;
    return {
      id: row.id,
      contestNo: row.contest_no,
      title: row.title ?? null,
      isFavorite: Boolean(row.is_favorite),
      createdAt: row.created_at,
      count,
    };
  });

  return NextResponse.json({ ok: true, items });
}
