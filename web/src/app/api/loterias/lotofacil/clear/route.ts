import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error) return { ok: false as const, supabase, status: 500 };
  if (!isAdmin) return { ok: false as const, supabase, status: 403 };
  return { ok: true as const, supabase };
}

export async function POST(request: Request) {
  const admin = await assertAdmin();
  if (!admin.ok)
    return NextResponse.json({ error: 'Forbidden' }, { status: admin.status });
  const supabase = admin.supabase;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = (body ?? {}) as { target?: unknown };
  const target = String(parsed.target ?? 'all');

  const results: Record<string, number> = {};

  if (target === 'all' || target === 'draws') {
    const { data } = await supabase
      .from('lotofacil_draws')
      .delete()
      .neq('concurso', -1)
      .select('concurso');
    results.draws = data?.length ?? 0;
  }

  if (target === 'all' || target === 'stats') {
    const { data } = await supabase
      .from('lotofacil_stats_dezenas')
      .delete()
      .neq('dezena', -1)
      .select('dezena');
    results.stats = data?.length ?? 0;
  }

  if (target === 'all' || target === 'studies') {
    const { data } = await supabase
      .from('lotofacil_stats_catalog')
      .delete()
      .neq('study_key', '')
      .select('study_key');
    results.studies = data?.length ?? 0;
  }

  return NextResponse.json({ ok: true, cleared: results });
}
