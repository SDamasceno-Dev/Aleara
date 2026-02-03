import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get total draws
  const { count: totalDraws } = await supabase
    .from('lotofacil_draws')
    .select('concurso', { count: 'exact' });

  // Get latest draw
  const { data: latestDraw } = await supabase
    .from('lotofacil_draws')
    .select('concurso, data_sorteio')
    .order('concurso', { ascending: false })
    .limit(1)
    .single();

  // Get first draw
  const { data: firstDraw } = await supabase
    .from('lotofacil_draws')
    .select('concurso, data_sorteio')
    .order('concurso', { ascending: true })
    .limit(1)
    .single();

  // Get frequency stats
  const { data: stats } = await supabase
    .from('lotofacil_stats_dezenas')
    .select('dezena, vezes_sorteada, pct_sorteios')
    .order('vezes_sorteada', { ascending: false });

  return NextResponse.json({
    totalDraws: totalDraws ?? 0,
    latestContest: latestDraw?.concurso ?? null,
    latestDate: latestDraw?.data_sorteio ?? null,
    firstContest: firstDraw?.concurso ?? null,
    firstDate: firstDraw?.data_sorteio ?? null,
    frequencyStats: stats ?? [],
  });
}
