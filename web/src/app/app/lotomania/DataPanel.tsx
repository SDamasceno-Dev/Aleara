import { createSupabaseServerClient } from '@/lib/supabase/server';
import { StudiesSidebar } from './StudiesSidebar';

type DrawRow = {
  concurso: number;
  data_sorteio: string;
  bola1: number;
  bola2: number;
  bola3: number;
  bola4: number;
  bola5: number;
  bola6: number;
  bola7: number;
  bola8: number;
  bola9: number;
  bola10: number;
  bola11: number;
  bola12: number;
  bola13: number;
  bola14: number;
  bola15: number;
  bola16: number;
  bola17: number;
  bola18: number;
  bola19: number;
  bola20: number;
  estimativa_premio: number | null;
};

type StatRow = {
  dezena: number;
  vezes_sorteada: number;
  pct_sorteios: number;
  total_sorteios: number;
};

function formatDateBR(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(d);
}

function formatBRL(v: number | null): string {
  if (v == null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v);
}

function formatNumber(n: number): string {
  // Convert 100 to "00" for display
  return n === 100 ? '00' : String(n).padStart(2, '0');
}

export async function DataPanel() {
  const supabase = await createSupabaseServerClient();
  const previewKeys = [
    'overdue_dezena',
    'pair_freq',
    'consecutive_pair',
    'sum_range_50',
    'parity_comp',
    'window200_hot',
    'decade_dist',
    'last_digit',
  ];
  const [drawsRes, statsRes, studiesCatalogRes, studiesItemsRes] =
    await Promise.all([
      supabase
        .from('lotomania_draws')
        .select(
          'concurso, data_sorteio, bola1, bola2, bola3, bola4, bola5, bola6, bola7, bola8, bola9, bola10, bola11, bola12, bola13, bola14, bola15, bola16, bola17, bola18, bola19, bola20, estimativa_premio',
        )
        .order('concurso', { ascending: false })
        .limit(3),
      supabase
        .from('lotomania_stats_dezenas')
        .select('dezena, vezes_sorteada, pct_sorteios, total_sorteios')
        .order('vezes_sorteada', { ascending: false })
        .order('dezena', { ascending: true }),
      supabase.from('lotomania_stats_catalog').select('study_key, title'),
      supabase
        .from('lotomania_stats_items')
        .select('study_key, item_key, rank, value, extra')
        .in('study_key', previewKeys)
        .order('study_key', { ascending: true })
        .order('rank', { ascending: true }),
    ]);
  const rows = (drawsRes.data as DrawRow[]) ?? [];
  const stats = (statsRes.data as StatRow[]) ?? [];
  const allStudies = (
    (studiesCatalogRes.data ?? []) as Array<{
      study_key: string;
      title: string;
    }>
  ).map((c) => ({ study_key: c.study_key, title: c.title }));
  const previewsMap = new Map<
    string,
    Array<{
      item_key: string;
      rank: number;
      value: number;
      extra?: Record<string, unknown>;
    }>
  >();
  for (const it of (studiesItemsRes.data ?? []) as Array<{
    study_key: string;
    item_key: string;
    rank: number;
    value: number | string;
    extra?: Record<string, unknown>;
  }>) {
    const arr = previewsMap.get(it.study_key) ?? [];
    arr.push({
      item_key: it.item_key,
      rank: it.rank,
      value: Number(it.value),
      extra: it.extra,
    });
    previewsMap.set(it.study_key, arr);
  }
  const previews = allStudies.map((s) => ({
    study_key: s.study_key,
    title: s.title,
    items: (previewsMap.get(s.study_key) ?? []).slice(0, 5),
  }));
  return (
    <section className='space-y-4'>
      <div className='rounded-lg border border-border/60 bg-card/90 p-4'>
        <div className='mb-3 text-sm text-zinc-200'>Últimos resultados</div>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm'>
            <thead className='text-zinc-400'>
              <tr className='text-left'>
                <th className='py-2 pr-3 font-medium'>Concurso</th>
                <th className='py-2 pr-3 font-medium'>Data</th>
                <th className='py-2 pr-3 font-medium'>Dezenas</th>
                <th className='py-2 pr-3 font-medium whitespace-nowrap'>
                  Estimativa prêmio
                </th>
              </tr>
            </thead>
            <tbody className='text-zinc-300/90'>
              {rows.map((r) => {
                const dezenas = [
                  r.bola1,
                  r.bola2,
                  r.bola3,
                  r.bola4,
                  r.bola5,
                  r.bola6,
                  r.bola7,
                  r.bola8,
                  r.bola9,
                  r.bola10,
                  r.bola11,
                  r.bola12,
                  r.bola13,
                  r.bola14,
                  r.bola15,
                  r.bola16,
                  r.bola17,
                  r.bola18,
                  r.bola19,
                  r.bola20,
                ]
                  .map((n) => formatNumber(n))
                  .join(' • ');
                return (
                  <tr key={r.concurso} className='border-t border-white/10'>
                    <td className='py-2 pr-3'>{r.concurso}</td>
                    <td className='py-2 pr-3'>
                      {formatDateBR(r.data_sorteio)}
                    </td>
                    <td className='py-2 pr-3 font-medium text-zinc-100 text-xs'>
                      {dezenas}
                    </td>
                    <td className='py-2 pr-3'>
                      {formatBRL(r.estimativa_premio)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className='md:flex gap-4'>
        <div className='rounded-lg border border-border/60 bg-card/90 p-4 md:w-1/2'>
          <div className='mb-3 text-sm text-zinc-200'>
            Frequência de dezenas (mais sorteadas)
          </div>
          {stats.length ? (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-sm'>
                <thead className='text-zinc-400'>
                  <tr className='text-left'>
                    <th className='py-2 pr-3 font-medium'>Dezena</th>
                    <th className='py-2 pr-3 font-medium'>Vezes</th>
                    <th className='py-2 pr-3 font-medium'>% de sorteios</th>
                  </tr>
                </thead>
                <tbody className='text-zinc-300/90'>
                  {stats.map((s) => (
                    <tr key={s.dezena} className='border-t border-white/10'>
                      <td className='py-2 pr-3 font-medium text-zinc-100'>
                        {formatNumber(s.dezena)}
                      </td>
                      <td className='py-2 pr-3'>{s.vezes_sorteada}</td>
                      <td className='py-2 pr-3'>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'percent',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(s.pct_sorteios)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='text-xs text-zinc-400'>
              Estatísticas ainda não disponíveis. Importe a base para gerar.
            </div>
          )}
        </div>
        <StudiesSidebar previews={previews} allStudies={allStudies} />
      </div>
    </section>
  );
}
