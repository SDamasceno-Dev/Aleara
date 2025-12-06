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
    c2: number;
    c3: number;
    c4: number;
    c5: number;
    hitRate: number;
  };
  items: ReportItem[];
};

type AggregateRow = {
  contestNo: number;
  checkedAt: string;
  total: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
  hitRate: number;
};
type AggregateData = {
  kpis: {
    totalConferences: number;
    totalBets: number;
    avgPerCheck: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
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
      const res = await fetch('/api/loterias/quina/reports/latest', {
        cache: 'no-store',
      });
      const data = await fetchToJson(res);
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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/loterias/quina/reports/by-contest?${new URLSearchParams({ contestNo: String(n) })}`,
        {
          cache: 'no-store',
        },
      );
      const data = await fetchToJson(res);
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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/loterias/quina/reports/aggregate', {
        cache: 'no-store',
      });
      const data = await fetchToJson(res);
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
            c2: 0,
            c3: 0,
            c4: 0,
            c5: 0,
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
            placeholder='Ex.: 6789'
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
            Última conferência
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
            Nenhuma conferência encontrada.
          </div>
        ) : (
          <>
            <div className='mb-3 grid grid-cols-2 gap-2 md:grid-cols-6'>
              <KpiCard
                label='Conferências'
                value={aggregate.kpis.totalConferences}
              />
              <KpiCard label='Apostas' value={aggregate.kpis.totalBets} />
              <KpiCard
                label='Média/conferência'
                value={aggregate.kpis.avgPerCheck.toFixed(1)}
              />
              <KpiCard label='Acertos 2' value={aggregate.kpis.c2} />
              <KpiCard label='Acertos 3' value={aggregate.kpis.c3} />
              <KpiCard
                label='Acertos 4+'
                value={aggregate.kpis.c4 + aggregate.kpis.c5}
              />
            </div>
            <PieSummary
              c2={aggregate.kpis.c2}
              c3={aggregate.kpis.c3}
              c4={aggregate.kpis.c4}
              c5={aggregate.kpis.c5}
              total={aggregate.kpis.totalBets}
            />
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
                      <th className='py-2 pr-3 font-medium w-20'>2</th>
                      <th className='py-2 pr-3 font-medium w-20'>3</th>
                      <th className='py-2 pr-3 font-medium w-20'>4</th>
                      <th className='py-2 pr-3 font-medium w-20'>5</th>
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
                        <td className='py-02 pr-3'>{r.c2}</td>
                        <td className='py-02 pr-3'>{r.c3}</td>
                        <td className='py-02 pr-3'>{r.c4}</td>
                        <td className='py-02 pr-3 text-green-300'>{r.c5}</td>
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
          <div className='mb-3 grid grid-cols-2 gap-2 md:grid-cols-6'>
            <KpiCard label='Concurso' value={report.contestNo} />
            <KpiCard label='Apostas' value={report.kpis.total} />
            <KpiCard label='Acertos 2' value={report.kpis.c2} />
            <KpiCard label='Acertos 3' value={report.kpis.c3} />
            <KpiCard label='Acertos 4' value={report.kpis.c4} />
            <KpiCard label='Acertos 5' value={report.kpis.c5} highlight />
          </div>
          <div className='mb-2 text-xs text-zinc-400'>
            Sorteio: <span className='text-zinc-200'>{drawStr || '—'}</span> •{' '}
            <span>
              Conferido em {new Date(report.checkedAt).toLocaleString()}
            </span>
          </div>
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

function PieSummary({
  c2,
  c3,
  c4,
  c5,
  total,
}: {
  c2: number;
  c3: number;
  c4: number;
  c5: number;
  total: number;
}) {
  const sum = c2 + c3 + c4 + c5;
  if (sum === 0 || total === 0) {
    return (
      <div className='mb-3 pot-12 text-sm text-zinc-400'>
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
  const s2 = (c2 / sum) * circumference;
  const s3 = (c3 / sum) * circumference;
  const s4 = (c4 / sum) * circumference;
  const s5 = (c5 / sum) * circumference;
  const off2 = 0;
  const off3 = -s2;
  const off4 = -(s2 + s3);
  const off5 = -(s2 + s3 + s4);
  const pct = (n: number) => ((n / total) * 100).toFixed(1);
  return (
    <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
      <div className='flex items-center justify-center'>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className='-o rotate-90'
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
            stroke='#a3e635'
            strokeWidth={stroke}
            strokeDasharray={`${s2} ${circumference - s2}`}
            strokeDashoffset={off2}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill='none'
            stroke='#f59e0b'
            strokeWidth={stroke}
            strokeDasharray={`${s3} ${circumference - s3}`}
            strokeDashoffset={off3}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill='none'
            stroke='#f97316'
            strokeWidth={stroke}
            strokeDasharray={`${s4} ${circumference - s4}`}
            strokeDashoffset={off4}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill='none'
            stroke='#22c55e'
            strokeWidth={stroke}
            strokeDasharray={`${s5} ${circumference - s5}`}
            strokeDashoffset={off5}
          />
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
        <Legend color='#a3e635' label='Acertos 2' value={c2} pct={pct(c2)} />
        <Legend color='#f59e0b' label='Acertos 3' value={c3} pct={pct(c3)} />
        <Legend color='#f59e0b' label='' value='' />
        <Legend color='#f97316' label='Acertos 4' value={c4} pct={pct(c4)} />
        <Legend color='#22c55e' label='Acertos 5' value={c5} pct={pct(c5)} />
        <div className='mt-2 text-xs text-zinc-400'>
          Base: {total} apostas conferidas
        </div>
      </div>
    </div>
  );
}

function Legend({
  color,
  label,
  value,
  pct,
}: {
  color: string;
  label: string;
  value: any;
  pct?: any;
}) {
  if (label === '' && value === '') return <div style={{ height: 0 }} />;
  return (
    <div className='inline-flex items-center gap-2'>
      <span
        className='inline-block h-3 w-3 rounded-sm'
        style={{ backgroundColor: color }}
      />
      <span className='text-zinc-300'>{label}</span>
      <span className='ml-auto font-semibold text-zinc-100'>{value}</span>
      <span className='text-zinc-400'>({pct}%)</span>
    </div>
  );
}
