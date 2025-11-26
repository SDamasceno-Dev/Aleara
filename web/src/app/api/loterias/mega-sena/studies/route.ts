import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  // default to 60 items if not provided
  const rawLimit = Number(url.searchParams.get('limit') ?? '');
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(1000, rawLimit) : 60;
  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }
  const { data: catalog } = await supabase
    .from('megasena_stats_catalog')
    .select('study_key, title, params, updated_at')
    .eq('study_key', key)
    .maybeSingle();
  const q = supabase
    .from('megasena_stats_items')
    .select('item_key, rank, value, extra')
    .eq('study_key', key)
    .order('rank', { ascending: true });
  const { data: items, error } = limit ? await q.limit(limit) : await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ catalog, items: items ?? [] });
}


