import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ setId: string }> },
) {
  const { setId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(_.url);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1);
  const size = Math.min(
    1000,
    Math.max(1, Number(url.searchParams.get('size') ?? 100) || 100),
  );
  const from = (page - 1) * size;
  const to = from + size - 1;

  // verify set ownership implicit via RLS; also fetch set summary
  const { data: setRow } = await supabase
    .from('lotomania_user_sets')
    .select(
      'id, source_numbers, total_combinations, sample_size, seed, created_at, title, marked_idx',
    )
    .eq('id', setId)
    .maybeSingle();
  if (!setRow)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch items (sem matches - matches são calculados apenas durante conferência)
  const { data: items, error } = await supabase
    .from('lotomania_user_items')
    .select('position, numbers')
    .eq('set_id', setId)
    .order('position', { ascending: true })
    .range(from, to);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Retornar items com matches: null (conferência é feita separadamente)
  return NextResponse.json({
    set: setRow,
    items: (items ?? []).map((it) => ({
      position: it.position,
      numbers: it.numbers,
      matches: null,
    })),
  });
}
