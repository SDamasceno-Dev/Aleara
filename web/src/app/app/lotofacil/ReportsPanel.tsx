'use client';

import { useEffect, useMemo, useState } from 'react';
import { LoadingOverlay } from '@/components/overlay/LoadingOverlay';

type ReportItem = { position: number; numbers: number[]; matches: number };
type ReportData = {
  contestNo: number;
  draw: number[];
  checkedAt: string;
  kpis: {
    total: number;
    c11: number;
    c12: number;
    c13: number;
    c14: number;
    c15: number;
    hitRate: number;
  };
  items: ReportItem[];
};

type AggregateRow = {
  contestNo: number;
  checkedAt: string;
  total: number;
  c11: number;
  c12: number;
  c13: number;
  c14: number;
  c15: number;
  hitRate: number;
};
type AggregateData = {
  kpis: {
    totalConferences: number;
    totalBets: number;
    avgPerCheck: number;
    c11: number;
    c12: number;
    c13: number;
    c14: number;
    c15: number;
    hitRate: number;
  };
  rows: AggregateRow[];
};

export default function ReportsPanel() {
  const [contestInput, setContestInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aggregate, setAggregate] = useState<AggregateData | null>(null);
  const [viewMode, setViewMode] = useState<'detail' | 'aggregate'>('detail');
  const [busy, setBusy] = useState(false);

  async function loadLatest() {
    setBusy(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/loterias/lotofacil/reports/latest', {
        cache: 'no-store',
      });
      const data = await fetchToJson(res);
      if (!res.ok) {
        setError(data?.error || 'Falha ao carregar relatório.');
        setReport(null);
        return;
      }
      if (data?.empty || !data?.draw) {
        setReport(null);
        return;
      }
      // Transform draw data to report format
      const draw = data.draw as {
        concurso: number;
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
      };
      const drawNumbers = [
        draw.bola1, draw.bola2, draw.bola3, draw.bola4, draw.bola5,
        draw.bola6, draw.bola7, draw.bola8, draw.bola9, draw.bola10,
        draw.bola11, draw.bola12, draw.bola13, draw.bola14, draw.bola15,
      ];
      setReport({
        contestNo: draw.concurso,
        draw: drawNumbers,
        checkedAt: new Date().toISOString(),
        kpis: { total: 0, c11: 0, c12: 0, c13: 0, c14: 0, c15: 0, hitRate: 0 },
        items: [],
      });
      setAggregate(null);
      setViewMode('detail');
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }

  async function loadByContest(n: number) {
    setBusy(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/loterias/lotofacil/reports/by-contest?contest=${n}`,
        { cache: 'no-store' },
      );
      const data = await fetchToJson(res);
      if (!res.ok) {
        setError(data?.error || 'Falha ao carregar relatório.');
        setReport(null);
        return;
      }
      if (!data?.draw) {
        setError('Concurso não encontrado.');
        setReport(null);
        return;
      }
      const draw = data.draw as {
        concurso: number;
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
      };
      const drawNumbers = [
        draw.bola1, draw.bola2, draw.bola3, draw.bola4, draw.bola5,
        draw.bola6, draw.bola7, draw.bola8, draw.bola9, draw.bola10,
        draw.bola11, draw.bola12, draw.bola13, draw.bola14, draw.bola15,
      ];
      setReport({
        contestNo: draw.concurso,
        draw: drawNumbers,
        checkedAt: new Date().toISOString(),
        kpis: { total: 0, c11: 0, c12: 0, c13: 0, c14: 0, c15: 0, hitRate: 0 },
        items: [],
      });
      setAggregate(null);
      setViewMode('detail');
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }

  async function loadAggregate() {
    setBusy(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/loterias/lotofacil/reports/aggregate', {
        cache: 'no-store',
      });
      const data = await fetchToJson(res);
      if (!res.ok) {
        setError(data?.error || 'Falha ao carregar relatório geral.');
        setAggregate(null);
        return;
      }
      setAggregate({
        kpis: {
          totalConferences: data.totalDraws ?? 0,
          totalBets: 0,
          avgPerCheck: 0,
          c11: 0,
          c12: 0,
          c13: 0,
          c14: 0,
          c15: 0,
          hitRate: 0,
        },
        rows: [],
      });
      setReport(null);
      setViewMode('aggregate');
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAggregate();
  }, []);

  const drawStr = useMemo(
    () =>
      (report?.draw ?? []).map((n) => String(n).padStart(2, '0')).join(', '),
    [report],
  );

  return (
    <section className='rounded-lg border border-border/60 bg-card/90 p-4'>
      <LoadingOverlay
        show={busy}
        message={viewMode === 'aggregate' ? 'Carregando…' : 'Gerando…'}
      />
      <div className='mb=3 text-sm text-zinc-200'>Relatórios</div>
      <div className='mb-3 flex flex-wrap items-end gap-3'>
        <label className='text-xs text-zinc-400'>
          Concurso
          <input
            value={contestInput}
            onChange={(e) =>
              setContestInput(e.target.value.replace(/\D+/g, ''))
            }
            className='ml-2 w-24 rounded-md border border-black-30 bg-white-10 px-2 py-1 text-sm'
            placeholder='Ex.: 3456'
          />
        </label>
        <div className='flex gap-2'>
          <button
            className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
            disabled={!contestInput || loading}
            onClick={() => loadByContest(Number(contestInput))}
          >
            Carregar por concurso
          </button>
          <button
            className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
            disabled={loading}
            onClick={loadLatest}
          >
            Último resultado
          </button>
          <button
            className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
            disabled={loading}
            onClick={loadAggregate}
          >
            Relatório geral
          </button>
        </div>
      </div>

      {loading ? (
        <div className='text-sm text-zinc-400'>Carregando…</div>
      ) : error ? (
        <div className='text-sm text-(--alertError)'>{error}</div>
      ) : viewMode === 'aggregate' ? (
        !aggregate || aggregate.kpis.totalConferences === 0 ? (
          <div className='text-sm text-zinc-400'>
            Nenhum sorteio encontrado. Importe a base primeiro.
          </div>
        ) : (
          <>
            <div className='mb-3 grid grid-cols-2 gap-2 md:grid-cols-4'>
              <KpiCard
                label='Total de Sorteios'
                value={aggregate.kpis.totalConferences}
              />
              <KpiCard label='Prêmio 11' value={aggregate.kpis.c11} />
              <KpiCard label='Prêmio 12' value={aggregate.kpis.c12} />
              <KpiCard label='Prêmio 13' value={aggregate.kpis.c13} />
              <KpiCard label='Prêmio 14' value={aggregate.kpis.c14} />
              <KpiCard label='Prêmio 15' value={aggregate.kpis.c15} highlight />
            </div>
          </>
        )
      ) : !report ? (
        <div className='text-sm text-zinc-400'>
          Nenhum resultado encontrado.
        </div>
      ) : (
        <>
          <div className='mb-3 grid grid-cols-2 gap-2 md:grid-cols-4'>
            <KpiCard label='Concurso' value={report.contestNo} />
            <KpiCard label='Acertos 11' value={report.kpis.c11} />
            <KpiCard label='Acertos 12' value={report.kpis.c12} />
            <KpiCard label='Acertos 13' value={report.kpis.c13} />
            <KpiCard label='Acertos 14' value={report.kpis.c14} />
            <KpiCard label='Acertos 15' value={report.kpis.c15} highlight />
          </div>
          <div className='mb-2 text-xs text-zinc-400'>
            Sorteio: <span className='text-zinc-200'>{drawStr || '—'}</span>
          </div>
          {report.items.length > 0 && (
            <div className='rounded-md border border-white/10'>
              <div className='overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead className='text-zinc-400'>
                    <tr className='text-left'>
                      <th className='py-2 pl-3 pr-3 font-medium w-12'>#</th>
                      <th className='py-2 pr-3 font-medium w-24'>Posição</th>
                      <th className='py-2 pr-3 font-medium'>Dezenas</th>
                      <th className='py-2 pr-3 font-medium w-24'>Acertos</th>
                    </tr>
                  </thead>
                  <tbody className='text-zinc-300/90'>
                    {report.items.map((it, idx) => (
                      <tr
                        key={`${it.position}-${idx}`}
                        className='border-t border-white/10'
                      >
                        <td className='py-2 pl-3 pr-3'>{idx + 1}</td>
                        <td className='py-2 pr-3'>( {it.position} )</td>
                        <td className='py-2 pr-3 font-medium text-zinc-100'>
                          {it.numbers.map((n, i) => (
                            <span
                              key={`${it.position}-${n}-${i}`}
                              className='inline-flex items-center'
                            >
                              <span>{String(n).padStart(2, '0')}</span>
                              {i < it.numbers.length - 1 ? (
                                <span className='px-1 text-zinc-500'>•</span>
                              ) : null}
                            </span>
                          ))}
                        </td>
                        <td className='py-2 pr-3'>{it.matches}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function KpiCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className='rounded-md border border-white/10 p-3'>
      <div className='text-[11px] text-zinc-400'>{label}</div>
      <div
        className={`text-lg font-semibold ${highlight ? 'text-green-300' : 'text-zinc-100'}`}
      >
        {value}
      </div>
    </div>
  );
}

async function fetchToJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}
