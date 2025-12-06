'use client';

import { useEffect, useMemo, useState } from 'react';
import { LoadingOverlay } from '@/components/overlay/LoadingOverlay';

type ReportItem = { position: number; numbers: number[]; matches: number };
type ReportData = {
  contestNo: number;
  draw: number[];
  checkedAt: string;
  kpis: { total: number; c4: number; c5: number; c6: number; hitRate: number };
  items: ReportItem[];
};

type AggregateRow = {
  contestNo: number;
  checkedAt: string;
  total: number;
  c4: number;
  c5: number;
  c6: number;
  hitRate: number;
};
type AggregateData = {
  kpis: {
    totalConferences: number;
    totalBets: number;
    avgPerCheck: number;
    c4: number;
    c5: number;
    c6: number;
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
  const [busyMsg, setBusyMsg] = useState<string>('Carregando…');

  async function loadLatest() {
    setBusy(true);
    setBusyMsg('Carregando última conferência…');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/loterias/mega-sena/reports/latest', {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Falha ao carregar relatório.');
        setReport(null);
        return;
      }
      if (data?.empty) {
        setReport(null);
        return;
      }
      setReport(data as ReportData);
      setAggregate(null);
      setViewMode('detail');
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }

  async function loadByContest(n: number) {
    setBusy(true);
    setBusyMsg('Carregando relatório do concurso…');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/loterias/mega-sena/reports/by-contest?contestNo=${n}`,
        { cache: 'no-store' },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Falha ao carregar relatório.');
        setReport(null);
        return;
      }
      setReport(data as ReportData);
      setAggregate(null);
      setViewMode('detail');
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }

  async function loadAggregate() {
    setBusy(true);
    setBusyMsg('Carregando relatório geral…');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/loterias/mega-sena/reports/aggregate', {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Falha ao carregar relatório geral.');
        setAggregate(null);
        return;
      }
      if (data?.empty) {
        setAggregate({
          kpis: {
            totalConferences: 0,
            totalBets: 0,
            avgPerCheck: 0,
            c4: 0,
            c5: 0,
            c6: 0,
            hitRate: 0,
          },
          rows: [],
        });
      } else {
        setAggregate(data as AggregateData);
      }
      setReport(null);
      setViewMode('aggregate');
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }

  useEffect(() => {
    // Default: load aggregate (geral)
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
        message={busyMsg}
        subtitle='Preparando dados…'
      />
      <div className='mb-3 text-sm text-zinc-200'>Relatórios</div>

      <div className='mb-3 flex flex-wrap items-end gap-3'>
        <label className='text-xs text-zinc-400'>
          Concurso
          <input
            value={contestInput}
            onChange={(e) =>
              setContestInput(e.target.value.replace(/\D+/g, ''))
            }
            className='ml-2 w-24 rounded-md border border-black-30 bg-white-10 px-2 py-1 text-sm'
            placeholder='Ex.: 2680'
          />
        </label>
        <button
          type='button'
          className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
          disabled={!contestInput || Number(contestInput) <= 0 || loading}
          onClick={() => loadByContest(Number(contestInput))}
        >
          Carregar por concurso
        </button>
        <button
          type='button'
          className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
          disabled={loading}
          onClick={loadLatest}
        >
          Última conferência
        </button>
        <button
          type='button'
          className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
          disabled={loading}
          onClick={loadAggregate}
        >
          Relatório geral
        </button>
        <button
          type='button'
          className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
          onClick={() => {
            setBusy(true);
            setBusyMsg('Gerando PDF…');
            const url =
              viewMode === 'aggregate'
                ? '/api/loterias/mega-sena/reports/pdf-react?mode=aggregate'
                : report
                  ? `/api/loterias/mega-sena/reports/pdf-react?mode=contest&contestNo=${report.contestNo}`
                  : '/api/loterias/mega-sena/reports/pdf-react?mode=aggregate';
            window.open(url, '_blank');
            setTimeout(() => setBusy(false), 600); // libera rapidamente após abrir
          }}
        >
          Exportar PDF
        </button>
      </div>

      {loading ? (
        <div className='text-sm text-zinc-400'>Carregando…</div>
      ) : error ? (
        <div className='text-sm text-(--alertError)'>{error}</div>
      ) : viewMode === 'aggregate' ? (
        !aggregate || aggregate.kpis.totalConferences === 0 ? (
          <div className='text-sm text-zinc-400'>
            Nenhuma conferência encontrada.
          </div>
        ) : (
          <>
            {/* KPIs agregados */}
            <div className='mb-3 grid grid-cols-2 gap-2 md:grid-cols-6'>
              <div className='rounded-md border border-white/10 p-3'>
                <div className='text-[11px] text-zinc-400'>Conferências</div>
                <div className='text-lg font-semibold text-zinc-100'>
                  {aggregate.kpis.totalConferences}
                </div>
              </div>
              <div className='rounded-md border border-white/10 p-3'>
                <div className='text-[11px] text-zinc-400'>Apostas</div>
                <div className='text-lg font-semibold text-zinc-100'>
                  {aggregate.kpis.totalBets}
                </div>
              </div>
              <div className='rounded-md border border-white/10 p-3'>
                <div className='text-[11px] text-zinc-400'>
                  Média/conferência
                </div>
                <div className='text-lg font-semibold text-zinc-100'>
                  {aggregate.kpis.avgPerCheck.toFixed(1)}
                </div>
              </div>
              <div className='rounded-md border border-white/10 p-3'>
                <div className='text-[11px] text-zinc-400'>Acertos 4</div>
                <div className='text-lg font-semibold text-zinc-100'>
                  {aggregate.kpis.c4}
                </div>
              </div>
              <div className='rounded-md border border-white/10 p-3'>
                <div className='text-[11px] text-zinc-400'>Acertos 5</div>
                <div className='text-lg font-semibold text-zinc-100'>
                  {aggregate.kpis.c5}
                </div>
              </div>
              <div className='rounded-md border border-white/10 p-3'>
                <div className='text-[11px] text-zinc-400'>Acertos 6</div>
                <div className='text-lg font-semibold text-green-300'>
                  {aggregate.kpis.c6}
                </div>
              </div>
            </div>

            {/* Pizza 4/5/6 */}
            <PieSummary
              c4={aggregate.kpis.c4}
              c5={aggregate.kpis.c5}
              c6={aggregate.kpis.c6}
              total={aggregate.kpis.totalBets}
            />

            {/* Tabela por concurso */}
            <div className='rounded-md border border-white/10'>
              <div className='overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead className='text-zinc-400'>
                    <tr className='text-left'>
                      <th className='py-2 pl-3 pr-3 font-medium w-24'>
                        Concurso
                      </th>
                      <th className='py-2 pr-3 font-medium w-44'>
                        Conferido em
                      </th>
                      <th className='py-2 pr-3 font-medium w-24'>Apostas</th>
                      <th className='py-2 pr-3 font-medium w-20'>4</th>
                      <th className='py-2 pr-3 font-medium w-20'>5</th>
                      <th className='py-2 pr-3 font-medium w-20'>6</th>
                      <th className='py-2 pr-3 font-medium w-24'>Taxa</th>
                    </tr>
                  </thead>
                  <tbody className='text-zinc-300/90'>
                    {aggregate.rows.map((r) => (
                      <tr
                        key={`${r.contestNo}-${r.checkedAt}`}
                        className='border-t border-white/10'
                      >
                        <td className='py-2 pl-3 pr-3'>{r.contestNo}</td>
                        <td className='py-2 pr-3'>
                          {new Date(r.checkedAt).toLocaleString()}
                        </td>
                        <td className='py-2 pr-3'>{r.total}</td>
                        <td className='py-2 pr-3'>{r.c4}</td>
                        <td className='py-2 pr-3'>{r.c5}</td>
                        <td className='py-2 pr-3 text-green-300'>{r.c6}</td>
                        <td className='py-2 pr-3'>
                          {(r.hitRate * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      ) : !report ? (
        <div className='text-sm text-zinc-400'>
          Nenhuma conferência encontrada.
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className='mb-3 grid grid-cols-2 gap-2 md:grid-cols-5'>
            <div className='rounded-md border border-white/10 p-3'>
              <div className='text-[11px] text-zinc-400'>Concurso</div>
              <div className='text-lg font-semibold text-zinc-100'>
                {report.contestNo}
              </div>
            </div>
            <div className='rounded-md border border-white/10 p-3'>
              <div className='text-[11px] text-zinc-400'>Total de apostas</div>
              <div className='text-lg font-semibold text-zinc-100'>
                {report.kpis.total}
              </div>
            </div>
            <div className='rounded-md border border-white/10 p-3'>
              <div className='text-[11px] text-zinc-400'>Acertos 4</div>
              <div className='text-lg font-semibold text-zinc-100'>
                {report.kpis.c4}
              </div>
            </div>
            <div className='rounded-md border border-white/10 p-3'>
              <div className='text-[11px] text-zinc-400'>Acertos 5</div>
              <div className='text-lg font-semibold text-zinc-100'>
                {report.kpis.c5}
              </div>
            </div>
            <div className='rounded-md border border-white/10 p-3'>
              <div className='text-[11px] text-zinc-400'>Acertos 6</div>
              <div className='text-lg font-semibold text-green-300'>
                {report.kpis.c6}
              </div>
            </div>
          </div>

          <div className='mb-2 text-xs text-zinc-400'>
            Sorteio: <span className='text-zinc-200'>{drawStr || '—'}</span> •{' '}
            <span>
              Conferido em {new Date(report.checkedAt).toLocaleString()}
            </span>
          </div>

          {/* Tabela de detalhes */}
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
                        {it.numbers.map((n, i) => {
                          const s = String(n).padStart(2, '0');
                          return (
                            <span
                              key={`${it.position}-${n}-${i}`}
                              className='inline-flex items-center'
                            >
                              <span>{s}</span>
                              {i < it.numbers.length - 1 ? (
                                <span className='px-1 text-zinc-500'>•</span>
                              ) : null}
                            </span>
                          );
                        })}
                      </td>
                      <td className='py-2 pr-3'>{it.matches}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function PieSummary({
  c4,
  c5,
  c6,
  total,
}: {
  c4: number;
  c5: number;
  c6: number;
  total: number;
}) {
  const sum = c4 + c5 + c6;
  if (sum === 0 || total === 0) {
    return (
      <div className='mb-3 text-sm text-zinc-400'>
        Sem dados suficientes para gráfico de pizza.
      </div>
    );
  }
  const size = 180;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const s4 = (c4 / sum) * circumference;
  const s5 = (c5 / sum) * circumference;
  const s6 = (c6 / sum) * circumference;
  const off4 = 0;
  const off5 = -s4;
  const off6 = -(s4 + s5);
  const pct = (n: number) => ((n / total) * 100).toFixed(1);

  return (
    <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
      <div className='flex items-center justify-center'>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className='-rotate-90'
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill='none'
            stroke='rgba(255,255,255,0.08)'
            strokeWidth={stroke}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill='none'
            stroke='#eab308' /* amber-500 */
            strokeWidth={stroke}
            strokeDasharray={`${s4} ${circumference - s4}`}
            strokeDashoffset={off4}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill='none'
            stroke='#f97316' /* orange-500 */
            strokeWidth={stroke}
            strokeDasharray={`${s5} ${circumference - s5}`}
            strokeDashoffset={off5}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill='none'
            stroke='#22c55e' /* green-500 */
            strokeWidth={stroke}
            strokeDasharray={`${s6} ${circumference - s6}`}
            strokeDashoffset={off6}
          />
          {/* centro */}
          <g
            className='rotate-90'
            transform={`translate(${cx},${cy}) rotate(90)`}
          >
            <text
              x='0'
              y='5'
              textAnchor='middle'
              className='fill-white text-sm'
            >
              {sum} hits
            </text>
          </g>
        </svg>
      </div>
      <div className='flex flex-col justify-center gap-2 text-sm'>
        <div className='inline-flex items-center gap-2'>
          <span
            className='inline-block h-3 w-3 rounded-sm'
            style={{ backgroundColor: '#eab308' }}
          />
          <span className='text-zinc-300'>Acertos 4</span>
          <span className='ml-auto font-semibold text-zinc-100'>{c4}</span>
          <span className='text-zinc-400'>({pct(c4)}%)</span>
        </div>
        <div className='inline-flex items-center gap-2'>
          <span
            className='inline-block h-3 w-3 rounded-sm'
            style={{ backgroundColor: '#f97316' }}
          />
          <span className='text-zinc-300'>Acertos 5</span>
          <span className='ml-auto font-semibold text-zinc-100'>{c5}</span>
          <span className='text-zinc-400'>({pct(c5)}%)</span>
        </div>
        <div className='inline-flex items-center gap-2'>
          <span
            className='inline-block h-3 w-3 rounded-sm'
            style={{ backgroundColor: '#22c55e' }}
          />
          <span className='text-zinc-300'>Acertos 6</span>
          <span className='ml-auto font-semibold text-green-300'>{c6}</span>
          <span className='text-zinc-400'>({pct(c6)}%)</span>
        </div>
        <div className='mt-2 text-xs text-zinc-400'>
          Base: {total} apostas conferidas
        </div>
      </div>
    </div>
  );
}
