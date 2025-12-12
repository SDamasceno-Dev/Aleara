'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Select } from '@/components/select/Select';

type GeneratedItem = {
  position: number;
  numbers: number[];
  matches?: number | null;
};

export function GamesPanel() {
  // Registrar apostas (manual)
  const [regCountInput, setRegCountInput] = useState('5');
  const [regOtp, setRegOtp] = useState<string[]>(
    Array.from({ length: 5 }, () => ''),
  );
  const [regInvalid, setRegInvalid] = useState<boolean[]>(
    Array.from({ length: 5 }, () => false),
  );
  const regRefs = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => {
    const n = Math.max(5, Math.min(15, Number(regCountInput || '5') || 5));
    setRegOtp((prev) =>
      prev.length === n
        ? prev
        : prev.length < n
          ? [...prev, ...Array.from({ length: n - prev.length }, () => '')]
          : prev.slice(0, n),
    );
    setRegInvalid((prev) =>
      prev.length === n
        ? prev
        : prev.length < n
          ? [...prev, ...Array.from({ length: n - prev.length }, () => false)]
          : prev.slice(0, n).map(() => false),
    );
  }, [regCountInput]);
  const regParsed = useMemo(() => {
    const nums = regOtp
      .map((v) => v.trim())
      .filter((v) => v.length === 2)
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 80);
    const desired = Math.max(
      5,
      Math.min(15, Number(regCountInput || '5') || 5),
    );
    if (nums.length !== desired) return [];
    const unique = Array.from(new Set(nums)).sort((a, b) => a - b);
    return unique.length === desired ? unique : [];
  }, [regOtp, regCountInput]);

  // Gerar
  const [countInput, setCountInput] = useState('5');
  const [otpValues, setOtpValues] = useState<string[]>(
    Array.from({ length: 5 }, () => ''),
  );
  const [otpInvalid, setOtpInvalid] = useState<boolean[]>(
    Array.from({ length: 5 }, () => false),
  );
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [kInput, setKInput] = useState('05');
  const [seedInput, setSeedInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setBusy] = useState(false);
  const [, setBusyMsg] = useState('');
  const [setId, setSetId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [markedIdx, setMarkedIdx] = useState<number | null>(null);
  const [currentSource, setCurrentSource] = useState<number[] | null>(null);
  const [savedSets, setSavedSets] = useState<
    Array<{
      id: string;
      title: string;
      source_numbers: number[];
      sample_size: number;
      marked_idx: number | null;
    }>
  >([]);
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [appendOnGenerate, setAppendOnGenerate] = useState(false);
  useEffect(() => {
    const n = Math.max(5, Math.min(15, Number(countInput || '0') || 5));
    setOtpValues((prev) =>
      prev.length === n
        ? prev
        : prev.length < n
          ? [...prev, ...Array.from({ length: n - prev.length }, () => '')]
          : prev.slice(0, n),
    );
    setOtpInvalid((prev) =>
      prev.length === n
        ? prev
        : prev.length < n
          ? [...prev, ...Array.from({ length: n - prev.length }, () => false)]
          : prev.slice(0, n).map(() => false),
    );
  }, [countInput]);
  const parsedNumbers = useMemo(() => {
    const nums = Array.from(
      new Set(
        otpValues
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
          .map((v) => Number(v))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= 80),
      ),
    );
    return nums;
  }, [otpValues]);

  // Conferir
  const [drawOtp, setDrawOtp] = useState<string[]>(
    Array.from({ length: 5 }, () => ''),
  );
  const [drawInvalid, setDrawInvalid] = useState<boolean[]>(
    Array.from({ length: 5 }, () => false),
  );
  const drawRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkedDraw, setCheckedDraw] = useState<number[]>([]);
  const checkedDrawSet = useMemo(() => new Set(checkedDraw), [checkedDraw]);
  const liveRef = useRef<HTMLDivElement | null>(null);

  // Actions
  async function handleGenerate() {
    if (items.length > 0 && !appendOnGenerate) {
      const proceed = window.confirm(
        'Gerar combinações irá sobrescrever os jogos exibidos. Deseja continuar? Para apenas adicionar, cancele e marque "Adicionar aos jogos existentes".',
      );
      if (!proceed) return;
    }
    setLoading(true);
    try {
      const k = Number(kInput || '0');
      let endpoint = '/api/loterias/quina/games/generate';
      if (appendOnGenerate && setId) {
        endpoint = '/api/loterias/quina/games/generate/append';
      } else if (setId) {
        const changed =
          !!currentSource &&
          (currentSource.length !== parsedNumbers.length ||
            currentSource.some((v, i) => v !== parsedNumbers[i]));
        if (changed) endpoint = '/api/loterias/quina/games/generate/replace';
      }
      const payload:
        | { setId: string; numbers: number[]; k: number; seed?: number }
        | { numbers: number[]; k: number; seed?: number } =
        endpoint.endsWith('/append') && setId
          ? { setId, numbers: parsedNumbers, k }
          : endpoint.endsWith('/replace') && setId
            ? { setId, numbers: parsedNumbers, k }
            : { numbers: parsedNumbers, k };
      if (seedInput) payload.seed = Number(seedInput);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || 'Falha ao gerar combinações.');
        return;
      }
      if (endpoint.endsWith('/append') && setId) {
        setItems((prev) => [...prev, ...(data.items ?? [])]);
      } else {
        setSetId(data.setId);
        setItems(data.items ?? []);
      }
      setCurrentSource(parsedNumbers);
      requestAnimationFrame(() => liveRef.current?.focus());
    } finally {
      setLoading(false);
    }
  }
  async function handleCheck(draw: number[]) {
    if (!setId) return;
    setCheckLoading(true);
    try {
      const res = await fetch('/api/loterias/quina/games/check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ setId, draw }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || 'Falha ao conferir.');
        return;
      }
      const map = new Map<number, number>();
      for (const it of data.items ?? [])
        map.set(it.position as number, it.matches as number);
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          matches: map.get(it.position) ?? it.matches ?? null,
        })),
      );
      requestAnimationFrame(() => liveRef.current?.focus());
    } finally {
      setCheckLoading(false);
    }
  }

  // Summary
  const matchesSummary = useMemo(() => {
    if (checkedDraw.length !== 5) return null;
    let c2 = 0,
      c3 = 0,
      c4 = 0,
      c5 = 0;
    for (const it of items) {
      const m = it.matches ?? null;
      if (m === 2) c2 += 1;
      else if (m === 3) c3 += 1;
      else if (m === 4) c4 += 1;
      else if (m === 5) c5 += 1;
    }
    return { c2, c3, c4, c5, total: items.length };
  }, [items, checkedDraw]);

  return (
    <section className='rounded-lg border border-border/60 bg-card/90 p-4'>
      <div className='mb-3 text-sm text-zinc-200'>Jogos — Quina</div>
      {/* Ações de listas */}
      <div className='mb-3 flex items-center gap-2'>
        <button
          type='button'
          className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
          disabled={!setId || items.length === 0}
          onClick={async () => {
            const contest = window.prompt(
              'Número do concurso para salvar as apostas:',
            );
            if (!contest) return;
            const n = Number(contest);
            if (!Number.isInteger(n) || n <= 0) {
              alert('Número de concurso inválido.');
              return;
            }
            const title = window.prompt('Título (opcional):') || undefined;
            const res = await fetch(
              '/api/loterias/quina/games/bets/save-by-contest',
              {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ setId, contestNo: n, title }),
              },
            );
            const data = await res.json();
            if (!res.ok) alert(data?.error || 'Falha ao salvar apostas.');
            else
              alert(
                `Apostas salvas para o concurso ${n}. Total: ${data.total}.`,
              );
          }}
        >
          Salvar apostas (por concurso)
        </button>
        <button
          type='button'
          className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
          onClick={async () => {
            const contest = window.prompt(
              'Número do concurso para carregar as apostas:',
            );
            if (!contest) return;
            const n = Number(contest);
            if (!Number.isInteger(n) || n <= 0) {
              alert('Número de concurso inválido.');
              return;
            }
            const mode = window.confirm(
              'Clique OK para substituir os jogos atuais. Cancelar para adicionar (append).',
            )
              ? 'replace'
              : 'append';
            const res = await fetch(
              '/api/loterias/quina/games/bets/load-by-contest',
              {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ contestNo: n, mode, setId }),
              },
            );
            const data = await res.json();
            if (!res.ok) {
              alert(data?.error || 'Falha ao carregar apostas.');
              return;
            }
            if (!setId && data.setId) setSetId(data.setId);
            const fetched = (
              (data.items ?? []) as Array<{
                position: number;
                numbers: number[];
              }>
            ).map((it) => ({
              position: it.position,
              numbers: it.numbers ?? [],
              matches: null as number | null,
            }));
            if (fetched.length > 0) setItems(fetched);
          }}
        >
          Carregar apostas (por concurso)
        </button>
        <ManageLists
          setId={setId}
          setItems={setItems}
          setCheckedDraw={setCheckedDraw}
        />
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='space-y-3'>
          {/* Registrar apostas */}
          <div className='rounded-md border border-white/10 p-3 mb-3'>
            <div className='text-sm text-zinc-300 mb-2'>Registrar apostas</div>
            <div className='flex items-center gap-2'>
              <label className='text-xs text-zinc-400'>
                Qtd. dezenas (5 a 15)
                <input
                  type='number'
                  min={5}
                  max={15}
                  value={regCountInput}
                  onChange={(e) =>
                    setRegCountInput(e.target.value.replace(/\D+/g, ''))
                  }
                  className='ml-2 w-16 rounded-md border border-black-30 bg-white-10 px-2 py-1 text-sm'
                  placeholder='05'
                />
              </label>
            </div>
            <div className='mt-2 flex flex-wrap gap-2'>
              {regOtp.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    regRefs.current[idx] = el;
                  }}
                  value={val}
                  inputMode='numeric'
                  maxLength={2}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D+/g, '').slice(0, 2);
                    setRegOtp((prev) => {
                      const next = [...prev];
                      next[idx] = raw;
                      return next;
                    });
                    if (raw.length === 2) {
                      const num = Number(raw);
                      const isValid =
                        Number.isInteger(num) && num >= 1 && num <= 80;
                      setRegInvalid((prev) => {
                        const next = [...prev];
                        next[idx] = !isValid;
                        return next;
                      });
                      if (isValid && idx + 1 < regOtp.length)
                        regRefs.current[idx + 1]?.focus();
                    } else {
                      setRegInvalid((prev) => {
                        const next = [...prev];
                        next[idx] = false;
                        return next;
                      });
                    }
                  }}
                  className={`h-9 w-9 rounded-md border text-center text-sm font-medium ${
                    regInvalid[idx]
                      ? 'bg-white border-(--alertError) text-(--alertError) font-bold'
                      : 'bg-white border-black-30 text-zinc-900'
                  }`}
                  placeholder='00'
                />
              ))}
              <button
                type='button'
                className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                disabled={regParsed.length === 0 || regInvalid.some(Boolean)}
                onClick={async () => {
                  const res = await fetch(
                    '/api/loterias/quina/games/add-items',
                    {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify(
                        setId
                          ? { setId, items: [regParsed] }
                          : { items: [regParsed] },
                      ),
                    },
                  );
                  const data = await res.json();
                  if (!res.ok) {
                    alert(data?.error || 'Falha ao registrar aposta.');
                    return;
                  }
                  if (!setId && data.setId) setSetId(data.setId);
                  setItems((prev) => [...prev, ...(data.items ?? [])]);
                }}
              >
                Registrar
              </button>
            </div>
          </div>

          {/* Gerar combinações */}
          <div className='rounded-md border border-white/10 p-3 mb-3'>
            <div className='text-sm text-zinc-300 mb-2'>Gerar combinações</div>
            {/* Seed e modo de adição */}
            <div className='flex items-center gap-2'>
              <label className='text-xs text-zinc-400'>
                Seed (opcional)
                <input
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  className='ml-2 w-28 rounded-md border border-black-30 bg-white-10 px-2 py-1 text-sm'
                />
              </label>
              <label className='text-xs text-zinc-400 inline-flex items-center gap-2 ml-auto'>
                <input
                  type='checkbox'
                  checked={appendOnGenerate}
                  onChange={(e) => setAppendOnGenerate(e.target.checked)}
                />
                Adicionar aos jogos existentes
              </label>
            </div>

            {/* Seleção e nome da combinação */}
            <div className='grid grid-cols-1 gap-2 mt-2'>
              <div>
                <label className='text-xs text-zinc-400'>
                  Combinações salvas
                </label>
                <Select
                  theme='light'
                  items={savedSets.map((s) => ({
                    value: s.id,
                    label: s.title,
                  }))}
                  value={''}
                  placeholder='Selecione…'
                  onOpen={async () => {
                    try {
                      const res = await fetch(
                        '/api/loterias/quina/games/sets/list',
                        {
                          cache: 'no-store',
                        },
                      );
                      const data = await res.json();
                      if (res.ok) {
                        const rows = (data.items ?? []) as Array<{
                          id: string;
                          title: string | null;
                          source_numbers: number[];
                          sample_size: number;
                          marked_idx: number | null;
                        }>;
                        setSavedSets(
                          rows.map((it) => ({
                            id: it.id,
                            title: String(it.title ?? ''),
                            source_numbers: it.source_numbers ?? [],
                            sample_size: Number(it.sample_size ?? 0),
                            marked_idx: it.marked_idx ?? null,
                          })),
                        );
                      }
                    } catch {}
                  }}
                  onChange={async (id) => {
                    if (!id) return;
                    try {
                      const res = await fetch(
                        `/api/loterias/quina/games/${id}?size=1000`,
                        {
                          cache: 'no-store',
                        },
                      );
                      const data = await res.json();
                      if (!res.ok) {
                        alert(data?.error || 'Falha ao carregar set.');
                        return;
                      }
                      const set = data.set as {
                        id: string;
                        source_numbers: number[];
                        sample_size: number;
                        title?: string | null;
                        marked_idx?: number | null;
                      };
                      const src = (set.source_numbers ?? []).map((n) =>
                        String(n).padStart(2, '0'),
                      );
                      setCountInput(
                        String(Math.max(5, Math.min(15, src.length))),
                      );
                      setOtpValues(
                        src.slice(0, Math.max(5, Math.min(15, src.length))),
                      );
                      setOtpInvalid(
                        Array.from({ length: src.length }, () => false),
                      );
                      setKInput(String(set.sample_size).padStart(2, '0'));
                      setSetId(set.id);
                      setCurrentSource(set.source_numbers ?? []);
                      setTitleInput(set.title ?? '');
                      setMarkedIdx(set.marked_idx ?? null);
                      const fetchedItems = (
                        (data.items ?? []) as Array<{
                          position: number;
                          numbers: number[];
                          matches?: number | null;
                        }>
                      ).map((it) => ({
                        position: it.position,
                        numbers: it.numbers ?? [],
                        matches: it.matches ?? null,
                      }));
                      setItems(fetchedItems);
                    } catch {}
                  }}
                />
              </div>
              <div>
                <label className='text-xs text-zinc-400'>
                  Nome da combinação
                  <input
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className='w-full rounded-md border border-black-30 bg-white-10 px-2 py-1 text-sm'
                    placeholder='Ex.: Universo 01'
                  />
                </label>
              </div>
              {setId ? (
                <div className='flex justify-between gap-2'>
                  <button
                    type='button'
                    className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                    disabled={!setId || !titleInput.trim()}
                    onClick={async () => {
                      if (!setId || !titleInput.trim()) return;
                      try {
                        const res = await fetch(
                          '/api/loterias/quina/games/sets/save-meta',
                          {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({
                              setId,
                              title: titleInput.trim(),
                              markedIdx,
                            }),
                          },
                        );
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok)
                          alert(data?.error || 'Falha ao salvar meta.');
                        else alert('Salvo com sucesso.');
                      } catch {}
                    }}
                  >
                    {setId ? 'Salvar/Update' : 'Salvar'}
                  </button>
                  <button
                    type='button'
                    className='rounded-md border border-red-20 px-3 py-1 text-sm hover:bg-white-10 text-red-300'
                    onClick={async () => {
                      if (!setId) return;
                      if (
                        !window.confirm(
                          'Excluir permanentemente esta combinação salva?',
                        )
                      )
                        return;
                      if (
                        !window.confirm(
                          'Confirma a exclusão? Esta ação não pode ser desfeita.',
                        )
                      )
                        return;
                      setBusy(true);
                      setBusyMsg('Excluindo combinação…');
                      try {
                        const res = await fetch(
                          '/api/loterias/quina/games/sets/delete',
                          {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ setId }),
                          },
                        );
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          alert(data?.error || 'Falha ao excluir combinação.');
                          return;
                        }
                        setItems([]);
                        setSetId(null);
                        setCheckedDraw([]);
                        setTitleInput('');
                        setMarkedIdx(null);
                        setCurrentSource(null);
                        setCountInput('5');
                        setOtpValues(Array.from({ length: 5 }, () => ''));
                        setOtpInvalid(Array.from({ length: 5 }, () => false));
                        alert('Combinação excluída.');
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Excluir combinação (BD)
                  </button>
                </div>
              ) : null}
              <div className='flex justify-between'>
                <label className='block text-xs text-zinc-400'>
                  Quantidade de dezenas (5 a 15)
                  <input
                    value={countInput}
                    onChange={(e) => setCountInput(e.target.value)}
                    className='mt-1 w-12 rounded-md border border-black-30 bg-white-10 px-2 py-1 text-sm'
                    placeholder='05'
                  />
                </label>
                <label className='text-xs text-zinc-400'>
                  Quantidade de combinações (k)
                  <input
                    value={kInput}
                    onChange={(e) => setKInput(e.target.value)}
                    className='mt-1 w-12 rounded-md border border-black-30 bg-white-10 px-2 py-1 text-sm'
                    placeholder='05'
                  />
                </label>
              </div>
              <div className='text-xs text-zinc-500'>
                Informe {countInput || '5'} dezenas abaixo. Cada “caixinha”
                aceita 2 algarismos e avança automaticamente.
              </div>
            </div>

            {/* Universo de dezenas (ordem preservada) + rádio */}
            <div className='mt-2 flex flex-wrap gap-2'>
              {otpValues.map((val, idx) => (
                <div key={idx} className='flex flex-col items-center'>
                  <input
                    ref={(el) => {
                      otpRefs.current[idx] = el;
                    }}
                    value={val}
                    inputMode='numeric'
                    maxLength={2}
                    onChange={(e) => {
                      const raw = e.target.value
                        .replace(/\D+/g, '')
                        .slice(0, 2);
                      setOtpValues((prev) => {
                        const next = [...prev];
                        next[idx] = raw;
                        return next;
                      });
                      if (raw.length === 2) {
                        const num = Number(raw);
                        const isValid =
                          Number.isInteger(num) && num >= 1 && num <= 80;
                        setOtpInvalid((prev) => {
                          const next = [...prev];
                          next[idx] = !isValid;
                          return next;
                        });
                        if (isValid && idx + 1 < otpValues.length)
                          otpRefs.current[idx + 1]?.focus();
                      } else {
                        setOtpInvalid((prev) => {
                          const next = [...prev];
                          next[idx] = false;
                          return next;
                        });
                      }
                    }}
                    className={`h-9 w-9 rounded-md border text-center text-sm font-medium ${
                      otpInvalid[idx]
                        ? 'bg-white border-(--alertError) text-(--alertError) font-bold'
                        : 'bg-white border-black-30 text-zinc-900'
                    }`}
                    placeholder='00'
                  />
                  <input
                    type='radio'
                    name='markedIdx'
                    className='mt-1'
                    checked={markedIdx === idx}
                    onChange={() => setMarkedIdx(idx)}
                    aria-label={`Marcar posição ${idx + 1}`}
                  />
                </div>
              ))}
            </div>

            {/* Feedback de universo atual */}
            <div className='text-xs text-zinc-500'>
              Dezenas válidas: {parsedNumbers.join(', ') || '—'}
              {setId &&
              currentSource &&
              (currentSource.length !== parsedNumbers.length ||
                currentSource.some((v, i) => v !== parsedNumbers[i])) ? (
                <span className='ml-2 text-(--alertWarning)'>
                  Você alterou as dezenas base; gere novamente para atualizar as
                  combinações.
                </span>
              ) : null}
            </div>

            {/* Geração e reamostragem */}
            <div className='mt-2 flex gap-2'>
              <button
                type='button'
                className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                disabled={
                  loading ||
                  parsedNumbers.length < otpValues.length ||
                  parsedNumbers.length !== otpValues.length ||
                  otpValues.some((v) => v.length !== 2) ||
                  otpInvalid.some((b) => b)
                }
                onClick={handleGenerate}
              >
                {loading ? 'Gerando…' : 'Gerar'}
              </button>
              <button
                type='button'
                className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                disabled={!setId}
                onClick={async () => {
                  if (!setId) return;
                  const res = await fetch(
                    '/api/loterias/quina/games/resample',
                    {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({
                        setId,
                        k: Number(kInput || '0') || undefined,
                        seed: seedInput ? Number(seedInput) : undefined,
                      }),
                    },
                  );
                  const data = await res.json();
                  if (!res.ok) {
                    alert(data?.error || 'Falha ao re-sortear.');
                    return;
                  }
                  setItems(
                    (
                      (data.items ?? []) as Array<{
                        position: number;
                        numbers: number[];
                      }>
                    ).map((it) => ({
                      position: it.position,
                      numbers: it.numbers ?? [],
                      matches: null,
                    })),
                  );
                  setCheckedDraw([]);
                }}
              >
                Re-sortear
              </button>
              <button
                type='button'
                className='ml-auto rounded-md border border-red-20 px-3 py-1 text-sm hover:bg-white-10 text-red-300'
                onClick={() => {
                  setItems([]);
                  setSetId(null);
                  setCheckedDraw([]);
                }}
                disabled={items.length === 0 && !setId}
              >
                Limpar jogos gerados
              </button>
            </div>
          </div>

          {/* Conferir */}
        </div>
        <div>
          <div className='rounded-md border border-white/10 p-3'>
            <div className='text-sm text-zinc-300 mb-2'>Conferir resultado</div>
            <div className='flex flex-wrap gap-2'>
              {drawOtp.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    drawRefs.current[idx] = el;
                  }}
                  value={val}
                  inputMode='numeric'
                  maxLength={2}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D+/g, '').slice(0, 2);
                    setDrawOtp((prev) => {
                      const next = [...prev];
                      next[idx] = raw;
                      return next;
                    });
                    if (raw.length === 2) {
                      setCheckedDraw([]);
                      const num = Number(raw);
                      const isValid =
                        Number.isInteger(num) && num >= 1 && num <= 80;
                      setDrawInvalid((prev) => {
                        const next = [...prev];
                        next[idx] = !isValid;
                        return next;
                      });
                      if (isValid && idx + 1 < drawOtp.length)
                        drawRefs.current[idx + 1]?.focus();
                    } else {
                      setDrawInvalid((prev) => {
                        const next = [...prev];
                        next[idx] = false;
                        return next;
                      });
                    }
                  }}
                  className={`h-9 w-9 rounded-md border text-center text-sm font-medium ${
                    drawInvalid[idx]
                      ? 'bg-white border-(--alertError) text-(--alertError) font-bold'
                      : 'bg-white border-black-30 text-zinc-900'
                  }`}
                  placeholder='00'
                />
              ))}
            </div>
            <div className='mt-2 flex gap-2'>
              <button
                type='button'
                className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                disabled={
                  checkLoading ||
                  !setId ||
                  drawOtp.some((v) => v.length !== 2) ||
                  drawInvalid.some((b) => b)
                }
                onClick={async () => {
                  const draw = drawOtp.map((v) => Number(v));
                  setCheckedDraw(draw);
                  await handleCheck(draw);
                }}
              >
                {checkLoading ? 'Conferindo…' : 'Conferir'}
              </button>
              <button
                type='button'
                className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                disabled={!setId || checkedDraw.length !== 5}
                onClick={async () => {
                  const contest = window.prompt('Número do concurso:');
                  if (!contest) return;
                  const n = Number(contest);
                  if (!Number.isInteger(n) || n <= 0) {
                    alert('Concurso inválido.');
                    return;
                  }
                  const res = await fetch(
                    '/api/loterias/quina/games/save-check',
                    {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({
                        setId,
                        draw: checkedDraw,
                        contest: n,
                      }),
                    },
                  );
                  const data = await res.json();
                  if (!res.ok) {
                    alert(data?.error || 'Falha ao salvar conferência.');
                    return;
                  }
                  alert(
                    `Conferência salva! Concurso ${n}, ${data.total} jogos registrados.`,
                  );
                }}
              >
                Salvar
              </button>
              <button
                type='button'
                className='rounded-md border border-red-20 px-3 py-1 text-sm hover:bg-white-10 text-red-300 ml-auto'
                onClick={async () => {
                  if (
                    !window.confirm(
                      'Excluir TODAS as suas conferências da Quina?',
                    )
                  )
                    return;
                  if (!window.confirm('Confirma novamente?')) return;
                  const res = await fetch(
                    '/api/loterias/quina/games/delete-checks',
                    { method: 'POST' },
                  );
                  const data = await res.json();
                  if (!res.ok)
                    alert(data?.error || 'Falha ao remover conferências.');
                  else alert('Conferências removidas.');
                }}
              >
                Limpar conferências
              </button>
              <div
                ref={liveRef}
                tabIndex={-1}
                aria-live='polite'
                className='sr-only'
              />
            </div>
            {matchesSummary ? (
              <div className='mt-2 text-sm text-zinc-300 flex items-center gap-3'>
                <span className='text-zinc-400'>Sumário:</span>
                <span>2: {matchesSummary.c2}</span>
                <span>3: {matchesSummary.c3}</span>
                <span>4: {matchesSummary.c4}</span>
                <span>5: {matchesSummary.c5}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className='mt-3 rounded-md border border-white/10'>
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
              {items.map((it, idx) => (
                <tr
                  key={`${it.position}-${idx}`}
                  className='border-t border-white/10'
                >
                  <td className='py-2 pl-3 pr-3'>{idx + 1}</td>
                  <td className='py-2 pr-3'>( {it.position} )</td>
                  <td className='py-2 pr-3 font-medium text-zinc-100'>
                    {it.numbers.map((n, i) => {
                      const s = String(n).padStart(2, '0');
                      const hit = checkedDrawSet.has(n);
                      return (
                        <span
                          key={`${it.position}-${n}-${i}`}
                          className='inline-flex items-center'
                        >
                          <span
                            className={
                              hit
                                ? 'inline-block px-2 py-1 bg-green-40 rounded-sm'
                                : ''
                            }
                          >
                            {s}
                          </span>
                          {i < it.numbers.length - 1 ? (
                            <span className='px-1 text-zinc-500'>•</span>
                          ) : null}
                        </span>
                      );
                    })}
                  </td>
                  <td className='py-2 pr-3'>{it.matches ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ManageLists({
  setId,
  setItems,
  setCheckedDraw,
}: {
  setId: string | null;
  setItems: React.Dispatch<React.SetStateAction<GeneratedItem[]>>;
  setCheckedDraw: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [betLists, setBetLists] = useState<
    Array<{
      id: string;
      contestNo: number | null;
      title: string | null;
      count: number;
      createdAt: string;
    }>
  >([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  return (
    <>
      <button
        type='button'
        className='ml-auto rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
        onClick={async () => {
          setOpen(true);
          setLoading(true);
          try {
            const res = await fetch('/api/loterias/quina/games/bets/lists');
            const data = await res.json();
            if (!res.ok) alert(data?.error || 'Falha ao listar.');
            else setBetLists(data.items ?? []);
          } finally {
            setLoading(false);
            setSelected(new Set());
          }
        }}
      >
        Gerenciar listas
      </button>
      {open ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <button
            aria-label='Fechar'
            onClick={() => setOpen(false)}
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
          />
          <div className='relative z-10 max-w-[80vw] w-[82vw] max-h-[82vh] bg-white text-zinc-900 rounded-md shadow-xl overflow-hidden flex flex-col border border-black/10'>
            <div className='px-5 py-3 border-b border-black/10 bg-white'>
              <h2 className='text-sm font-semibold tracking-wider'>
                Listas salvas — Quina
              </h2>
            </div>
            <div className='px-5 py-4 flex-1 min-h-0 overflow-hidden'>
              {loading ? (
                <div className='text-sm text-zinc-500'>Carregando…</div>
              ) : betLists.length === 0 ? (
                <div className='text-sm text-zinc-500'>
                  Nenhuma lista encontrada.
                </div>
              ) : (
                <div className='max-h-[60vh] overflow-y-auto scroll-y rounded-md border border-black/10'>
                  <table className='w-full text-sm'>
                    <thead className='sticky top-0 bg-black-10'>
                      <tr className='text-left text-zinc-500'>
                        <th className='w-10 py-2 pl-2'>
                          <input
                            type='checkbox'
                            checked={
                              selected.size > 0 &&
                              selected.size === betLists.length
                            }
                            onChange={(e) =>
                              setSelected(
                                e.target.checked
                                  ? new Set(betLists.map((b) => b.id))
                                  : new Set(),
                              )
                            }
                          />
                        </th>
                        <th className='py-2'>Concurso</th>
                        <th className='py-2'>Apostas</th>
                        <th className='py-2'>Título</th>
                        <th className='py-2'>Criado</th>
                      </tr>
                    </thead>
                    <tbody className='text-zinc-900'>
                      {betLists.map((b) => (
                        <tr
                          key={b.id}
                          className='border-t border-black/10 hover:bg-black/5 cursor-pointer'
                          onClick={async () => {
                            const proceed = window.confirm(
                              'Carregar as apostas deste item?',
                            );
                            if (!proceed) return;
                            const mode = window.confirm(
                              'Clique OK para substituir os jogos atuais. Cancelar para adicionar (append).',
                            )
                              ? 'replace'
                              : 'append';
                            const res = await fetch(
                              '/api/loterias/quina/games/bets/load-by-contest',
                              {
                                method: 'POST',
                                headers: { 'content-type': 'application/json' },
                                body: JSON.stringify({
                                  contestNo: b.contestNo,
                                  mode,
                                  setId,
                                }),
                              },
                            );
                            const data = await res.json();
                            if (!res.ok) {
                              alert(
                                data?.error || 'Falha ao carregar apostas.',
                              );
                              return;
                            }
                            const fetched = (
                              (data.items ?? []) as Array<{
                                position: number;
                                numbers: number[];
                              }>
                            ).map((it) => ({
                              position: it.position,
                              numbers: it.numbers ?? [],
                              matches: null as number | null,
                            }));
                            setItems(fetched);
                            setCheckedDraw([]);
                            setOpen(false);
                          }}
                        >
                          <td className='py-2 pl-2'>
                            <input
                              type='checkbox'
                              checked={selected.has(b.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelected((prev) => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(b.id);
                                  else next.delete(b.id);
                                  return next;
                                });
                              }}
                            />
                          </td>
                          <td className='py-2'>{b.contestNo ?? '—'}</td>
                          <td className='py-2'>{b.count}</td>
                          <td className='py-2'>{b.title ?? '—'}</td>
                          <td className='py-2'>
                            {new Date(b.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className='px-5 py-3 border-t border-black/10 bg-white flex items-center justify-between'>
              <div className='text-xs text-zinc-600'>
                Selecionados: {selected.size}
              </div>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  className='rounded-md border border-red-20 px-3 py-1 text-sm hover:bg-black/5 text-red-600'
                  disabled={selected.size === 0}
                  onClick={async () => {
                    if (selected.size === 0) return;
                    if (!window.confirm('Excluir listas selecionadas?')) return;
                    const res = await fetch(
                      '/api/loterias/quina/games/bets/lists/delete',
                      {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ listIds: Array.from(selected) }),
                      },
                    );
                    const data = await res.json();
                    if (!res.ok) {
                      alert(data?.error || 'Falha ao excluir.');
                      return;
                    }
                    setBetLists((prev) =>
                      prev.filter((b) => !selected.has(b.id)),
                    );
                    setSelected(new Set());
                  }}
                >
                  Excluir selecionados
                </button>
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
        </div>
      ) : null}
    </>
  );
}
