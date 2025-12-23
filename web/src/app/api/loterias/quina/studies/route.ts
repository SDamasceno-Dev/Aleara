import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const url = new URL(request.url);
  const studyKey = url.searchParams.get('study_key');
  const rawLimit = url.searchParams.get('limit');
  const limit = rawLimit ? Math.min(10000, Math.max(1, Number(rawLimit))) : 60;

  if (!studyKey) {
    // Return catalog
    const { data, error } = await supabase
      .from('quina_stats_catalog')
      .select('study_key, title')
      .order('study_key', { ascending: true });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ catalog: data ?? [] });
  }

  const [{ data: catalog }, { data: items, error }] = await Promise.all([
    supabase
      .from('quina_stats_catalog')
      .select('study_key, title, params')
      .eq('study_key', studyKey)
      .maybeSingle(),
    supabase
      .from('quina_stats_items')
      .select('rank, item_key, value, extra')
      .eq('study_key', studyKey)
      .order('rank', { ascending: true })
      .limit(limit),
  ]);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    study: catalog ?? { study_key: studyKey, title: studyKey, params: {} },
    items: items ?? [],
  });
}
