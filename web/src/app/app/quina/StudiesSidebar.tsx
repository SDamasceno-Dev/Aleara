'use client';

import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { Select } from '@/components/select/Select';

type StudyPreview = {
  study_key: string;
  title: string;
  items: Array<{
    item_key: string;
    rank: number;
    value: number;
    extra?: Record<string, unknown>;
  }>;
};

export function StudiesSidebar({
  previews,
  allStudies,
}: {
  previews: StudyPreview[];
  allStudies: Array<{ study_key: string; title: string }>;
}) {
  const [selected, setSelected] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studyTitle, setStudyTitle] = useState<string>('');
  const [items, setItems] = useState<
    Array<{ rank: number; item_key: string; value: number }>
  >([]);
  const [exporting, setExporting] = useState(false);

  const descriptions = useMemo<Record<string, string>>(
    () => ({
      overdue_dezena:
        'Lista as dezenas com maior tempo desde a última ocorrência.',
      pair_freq:
        'Pares de dezenas que mais saíram juntas em toda a série histórica.',
      consecutive_pair: 'Pares consecutivos (n e n+1) mais frequentes.',
      sum_range_20:
        'Faixas de soma (largura 20) mais comuns entre as 5 dezenas.',
      parity_comp: 'Composições de pares/ímpares mais frequentes (ex.: 3p-2i).',
      repeaters_prev:
        'Quantidade de repetidores em relação ao sorteio anterior.',
      window200_hot: 'Dezenas mais frequentes nos últimos 200 concursos.',
      decade_dist: 'Distribuição de dezenas por décadas (01–10, 11–20, ...).',
      last_digit:
        'Distribuição dos últimos dígitos (0–9) das dezenas sorteadas.',
      freq_all: 'Frequência total por dezena em toda a série histórica.',
      hot_top: 'Dezenas mais frequentes historicamente (quentes).',
      cold_top: 'Dezenas menos frequentes historicamente (frias).',
    }),
    [],
  );

  async function loadStudy(key: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/loterias/quina/studies?study_key=${encodeURIComponent(
          key,
        )}&limit=60`,
      );
      const data = await res.json();
      setStudyTitle(data?.study?.title ?? key);
      setItems(
        ((data?.items ?? []) as Array<{
          rank: number;
          item_key: string;
          value: number;
        }>) ?? [],
      );
      setOpen(true);
      setSelected('');
    } finally {
      setLoading(false);
    }
  }

  async function exportAllStudies() {
    setExporting(true);
    try {
      // Buscar quantidade total de jogos
      const totalRes = await fetch('/api/loterias/quina/total-draws');
      const totalData = await totalRes.json();
      const totalJogos = (totalData?.total_sorteios as number | undefined) ?? 0;

      // Preparar CSV
      const csvRows: string[] = [];
      csvRows.push('Estudo,Descrição,Quantidade Total de Jogos');
      csvRows.push('');

      // Exportar todos os estudos
      for (const study of allStudies) {
        const studyKey = study.study_key;
        const description = descriptions[studyKey] || '';

        // Buscar os primeiros 10 itens do estudo
        const res = await fetch(
          `/api/loterias/quina/studies?study_key=${encodeURIComponent(
            studyKey,
          )}&limit=10`,
        );
        const data = await res.json();
        const studyData = data?.study ?? {
          study_key: studyKey,
          title: study.title,
          params: {},
        };
        const items = (
          (data?.items ?? []) as Array<{
            rank: number;
            item_key: string;
            value: number;
          }>
        ).slice(0, 10);

        // Adicionar cabeçalho do estudo
        csvRows.push(`"${studyData.title}","${description}",${totalJogos}`);
        csvRows.push('Rank,Item,Valor');

        // Adicionar itens do estudo
        for (const item of items) {
          const itemKey = String(item.item_key).replace(/^.*?:/, '');
          csvRows.push(`${item.rank},"${itemKey}",${item.value}`);
        }

        // Separador entre estudos
        csvRows.push('');
      }

      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `estudos_quina_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar estudos:', error);
      alert('Erro ao exportar estudos. Tente novamente.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <aside className='rounded-lg border border-border/60 bg-card/90 p-4 md:w-1/2'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <div className='text-sm text-zinc-200'>Estudos</div>
        <div className='flex items-center gap-2 min-w-0'>
          <Select
            theme='light'
            items={allStudies.map((s) => ({
              value: s.study_key,
              label: s.title,
            }))}
            value={selected}
            placeholder='Escolha uma opção'
            onChange={(v) => {
              setSelected(v);
              if (v) loadStudy(v);
            }}
          />
          <button
            type='button'
            onClick={exportAllStudies}
            disabled={exporting || allStudies.length === 0}
            className='rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            aria-label='Exportar todos os estudos'
            title='Exportar todos os estudos em um único arquivo CSV'
          >
            {exporting ? 'Exportando...' : 'Exportar'}
          </button>
        </div>
      </div>
      <div className='space-y-4'>
        {previews
          .filter((p) => (p.items?.length ?? 0) > 0)
          .map((p) => (
            <div
              key={p.study_key}
              className='rounded-md border border-white/10 p-3'
            >
              <div className='flex items-center gap-2 text-sm text-zinc-400 mb-2'>
                <span>{p.title}</span>
                {descriptions[p.study_key] && (
                  <div className='group relative inline-flex'>
                    <Info
                      className='w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-help transition-colors'
                      aria-label={`Informação: ${descriptions[p.study_key]}`}
                    />
                    <div className='absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-2 text-xs text-zinc-900 bg-white rounded-md shadow-lg border border-black/10 pointer-events-none whitespace-normal'>
                      {descriptions[p.study_key]}
                    </div>
                  </div>
                )}
              </div>
              <ul className='text-sm text-zinc-300/90 space-y-1'>
                {p.items.slice(0, 5).map((it) => (
                  <li
                    key={it.item_key}
                    className='flex items-center justify-between'
                  >
                    <span>{`${String(it.item_key).replace(/^.*?:/, '')} • ${it.value}`}</span>
                    <span className='text-zinc-500'>#{it.rank}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>

      {open ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <button
            aria-label='Fechar'
            onClick={() => setOpen(false)}
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
          />
          <div className='relative z-10 max-w-[80vw] w-[82vw] max-h-[82vh] bg-white text-zinc-900 rounded-md shadow-xl overflow-hidden flex flex-col border border-black/10'>
            <div className='px-5 py-3 border-b border-black/10 bg-white sticky top-0 z-10'>
              <h2 className='text-sm font-semibold tracking-wider'>
                {studyTitle}
              </h2>
            </div>
            <div className='px-5 py-4 flex-1 min-h-0 overflow-hidden'>
              {loading ? (
                <div className='text-sm text-zinc-500'>Carregando…</div>
              ) : items.length === 0 ? (
                <div className='text-sm text-zinc-500'>Sem dados.</div>
              ) : (
                <div className='max-h-[60vh] overflow-y-auto overflow-x-auto scroll-y rounded-md border border-black/10'>
                  <table className='min-w-full text-sm'>
                    <thead className='sticky top-0 bg-white text-zinc-700 shadow-sm'>
                      <tr className='text-left'>
                        <th className='py-2 pl-3 pr-3 w-12'>#</th>
                        <th className='py-2 pr-3'>Item</th>
                        <th className='py-2 pr-3 w-24 text-right'>Valor</th>
                      </tr>
                    </thead>
                    <tbody className='text-zinc-900'>
                      {items.map((it) => (
                        <tr
                          key={it.item_key}
                          className='border-t border-black/10 hover:bg-black-10 cursor-pointer'
                        >
                          <td className='py-2 pl-3 pr-3 text-zinc-600'>
                            {it.rank}
                          </td>
                          <td className='py-2 pr-3 font-medium'>
                            {String(it.item_key).replace(/^.*?:/, '')}
                          </td>
                          <td className='py-2 pr-3 text-right text-zinc-700'>
                            {it.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className='px-5 py-3 border-t border-black/10 bg-white flex items-center justify-end'>
              <button
                type='button'
                className='rounded-md border border-black/10 px-3 py-1 text-sm hover:bg-black/5'
                onClick={() => setOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
