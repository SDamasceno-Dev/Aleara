import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ setId: string }> },
) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { setId } = await params;
  if (!setId)
    return NextResponse.json({ error: 'Missing setId' }, { status: 400 });

  // Fetch set
  const { data: setData, error: setErr } = await supabase
    .from('lotofacil_user_sets')
    .select('*')
    .eq('id', setId)
    .single();
  if (setErr || !setData)
    return NextResponse.json({ error: 'Set not found' }, { status: 404 });
  if (setData.user_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Parse query params for pagination
  const url = new URL(request.url);
  const size = Math.min(
    5000,
    Math.max(1, Number(url.searchParams.get('size') ?? 1000)),
  );
  const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0));

  // Fetch items
  const { data: items, error: itemsErr } = await supabase
    .from('lotofacil_user_items')
    .select('position, numbers, matches')
    .eq('set_id', setId)
    .order('position', { ascending: true })
    .range(offset, offset + size - 1);
  if (itemsErr)
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  return NextResponse.json({
    set: setData,
    items: items ?? [],
  });
}
