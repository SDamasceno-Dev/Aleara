import { createSupabaseServerClient } from '@/lib/supabase/server';
import { StudiesSidebar } from './StudiesSidebar';

export async function DataPanel() {
  const supabase = await createSupabaseServerClient();
  const [lastRes, statsRes] = await Promise.all([
    supabase
      .from('quina_draws')
      .select('concurso, data_sorteio, bola1, bola2, bola3, bola4, bola5, estimativa_premio')
      .order('concurso', { ascending: false })
      .limit(3),
    supabase
      .from('quina_stats_dezenas')
      .select('dezena, vezes_sorteada, pct_sorteios, total_sorteios')
      .order('vezes_sorteada', { ascending: false }),
  ]);
  const draws = lastRes.data ?? [];
  const stats = statsRes.data ?? [];
  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
      <section className='lg:col-span-3 rounded-md border border-white/10 p-3'>
        <div className='text-sm text-zinc-200 mb-2'>Últimos resultados</div>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm'>
            <thead className='text-zinc-400'>
              <tr className='text-left'>
                <th className='py-2 pl-3 pr-3 font-medium w-24'>Concurso</th>
                <th className='py-2 pr-3 font-medium w-44'>Data</th>
                <th className='py-2 pr-3 font-medium'>Dezenas</th>
                <th className='py-2 pr-3 font-medium w-40'>Estimativa prêmio</th>
              </tr>
            </thead>
            <tbody className='text-zinc-300/90'>
              {draws.map((r: any) => {
                const arr = [r.bola1, r.bola2, r.bola3, r.bola4, r.bola5]
                  .map((n: number) => String(n).padStart(2, '0'))
                  .join(' • ');
                const data = new Date(r.data_sorteio).toLocaleDateString('pt-BR');
                const est = r.estimativa_premio != null ? r.estimativa_premio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
                return (
                  <tr key={r.concurso} className='border-t border-white/10'>
                    <td className='py-2 pl-3 pr-3'>{r.concurso}</td>
                    <td className='py-2 pr-3'>{data}</td>
                    <td className='py-2 pr-3 font-medium text-zinc-100'>{arr}</td>
                    <td className='py-2 pr-3'>{est}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className='lg:col-span-2 rounded-md border border-white/10 p-3'>
        <div className='text-sm text-zinc-200 mb-2'>Frequência de dezenas</div>
        <div className='overflow-x-auto max-h-[60vh] overflow-y-auto scroll-y rounded-md border border-white/10'>
          <table className='min-w-full text-sm'>
            <thead className='sticky top-0 bg-black-10 text-zinc-400'>
              <tr className='text-left'>
                <th className='py-2 pl-3 pr-3 font-medium w-20'>Dezena</th>
                <th className='py-2 pr-3 font-medium w-24 text-right'>Vezes</th>
                <th className='py-2 pr-3 font-medium w-24 text-right'>%</th>
              </tr>
            </thead>
            <tbody className='text-zinc-300/90'>
              {stats.map((s: any) => (
                <tr key={s.dezena} className='border-t border-white/10'>
                  <td className='py-2 pl-3 pr-3'>{String(s.dezena).padStart(2, '0')}</td>
                  <td className='py-2 pr-3 text-right'>{s.vezes_sorteada}</td>
                  <td className='py-2 pr-3 text-right'>{((s.pct_sorteios ?? 0) * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <StudiesSidebar />
      </section>
    </div>
  );
}


