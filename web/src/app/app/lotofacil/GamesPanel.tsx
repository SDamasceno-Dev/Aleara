'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Select } from '@/components/select/Select';
import { useDialog } from '@/components/dialog';
import { Button } from '@/components/button';
import { LoadingOverlay } from '@/components/overlay/LoadingOverlay';

type GeneratedItem = {
  position: number;
  numbers: number[];
  matches?: number | null;
};

// Calculate binomial coefficient C(n, k)
function binom(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  const nn = BigInt(n);
  let kk = BigInt(k);
  if (kk > nn - kk) kk = nn - kk;
  let result = BigInt(1);
  for (let i = BigInt(1); i <= kk; i = i + BigInt(1)) {
    result = (result * (nn - kk + i)) / i;
  }
  return Number(result);
}

export function GamesPanel() {
  const dialog = useDialog();
  // Registrar apostas (manual) — Lotofácil: 15 a 20 números
  const [regCountInput, setRegCountInput] = useState('15');
  const [regOtp, setRegOtp] = useState<string[]>(
    Array.from({ length: 15 }, () => ''),
  );
  const [regInvalid, setRegInvalid] = useState<boolean[]>(
    Array.from({ length: 15 }, () => false),
  );
  const regRefs = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => {
    const n = Math.max(15, Math.min(20, Number(regCountInput || '15') || 15));
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
  // Detectar dezenas repetidas para destacar visualmente
  const regDuplicateFlags = useMemo(() => {
    const norm = regOtp.map((v) =>
      v && v.length === 2 ? String(Number(v)).padStart(2, '0') : '',
    );
    const counts = new Map<string, number>();
    for (const s of norm) {
      if (s) counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return norm.map((s) => s !== '' && (counts.get(s) ?? 0) > 1);
  }, [regOtp]);
  const regParsed = useMemo(() => {
    const nums = regOtp
      .map((v) => v.trim())
      .filter((v) => v.length === 2)
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 25);
    const desired = Math.max(
      15,
      Math.min(20, Number(regCountInput || '15') || 15),
    );
    if (nums.length !== desired) return [];
    const unique = Array.from(new Set(nums)).sort((a, b) => a - b);
    return unique.length === desired ? unique : [];
  }, [regOtp, regCountInput]);

  // Gerar — Lotofácil: 15 a 20 dezenas base
  const [countInput, setCountInput] = useState('15');
  const [otpValues, setOtpValues] = useState<string[]>(
    Array.from({ length: 15 }, () => ''),
  );
  const [otpInvalid, setOtpInvalid] = useState<boolean[]>(
    Array.from({ length: 15 }, () => false),
  );
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [kInput, setKInput] = useState('05');
  const [seedInput, setSeedInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState('Processando…');
  const [manualPositions, setManualPositions] = useState<Set<number>>(
    new Set(),
  );
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
  // Loader: fetch saved combinations
  const loadSavedSets = useCallback(async () => {
    try {
      const res = await fetch('/api/loterias/lotofacil/games/sets/list', {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) return;
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
    } catch {
      // ignore
    }
  }, []);
  // Preload on mount
  useEffect(() => {
    loadSavedSets();
  }, [loadSavedSets]);
  // Refresh when tab regains focus or becomes visible
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') {
        void loadSavedSets();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [loadSavedSets]);
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [appendOnGenerate, setAppendOnGenerate] = useState(false);
  useEffect(() => {
    const n = Math.max(15, Math.min(20, Number(countInput || '0') || 15));
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
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= 25),
      ),
    );
    return nums;
  }, [otpValues]);

  // Conferir — Lotofácil: 15 números sorteados
  const [drawOtp, setDrawOtp] = useState<string[]>(
    Array.from({ length: 15 }, () => ''),
  );
  const [drawInvalid, setDrawInvalid] = useState<boolean[]>(
    Array.from({ length: 15 }, () => false),
  );
  const drawRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkedDraw, setCheckedDraw] = useState<number[]>([]);
  const checkedDrawSet = useMemo(() => new Set(checkedDraw), [checkedDraw]);
  // Modal de listas salvas
  const [listsOpen, setListsOpen] = useState(false);
  const [listsLoading, setListsLoading] = useState(false);
  const [betLists, setBetLists] = useState<
    Array<{
      id: string;
      contestNo: number | null;
      title: string | null;
      count: number;
      createdAt: string;
    }>
  >([]);
  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(
    new Set(),
  );
  const liveRef = useRef<HTMLDivElement | null>(null);

  // Actions
  async function handleGenerate() {
    if (items.length > 0 && !appendOnGenerate) {
      const proceed = window.confirm(
        'Gerar combinações irá sobrescrever os jogos exibidos. Deseja continuar? Para apenas adicionar, cancele e marque "Adicionar aos jogos existentes".',
      );
      if (!proceed) return;
    }

    // Calculate total combinations
    const n = parsedNumbers.length;
    const k = Number(kInput || '0');
    const totalCombinations = binom(n, 15); // Lotofácil: 15 numbers per game

    // Show confirmation modal
    return new Promise<void>((resolve) => {
      dialog.open({
        intent: 'message',
        title: 'Confirmar geração de combinações',
        description: (
          <div className='space-y-3'>
            <p className='text-sm text-zinc-700'>
              Você está prestes a gerar <strong>{k}</strong> combinações de{' '}
              <strong>15</strong> números a partir de <strong>{n}</strong>{' '}
              dezenas selecionadas.
            </p>
            <p className='text-sm font-semibold text-zinc-900'>
              Total de combinações possíveis:{' '}
              <strong>{totalCombinations.toLocaleString('pt-BR')}</strong>
            </p>
            <p className='text-xs text-zinc-600'>
              Deseja continuar com a geração?
            </p>
          </div>
        ),
        actions: (
          <div className='flex justify-end gap-2 pt-3 border-t border-black/10'>
            <Button
              intent='secondary'
              size='sm'
              onClick={() => {
                dialog.close();
                resolve();
              }}
            >
              Cancelar
            </Button>
            <Button
              intent='primary'
              size='sm'
              onClick={async () => {
                dialog.close();
                resolve();
                await doGenerate();
              }}
            >
              Continuar
            </Button>
          </div>
        ),
      });
    });
  }

  async function doGenerate() {
    setLoading(true);
    try {
      const k = Number(kInput || '0');
      let endpoint = '/api/loterias/lotofacil/games/generate';
      if (appendOnGenerate && setId) {
        endpoint = '/api/loterias/lotofacil/games/generate/append';
      } else if (setId) {
        const changed =
          !!currentSource &&
          (currentSource.length !== parsedNumbers.length ||
            currentSource.some((v, i) => v !== parsedNumbers[i]));
        if (changed)
          endpoint = '/api/loterias/lotofacil/games/generate/replace';
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
      const res = await fetch('/api/loterias/lotofacil/games/check', {
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

  // Summary — Lotofácil: acertos de 11 a 15
  const matchesSummary = useMemo(() => {
    if (checkedDraw.length !== 15) return null;
    let c11 = 0,
      c12 = 0,
      c13 = 0,
      c14 = 0,
      c15 = 0;
    for (const it of items) {
      const m = it.matches ?? null;
      if (m === 11) c11 += 1;
      else if (m === 12) c12 += 1;
      else if (m === 13) c13 += 1;
      else if (m === 14) c14 += 1;
      else if (m === 15) c15 += 1;
    }
    return { c11, c12, c13, c14, c15, total: items.length };
  }, [items, checkedDraw]);

  return (
    <section className='rounded-lg border border-border/60 bg-card/90 p-4'>
      <LoadingOverlay
        show={busy}
        message={busyMsg}
        subtitle='Isso pode levar alguns instantes.'
      />
      <div className='mb-3 text-sm text-zinc-200'>Jogos — Lotofácil</div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='space-y-3'>
          {/* Registrar apostas */}
          <div className='rounded-md border border-white/10 p-3 mb-3'>
            <div className='text-sm text-zinc-300 mb-2'>Registrar apostas</div>
            <div className='flex items-center gap-2'>
              <label className='text-xs text-zinc-400'>
                Qtd. dezenas (15 a 20)
                <input
                  type='number'
                  min={15}
                  max={20}
                  value={regCountInput}
                  onChange={(e) =>
                    setRegCountInput(e.target.value.replace(/\D+/g, ''))
                  }
                  className='ml-2 w-16 rounded-md border border-black-30 bg-white-10 px-2 py-1 text-sm'
                  placeholder='15'
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
                        Number.isInteger(num) && num >= 1 && num <= 25;
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
                      : regDuplicateFlags[idx]
                        ? 'bg-(--alertError) border-(--alertError) text-white font-semibold'
                        : 'bg-white border-black-30 text-zinc-900'
                  }`}
                  placeholder='00'
                />
              ))}
              <button
                type='button'
                className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                disabled={
                  regParsed.length === 0 ||
                  regInvalid.some(Boolean) ||
                  regDuplicateFlags.some(Boolean)
                }
                onClick={async () => {
                  const res = await fetch(
                    '/api/loterias/lotofacil/games/add-items',
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
                  // Limpar campos após registro bem-sucedido
                  setRegOtp((prev) => prev.map(() => ''));
                  setRegInvalid((prev) => prev.map(() => false));
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
                        '/api/loterias/lotofacil/games/sets/list',
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
                        `/api/loterias/lotofacil/games/${id}?size=1000`,
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
                        String(Math.max(15, Math.min(20, src.length))),
                      );
                      setOtpValues(
                        src.slice(0, Math.max(15, Math.min(20, src.length))),
                      );
                      setOtpInvalid(
                        Array.from({ length: src.length }, () => false),
                      );
                      setKInput(String(set.sample_size).padStart(2, '0'));
                      setSetId(set.id);
                      setCurrentSource(set.source_numbers ?? []);
                      setTitleInput(set.title ?? '');
                      setMarkedIdx(set.marked_idx ?? null);
                      // Forçar matches: null ao carregar (conferência é feita separadamente)
                      const fetchedItems = (
                        (data.items ?? []) as Array<{
                          position: number;
                          numbers: number[];
                        }>
                      ).map((it) => ({
                        position: it.position,
                        numbers: it.numbers ?? [],
                        matches: null as number | null,
                      }));
                      setItems(fetchedItems);
                      setCheckedDraw([]);
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
                          '/api/loterias/lotofacil/games/sets/save-meta',
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
                          '/api/loterias/lotofacil/games/sets/delete',
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
                        setCountInput('15');
                        setOtpValues(Array.from({ length: 15 }, () => ''));
                        setOtpInvalid(Array.from({ length: 15 }, () => false));
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
                  Quantidade de dezenas (15 a 20)
                  <input
                    value={countInput}
                    onChange={(e) => setCountInput(e.target.value)}
                    className='mt-1 w-12 rounded-md border border-black-30 bg-white-10 px-2 py-1 text-sm'
                    placeholder='15'
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
                Informe {countInput || '15'} dezenas abaixo (1 a 25). Cada
                caixinha aceita 2 algarismos e avança automaticamente.
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
                          Number.isInteger(num) && num >= 1 && num <= 25;
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
                    '/api/loterias/lotofacil/games/resample',
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
            <div className='text-xs text-zinc-500 mb-2'>
              Informe as 15 dezenas sorteadas (1 a 25):
            </div>
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
                        Number.isInteger(num) && num >= 1 && num <= 25;
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
                disabled={!setId || checkedDraw.length !== 15}
                onClick={async () => {
                  const contest = window.prompt('Número do concurso:');
                  if (!contest) return;
                  const n = Number(contest);
                  if (!Number.isInteger(n) || n <= 0) {
                    alert('Concurso inválido.');
                    return;
                  }
                  const res = await fetch(
                    '/api/loterias/lotofacil/games/save-check',
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
                className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                onClick={() => {
                  setDrawOtp(Array.from({ length: 15 }, () => ''));
                  setDrawInvalid(Array.from({ length: 15 }, () => false));
                  setCheckedDraw([]);
                }}
              >
                Limpar dezenas
              </button>
              <button
                type='button'
                className='rounded-md border border-red-20 px-3 py-1 text-sm hover:bg-white-10 text-red-300 ml-auto'
                onClick={async () => {
                  if (
                    !window.confirm(
                      'Excluir TODAS as suas conferências da Lotofácil?',
                    )
                  )
                    return;
                  if (!window.confirm('Confirma novamente?')) return;
                  const res = await fetch(
                    '/api/loterias/lotofacil/games/delete-checks',
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
                <span>11: {matchesSummary.c11}</span>
                <span>12: {matchesSummary.c12}</span>
                <span>13: {matchesSummary.c13}</span>
                <span>14: {matchesSummary.c14}</span>
                <span className='text-green-300'>15: {matchesSummary.c15}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Ações da lista e Resultados */}
      <div className='mt-4 mb-2 flex items-center gap-2'>
        <button
          type='button'
          className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
          onClick={async () => {
            setListsOpen(true);
            setListsLoading(true);
            try {
              const res = await fetch(
                '/api/loterias/lotofacil/games/bets/lists',
                { cache: 'no-store' },
              );
              const data = await res.json();
              if (!res.ok) {
                alert(data?.error || 'Falha ao listar apostas salvas.');
                setBetLists([]);
              } else {
                setBetLists(data.items ?? []);
              }
            } finally {
              setListsLoading(false);
              setSelectedListIds(new Set());
            }
          }}
        >
          Gerenciar listas
        </button>
        <button
          type='button'
          className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
          disabled={!setId || items.length === 0}
          onClick={async () => {
            setBusy(true);
            setBusyMsg('Salvando lista de apostas…');
            const contest = window.prompt(
              'Número do concurso para salvar as apostas:',
            );
            if (!contest) {
              setBusy(false);
              return;
            }
            const n = Number(contest);
            if (!Number.isInteger(n) || n <= 0) {
              alert('Número de concurso inválido.');
              setBusy(false);
              return;
            }
            const title =
              window.prompt('Título (opcional) para esta lista de apostas:') ||
              undefined;
            const res = await fetch(
              '/api/loterias/lotofacil/games/bets/save-by-contest',
              {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ setId, contestNo: n, title }),
              },
            );
            const data = await res.json();
            if (!res.ok) {
              alert(data?.error || 'Falha ao salvar apostas.');
            } else {
              alert(
                `Apostas salvas para o concurso ${n}. Total: ${data.total}.`,
              );
            }
            setBusy(false);
          }}
        >
          Salvar apostas (por concurso)
        </button>
        <button
          type='button'
          className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
          onClick={async () => {
            setBusy(true);
            setBusyMsg('Carregando lista de apostas…');
            const contest = window.prompt(
              'Número do concurso para carregar as apostas:',
            );
            if (!contest) {
              setBusy(false);
              return;
            }
            const n = Number(contest);
            if (!Number.isInteger(n) || n <= 0) {
              alert('Número de concurso inválido.');
              setBusy(false);
              return;
            }
            const mode = window.confirm(
              'Clique OK para substituir os jogos atuais. Cancelar para adicionar (append).',
            )
              ? 'replace'
              : 'append';
            const res = await fetch(
              '/api/loterias/lotofacil/games/bets/load-by-contest',
              {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ contestNo: n, mode, setId }),
              },
            );
            const data = await res.json();
            if (!res.ok) {
              alert(data?.error || 'Falha ao carregar apostas.');
            } else {
              if (!setId && data.setId) {
                setSetId(data.setId);
              }
              alert(
                `Apostas ${mode === 'replace' ? 'substituídas' : 'adicionadas'}: ${data.loaded}.`,
              );
              setCheckedDraw([]);
              setManualPositions(new Set());
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
            }
            setBusy(false);
          }}
        >
          Carregar apostas (por concurso)
        </button>
        <button
          type='button'
          className='ml-auto rounded-md border border-red-20 px-3 py-1 text-sm text-red-300 hover:bg-red-600 hover:text-white'
          onClick={() => {
            setItems([]);
            setSetId(null);
            setCheckedDraw([]);
            setManualPositions(new Set());
          }}
          disabled={items.length === 0 && !setId}
        >
          Limpar jogos gerados
        </button>
      </div>
      <div className='rounded-md border border-white/10'>
        {matchesSummary ? (
          <div className='flex items-center justify-end gap-3 px-3 py-2 text-sm text-zinc-300 border-b border-white/10'>
            <span className='text-zinc-400'>Sumário de acertos:</span>
            <span className='inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5'>
              <span className='text-zinc-400'>11</span>
              <span className='font-semibold'>{matchesSummary.c11}</span>
            </span>
            <span className='inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5'>
              <span className='text-zinc-400'>12</span>
              <span className='font-semibold'>{matchesSummary.c12}</span>
            </span>
            <span className='inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5'>
              <span className='text-zinc-400'>13</span>
              <span className='font-semibold'>{matchesSummary.c13}</span>
            </span>
            <span className='inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5'>
              <span className='text-zinc-400'>14</span>
              <span className='font-semibold'>{matchesSummary.c14}</span>
            </span>
            <span className='inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5'>
              <span className='text-zinc-400'>15</span>
              <span className='font-semibold text-green-300'>
                {matchesSummary.c15}
              </span>
            </span>
          </div>
        ) : null}
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
                  <td className='py-2 pr-3'>
                    {manualPositions.has(it.position)
                      ? '-'
                      : `( ${it.position} )`}
                  </td>
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
                  <td className='py-2 pr-3'>{it.matches ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de listas salvas */}
      {listsOpen ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <button
            aria-label='Fechar'
            onClick={() => setListsOpen(false)}
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
          />
          <div
            role='dialog'
            aria-modal='true'
            className='relative z-10 max-w-[80vw] w-[82vw] max-h-[82vh] bg-white text-zinc-900 rounded-md shadow-xl overflow-hidden flex flex-col border border-black/10'
          >
            <div className='px-5 py-3 border-b border-black/10 bg-white'>
              <h2 className='text-sm font-semibold tracking-wider'>
                Listas salvas — Lotofácil
              </h2>
            </div>
            <div className='px-5 py-4 flex-1 min-h-0 overflow-hidden'>
              {listsLoading ? (
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
                              selectedListIds.size > 0 &&
                              selectedListIds.size === betLists.length
                            }
                            onChange={(e) =>
                              setSelectedListIds(
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
                            setBusy(true);
                            setBusyMsg('Carregando apostas…');
                            const res = await fetch(
                              '/api/loterias/lotofacil/games/bets/load-by-contest',
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
                              setBusy(false);
                              return;
                            }
                            if (!setId && data.setId) {
                              setSetId(data.setId);
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
                            setManualPositions(new Set());
                            setListsOpen(false);
                            setBusy(false);
                          }}
                        >
                          <td className='py-2 pl-2'>
                            <input
                              type='checkbox'
                              checked={selectedListIds.has(b.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedListIds((prev) => {
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
                Selecionados: {selectedListIds.size}
              </div>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  className='rounded-md border border-red-20 px-3 py-1 text-sm hover:bg-black/5 text-red-600'
                  disabled={selectedListIds.size === 0}
                  onClick={async () => {
                    if (selectedListIds.size === 0) return;
                    if (!window.confirm('Excluir listas selecionadas?')) return;
                    setBusy(true);
                    setBusyMsg('Excluindo listas…');
                    const res = await fetch(
                      '/api/loterias/lotofacil/games/bets/lists/delete',
                      {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                          listIds: Array.from(selectedListIds),
                        }),
                      },
                    );
                    const data = await res.json();
                    if (!res.ok) {
                      alert(data?.error || 'Falha ao excluir.');
                    } else {
                      setBetLists((prev) =>
                        prev.filter((b) => !selectedListIds.has(b.id)),
                      );
                      setSelectedListIds(new Set());
                    }
                    setBusy(false);
                  }}
                >
                  Excluir selecionados
                </button>
                <button
                  type='button'
                  className='rounded-md border border-black/10 px-3 py-1 text-sm hover:bg-black/5'
                  onClick={() => setListsOpen(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
