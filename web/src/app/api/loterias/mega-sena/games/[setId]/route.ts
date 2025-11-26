import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(_: Request, { params }: { params: { setId: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const setId = params.setId;
  const url = new URL(_.url);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1);
  const size = Math.min(1000, Math.max(1, Number(url.searchParams.get('size') ?? 100) || 100));
  const from = (page - 1) * size;
  const to = from + size - 1;

  // verify set ownership implicit via RLS; also fetch set summary
  const { data: setRow } = await supabase
    .from('megasena_user_sets')
    .select('id, source_numbers, total_combinations, sample_size, seed, created_at')
    .eq('id', setId)
    .maybeSingle();
  if (!setRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: items, error } = await supabase
    .from('megasena_user_items')
    .select('position, numbers, matches')
    .eq('set_id', setId)
    .order('position', { ascending: true })
    .range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ set: setRow, items: items ?? [] });
}


