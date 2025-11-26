import { createSupabaseServerClient } from '@/lib/supabase/server';

type FrequencyRow = {
  dezena: number;
  vezes_sorteada: number;
  percentual: number;
};

function formatPercent(p: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(p) + '%';
}

export async function FrequencyTable() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('megasena_v_frequency')
    .select('dezena, vezes_sorteada, percentual');

  if (error) {
    return (
      <div className='rounded-lg border border-border/60 bg-card/90 p-4 text-sm text-red-300/90'>
        Falha ao carregar frequência: {error.message}
      </div>
    );
  }
  const rows = (data as unknown as FrequencyRow[]) ?? [];
  if (rows.length === 0) {
    return (
      <div className='rounded-lg border border-border/60 bg-card/90 p-4 text-sm text-zinc-300/90'>
        Frequência indisponível.
      </div>
    );
  }
  return (
    <section className='rounded-lg border border-border/60 bg-card/90 p-4'>
      <div className='mb-3 text-sm text-zinc-200'>Frequência de dezenas</div>
      <div className='overflow-x-auto'>
        <table className='min-w-full text-sm'>
          <thead className='text-zinc-400'>
            <tr className='text-left'>
              <th className='py-2 pr-3 font-medium'>Dezena</th>
              <th className='py-2 pr-3 font-medium'>Vezes sorteada</th>
              <th className='py-2 pr-3 font-medium'>% de sorteio em jogos</th>
            </tr>
          </thead>
          <tbody className='text-zinc-300/90'>
            {rows.map((r) => (
              <tr key={r.dezena} className='border-t border-white/10'>
                <td className='py-2 pr-3 font-medium text-zinc-100'>
                  {String(r.dezena).padStart(2, '0')}
                </td>
                <td className='py-2 pr-3'>{r.vezes_sorteada}</td>
                <td className='py-2 pr-3'>{formatPercent(r.percentual)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


