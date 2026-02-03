import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const studyKey = url.searchParams.get('key');

  if (studyKey) {
    // Fetch specific study
    const { data: catalog, error: catErr } = await supabase
      .from('lotofacil_stats_catalog')
      .select('study_key, title, params')
      .eq('study_key', studyKey)
      .single();
    if (catErr || !catalog)
      return NextResponse.json({ error: 'Study not found' }, { status: 404 });

    const { data: items, error: itemsErr } = await supabase
      .from('lotofacil_stats_items')
      .select('item_key, rank, value, extra')
      .eq('study_key', studyKey)
      .order('rank', { ascending: true });
    if (itemsErr)
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });

    return NextResponse.json({
      study: {
        ...catalog,
        items: items ?? [],
      },
    });
  }

  // Fetch all studies catalog
  const { data: catalog, error } = await supabase
    .from('lotofacil_stats_catalog')
    .select('study_key, title')
    .order('study_key', { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ studies: catalog ?? [] });
}
