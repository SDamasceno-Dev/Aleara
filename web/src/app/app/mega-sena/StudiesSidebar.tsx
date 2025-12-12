'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDialog } from '@/components/dialog';
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

type StudiesSidebarProps = {
  previews: StudyPreview[];
  allStudies: Array<{ study_key: string; title: string }>;
};

function formatItem(studyKey: string, itemKey: string, value: number) {
  if (studyKey === 'pair_freq' || studyKey === 'consecutive_pair')
    return `${itemKey.replace(/^.*?:/, '')} • ${value}`;
  if (studyKey === 'sum_range_20')
    return `${itemKey.replace(/^.*?:/, '')} • ${value}`;
  if (studyKey === 'parity_comp')
    return `${itemKey.replace(/^.*?:/, '')} • ${value}`;
  if (studyKey === 'repeaters_prev')
    return `${itemKey.replace(/^.*?:/, '')} repetidores • ${value}`;
  if (studyKey === 'overdue_dezena')
    return `${itemKey.replace(/^.*?:/, '')} • atraso ${value}`;
  if (studyKey === 'window200_hot')
    return `${itemKey.replace(/^.*?:/, '')} • ${value}`;
  if (studyKey === 'decade_dist')
    return `${itemKey.replace(/^.*?:/, '')} • ${value}`;
  if (studyKey === 'last_digit')
    return `${itemKey.replace(/^.*?:/, '')} • ${value}`;
  return `${itemKey} • ${value}`;
}

export function StudiesSidebar({ previews, allStudies }: StudiesSidebarProps) {
  const dialog = useDialog();
  const [selected, setSelected] = useState<string>('');
  const mapTitle = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of allStudies) m.set(s.study_key, s.title);
    return m;
  }, [allStudies]);
  const descriptions = useMemo<Record<string, string>>(
    () => ({
      freq_all: 'Frequência total por dezena em toda a série histórica.',
      hot_top: 'Dezenas mais frequentes historicamente (quentes).',
      cold_top: 'Dezenas menos frequentes historicamente (frias).',
      overdue_dezena:
        'Lista as dezenas com maior tempo desde a última ocorrência.',
      pair_freq:
        'Pares de dezenas que mais saíram juntas em toda a série histórica.',
      consecutive_pair: 'Pares consecutivos (n e n+1) mais frequentes.',
      sum_range_20:
        'Faixas de soma (largura 20) mais comuns entre as 6 dezenas.',
      parity_comp: 'Composições de pares/ímpares mais frequentes (ex.: 3p-3i).',
      repeaters_prev:
        'Quantidade de repetidores em relação ao sorteio anterior.',
      window200_hot: 'Dezenas mais frequentes nos últimos 200 concursos.',
      decade_dist: 'Distribuição de dezenas por décadas (01–10, 11–20, ...).',
      last_digit:
        'Distribuição dos últimos dígitos (0–9) das dezenas sorteadas.',
      high_low_comp: 'Composições com dezenas baixas (1–30) e altas (31–60).',
      sum_exact: 'Distribuição da soma exata das dezenas sorteadas.',
      mean_gap: 'Distribuição da distância média entre dezenas (gaps).',
      ac_value: 'Distribuição do valor AC (nº de diferenças distintas).',
      triple_freq: 'Trincas de dezenas mais frequentes.',
      quad_freq: 'Quadras de dezenas mais frequentes.',
      repeaters_accum: 'Repetidores quando o sorteio veio de acumulação.',
      chi_square:
        'Métrica de diagnóstico de desvio da uniformidade (qui-quadrado).',
      // Tool-like (não pré-calculados): wheels, monte carlo, EV rollover
      wheels_tool:
        'Ferramenta de reduções/coberturas para gerar jogos com garantias.',
      monte_carlo_tool:
        'Simulação para avaliar filtros/estratégias com seu orçamento.',
      ev_rollover_tool:
        'Ajuste de valor esperado com base no prêmio acumulado atual.',
    }),
    [],
  );

  useEffect(() => {
    // keep placeholder if none selected
  }, [selected, allStudies]);

  async function openFullList(key: string) {
    const res = await fetch(
      `/api/loterias/mega-sena/studies?key=${encodeURIComponent(key)}&limit=60`,
    );
    const data = await res.json();
    const items = (data.items ?? []) as Array<{
      item_key: string;
      rank: number;
      value: number;
      extra?: Record<string, unknown>;
    }>;
    dialog.open({
      intent: 'message',
      size: 'md',
      title: 'Estudo',
      description: (
        <div className='max-h-[70dvh] rounded-md border border-black/10 bg-white text-zinc-900 overflow-hidden'>
          {/* Cabeçalho fixo (nome e descrição) */}
          <div className='sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-black/10 px-3 py-2'>
            <div className='text-sm font-medium text-zinc-900'>
              {mapTitle.get(key) || '—'}
            </div>
            <div className='text-xs text-zinc-600'>
              {descriptions[key] || ''}
            </div>
          </div>
          {/* Área rolável apenas para os dados */}
          <div className='max-h-[60dvh] overflow-y-auto overflow-x-auto scroll-y'>
            {Array.isArray(items) && items.length > 0 ? (
              <table className='min-w-full text-sm'>
                <thead className='sticky top-0 z-10 bg-white text-zinc-700 shadow-sm'>
                  <tr className='text-center'>
                    <th className='py-2 pl-3 pr-3 font-bold w-16'>#</th>
                    <th className='py-2 pr-3 font-bold text-left'>Item</th>
                    <th className='py-2 pr-3 font-bold w-28'>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr
                      key={it.item_key}
                      className='border-t border-black/10 text-center hover:bg-[var(--black-10)] cursor-pointer'
                    >
                      <td className='py-2 pl-3 pr-3 text-zinc-600'>
                        {it.rank}
                      </td>
                      <td className='py-2 pr-3 font-medium text-zinc-900 text-left'>
                        {String(it.item_key).replace(/^.*?:/, '')}
                      </td>
                      <td className='py-2 pr-3 text-zinc-700'>{it.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className='px-3 py-2 text-xs text-zinc-600'>
                Sem dados para este estudo.
              </div>
            )}
          </div>
        </div>
      ),
    });
    // reset selection right after opening (volta para placeholder ao fechar)
    setSelected('');
  }

  return (
    <aside className='rounded-lg border border-border/60 bg-card/90 p-4 md:w-1/2'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <div className='text-sm text-zinc-200'>Estudos</div>
        <div className='min-w-0'>
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
              if (v) openFullList(v);
            }}
          />
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
              <div className='text-sm text-zinc-400 mb-2'>{p.title}</div>
              <ul className='text-sm text-zinc-300/90 space-y-1'>
                {p.items.slice(0, 5).map((it) => (
                  <li
                    key={it.item_key}
                    className='flex items-center justify-between'
                  >
                    <span>
                      {formatItem(p.study_key, it.item_key, it.value)}
                    </span>
                    <span className='text-zinc-500'>#{it.rank}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </aside>
  );
}
