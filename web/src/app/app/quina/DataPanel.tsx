import { createSupabaseServerClient } from '@/lib/supabase/server';
import { StudiesSidebar } from './StudiesSidebar';

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

export async function DataPanel() {
  const supabase = await createSupabaseServerClient();
  const [drawsRes, statsRes] = await Promise.all([
    supabase
      .from('quina_draws')
      .select(
        'concurso, data_sorteio, bola1, bola2, bola3, bola4, bola5, estimativa_premio',
      )
      .order('concurso', { ascending: false })
      .limit(3),
    supabase
      .from('quina_stats_dezenas')
      .select('dezena, vezes_sorteada, pct_sorteios, total_sorteios')
      .order('vezes_sorteada', { ascending: false })
      .order('dezena', { ascending: true }),
  ]);
  const rows = drawsRes.data ?? [];
  const stats = statsRes.data ?? [];
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
              {rows.map((r: any) => {
                const dezenas = [r.bola1, r.bola2, r.bola3, r.bola4, r.bola5]
                  .map((n: number) => String(n).padStart(2, '0'))
                  .join(' • ');
                return (
                  <tr key={r.concurso} className='border-t border-white/10'>
                    <td className='py-2 pr-3'>{r.concurso}</td>
                    <td className='py-2 pr-3'>
                      {formatDateBR(r.data_sorteio)}
                    </td>
                    <td className='py-2 pr-3 font-medium text-zinc-100'>
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
                  {stats.map((s: any) => (
                    <tr key={s.dezena} className='border-t border-white/10'>
                      <td className='py-2 pr-3 font-medium text-zinc-100'>
                        {String(s.dezena).padStart(2, '0')}
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
        <StudiesSidebar />
      </div>
    </section>
  );
}
