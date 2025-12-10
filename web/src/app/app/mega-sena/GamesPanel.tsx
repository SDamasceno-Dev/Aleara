'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LoadingOverlay } from '@/components/overlay/LoadingOverlay';

type GeneratedItem = {
  position: number;
  numbers: number[];
  matches?: number | null;
};

export default function GamesPanel() {
  // Registrar apostas (manual)
  const [regCountInput, setRegCountInput] = useState('6');
  const [regOtp, setRegOtp] = useState<string[]>(
    Array.from({ length: 6 }, () => ''),
  );
  const [regInvalid, setRegInvalid] = useState<boolean[]>(
    Array.from({ length: 6 }, () => false),
  );
  const [regCountError, setRegCountError] = useState<string | null>(null);
  const regRefs = useRef<Array<HTMLInputElement | null>>([]);
  const regDuplicateFlags = useMemo(() => {
    const norm = regOtp.map((v) =>
      v && v.length === 2 ? String(Number(v)).padStart(2, '0') : '',
    );
    const counts = new Map<string, number>();
    for (const s of norm) {
      if (!s) continue;
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return norm.map((s) => (s && (counts.get(s) ?? 0) > 1 ? true : false));
  }, [regOtp]);
  const regParsed = useMemo(() => {
    const nums = regOtp
      .map((v) => v.trim())
      .filter((v) => v.length === 2)
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 60);
    const desired = Math.max(
      6,
      Math.min(20, Number(regCountInput || '6') || 6),
    );
    if (nums.length !== desired) return [];
    const unique = Array.from(new Set(nums)).sort((a, b) => a - b);
    return unique.length === desired ? unique : [];
  }, [regOtp, regCountInput]);
  const [appendOnGenerate, setAppendOnGenerate] = useState(false);
  // Keep Registrar OTP length in sync with regCountInput (6..20)
  useEffect(() => {
    const n = Math.max(6, Math.min(20, Number(regCountInput || '6') || 6));
    setRegOtp((prev) => {
      if (prev.length === n) return prev;
      if (prev.length < n)
        return [...prev, ...Array.from({ length: n - prev.length }, () => '')];
      return prev.slice(0, n);
    });
    setRegInvalid((prev) => {
      if (prev.length === n) return prev;
      if (prev.length < n)
        return [
          ...prev,
          ...Array.from({ length: n - prev.length }, () => false),
        ];
      return prev.slice(0, n).map(() => false);
    });
  }, [regCountInput]);

  const [countInput, setCountInput] = useState('7');
  const [otpValues, setOtpValues] = useState<string[]>(
    Array.from({ length: 7 }, () => ''),
  );
  const [otpInvalid, setOtpInvalid] = useState<boolean[]>(
    Array.from({ length: 7 }, () => false),
  );
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [kInput, setKInput] = useState('07');
  const [seedInput, setSeedInput] = useState('');
  const [loading, setLoading] = useState(false);
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
  const [drawOtp, setDrawOtp] = useState<string[]>(
    Array.from({ length: 6 }, () => ''),
  );
  const [drawInvalid, setDrawInvalid] = useState<boolean[]>(
    Array.from({ length: 6 }, () => false),
  );
  const drawRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [checkLoading, setCheckLoading] = useState(false);
  const [resampleLoading, setResampleLoading] = useState(false);
  const liveRef = useRef<HTMLDivElement | null>(null);
  const [checkedDraw, setCheckedDraw] = useState<number[]>([]);
  const [manualPositions, setManualPositions] = useState<Set<number>>(
    new Set(),
  );
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
  // Save-check modal
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveContest, setSaveContest] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Global overlay
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState<string>('Processando…');

  // Matches summary (4/5/6) after conferir
  const matchesSummary = useMemo(() => {
    if (checkedDraw.length !== 6) return null;
    let c4 = 0;
    let c5 = 0;
    let c6 = 0;
    for (const it of items) {
      const m = it.matches ?? null;
      if (m === 4) c4 += 1;
      else if (m === 5) c5 += 1;
      else if (m === 6) c6 += 1;
    }
    return { c4, c5, c6, total: items.length };
  }, [items, checkedDraw]);

  // Keep OTP inputs length in sync with countInput (7..15)
  useEffect(() => {
    const n = Math.max(7, Math.min(15, Number(countInput || '0') || 7));
    setOtpValues((prev) => {
      if (prev.length === n) return prev;
      if (prev.length < n)
        return [...prev, ...Array.from({ length: n - prev.length }, () => '')];
      return prev.slice(0, n);
    });
    setOtpInvalid((prev) => {
      if (prev.length === n) return prev;
      if (prev.length < n)
        return [
          ...prev,
          ...Array.from({ length: n - prev.length }, () => false),
        ];
      return prev.slice(0, n).map(() => false);
    });
  }, [countInput]);

  const parsedNumbers = useMemo(() => {
    const nums = Array.from(
      new Set(
        otpValues
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
          .map((v) => Number(v))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= 60),
      ),
    );
    return nums;
  }, [otpValues]);

  // Duplicate flags for OTP boxes
  const duplicateFlags = useMemo(() => {
    const norm = otpValues.map((v) =>
      v && v.length === 2 ? String(Number(v)).padStart(2, '0') : '',
    );
    const counts = new Map<string, number>();
    for (const s of norm) {
      if (!s) continue;
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return norm.map((s) => (s && (counts.get(s) ?? 0) > 1 ? true : false));
  }, [otpValues]);
  const parsedDraw = useMemo(() => {
    const nums = Array.from(
      new Set(
        drawOtp
          .map((v) => v.trim())
          .filter((v) => v.length === 2)
          .map((v) => Number(v))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= 60),
      ),
    ).sort((a, b) => a - b);
    return nums;
  }, [drawOtp]);

  const checkedDrawSet = useMemo(() => new Set(checkedDraw), [checkedDraw]);

  const drawDuplicateFlags = useMemo(() => {
    const norm = drawOtp.map((v) =>
      v && v.length === 2 ? String(Number(v)).padStart(2, '0') : '',
    );
    const counts = new Map<string, number>();
    for (const s of norm) {
      if (!s) continue;
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return norm.map((s) => (s && (counts.get(s) ?? 0) > 1 ? true : false));
  }, [drawOtp]);

  async function handleGenerate() {
    if (items.length > 0 && !appendOnGenerate) {
      const proceed = window.confirm(
        'Gerar combinações irá sobrescrever os jogos exibidos. Deseja continuar? Para apenas adicionar, cancele e marque "Adicionar aos jogos existentes".',
      );
      if (!proceed) return;
      setManualPositions(new Set());
    }
    setBusy(true);
    setBusyMsg('Gerando combinações…');
    setLoading(true);
    try {
      const k = Number(kInput || '0');
      let endpoint = '/api/loterias/mega-sena/games/generate';
      if (appendOnGenerate && setId) {
        endpoint = '/api/loterias/mega-sena/games/generate/append';
      } else if (setId) {
        // If editing existing set and source numbers changed, replace in place
        const changed =
          !!currentSource &&
          (currentSource.length !== parsedNumbers.length ||
            currentSource.some((v, i) => v !== parsedNumbers[i]));
        if (changed)
          endpoint = '/api/loterias/mega-sena/games/generate/replace';
      }
      const payload =
        endpoint.endsWith('/append') && setId
          ? {
              setId,
              numbers: parsedNumbers,
              k,
              seed: seedInput ? Number(seedInput) : undefined,
            }
          : endpoint.endsWith('/replace') && setId
            ? {
                setId,
                numbers: parsedNumbers,
                k,
                seed: seedInput ? Number(seedInput) : undefined,
              }
            : {
                numbers: parsedNumbers,
                k,
                seed: seedInput ? Number(seedInput) : undefined,
              };
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
        // append to existing list
        setItems((prev) => [...prev, ...(data.items ?? [])]);
      } else {
        setSetId(data.setId);
        setItems(data.items ?? []);
        setManualPositions(new Set());
      }
      // Snapshot current source numbers after a generation/replace
      setCurrentSource(parsedNumbers);
      requestAnimationFrame(() => liveRef.current?.focus());
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }

  async function handleResample() {
    if (!setId) return;
    setBusy(true);
    setBusyMsg('Re-sorteando jogos…');
    setResampleLoading(true);
    try {
      const k = Number(kInput || '0');
      const payload: { setId: string; k?: number; seed?: number } = { setId };
      if (Number.isInteger(k) && k > 0) payload.k = k;
      if (seedInput) payload.seed = Number(seedInput);
      const res = await fetch('/api/loterias/mega-sena/games/resample', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || 'Falha ao re-sortear.');
        return;
      }
      // Substitui itens pela nova amostra
      setItems(
        (
          (data.items ?? []) as Array<{ position: number; numbers: number[] }>
        ).map((it) => ({
          position: it.position,
          numbers: it.numbers ?? [],
          matches: null as number | null,
        })),
      );
      setCheckedDraw([]);
      setManualPositions(new Set());
      requestAnimationFrame(() => liveRef.current?.focus());
    } finally {
      setResampleLoading(false);
      setBusy(false);
    }
  }

  async function handleCheck() {
    if (!setId) return;
    setBusy(true);
    setBusyMsg('Conferindo jogos…');
    setCheckLoading(true);
    try {
      const res = await fetch('/api/loterias/mega-sena/games/check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ setId, draw: parsedDraw }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || 'Falha ao conferir.');
        return;
      }
      const map = new Map<number, number>();
      for (const it of data.items ?? []) {
        map.set(it.position as number, it.matches as number);
      }
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          matches: map.get(it.position) ?? it.matches ?? null,
        })),
      );
      requestAnimationFrame(() => liveRef.current?.focus());
    } finally {
      setCheckLoading(false);
      setBusy(false);
    }
  }

  return (
    <section className='rounded-lg border border-border/60 bg-card/90 p-4'>
      <LoadingOverlay
        show={busy}
        message={busyMsg}
        subtitle='Por favor, aguarde.'
      />
      <div className='mb-3 text-sm text-zinc-200'>Jogos</div>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {/* Gerador (inclui Registrar apostas acima) */}
        <div className='rounded-md border border-white/10 p-3'>
          <div className='text-sm text-zinc-300 mb-2'>Registrar apostas</div>
          <div className='space-y-2'>
            <div className='flex items-start justify-between gap-4'>
              <div className='text-xs text-zinc-500'>
                Informe {regCountInput || '6'} dezenas para cadastrar uma aposta
                manualmente.
              </div>
              {/* <div className='flex flex-col items-center gap-2'> */}
              <div className='flex w-full flex-col'>
                <label className='text-xs text-zinc-400'>
                  Qtd. dezenas (6 a 20)
                  <input
                    type='number'
                    min={6}
                    max={20}
                    inputMode='numeric'
                    value={regCountInput}
                    onChange={(e) => {
                      // allow temporary empty while typing; validation on blur
                      const v = e.target.value.replace(/\D+/g, '');
                      setRegCountInput(v);
                    }}
                    onBlur={() => {
                      const n = Number(regCountInput || '0');
                      if (!Number.isInteger(n) || n < 6 || n > 20) {
                        const clamped = Math.min(20, Math.max(6, n || 6));
                        setRegCountInput(String(clamped));
                        setRegCountError('Digite um número entre 6 e 20.');
                        window.setTimeout(() => setRegCountError(null), 2000);
                      } else {
                        setRegCountError(null);
                      }
                    }}
                    aria-invalid={regCountError ? 'true' : 'false'}
                    className={`ml-2 w-16 rounded-md border px-2 py-1 text-sm ${
                      regCountError
                        ? 'border-(--alertError)'
                        : 'border-black-30 bg-white-10'
                    }`}
                    placeholder='06'
                  />
                </label>
                {regCountError ? (
                  <div className='text-[11px] text-(--alertError) mt-1'>
                    {regCountError}
                  </div>
                ) : null}
                <button
                  type='button'
                  className='rounded-md border border-red-20 px-3 py-1 text-sm hover:bg-white-10 text-red-300'
                  onClick={() => {
                    const n = Math.max(
                      6,
                      Math.min(20, Number(regCountInput || '6') || 6),
                    );
                    setRegOtp(Array.from({ length: n }, () => ''));
                    setRegInvalid(Array.from({ length: n }, () => false));
                  }}
                >
                  Limpar apostas
                </button>
              </div>
            </div>
            <div className='flex flex-wrap gap-2'>
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
                        Number.isInteger(num) && num >= 1 && num <= 60;
                      setRegInvalid((prev) => {
                        const next = [...prev];
                        next[idx] = !isValid;
                        return next;
                      });
                      if (isValid && idx + 1 < regOtp.length) {
                        regRefs.current[idx + 1]?.focus();
                      }
                    } else {
                      setRegInvalid((prev) => {
                        const next = [...prev];
                        next[idx] = false;
                        return next;
                      });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Backspace' &&
                      regOtp[idx].length === 0 &&
                      idx > 0
                    ) {
                      regRefs.current[idx - 1]?.focus();
                    }
                    if (e.key === 'Tab' && !e.shiftKey && regInvalid[idx]) {
                      e.preventDefault();
                    }
                  }}
                  className={`h-9 w-9 rounded-md border text-center text-sm font-medium ${
                    regInvalid[idx]
                      ? 'bg-white border-(--alertError) text-(--alertError) font-bold'
                      : regDuplicateFlags[idx]
                        ? 'bg-red-10 border-black-30 text-zinc-900 font-semibold'
                        : 'bg-white border-black-30 text-zinc-900'
                  }`}
                  placeholder='00'
                />
              ))}
              <div className='items-center gap-2'>
                <button
                  type='button'
                  className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                  disabled={
                    regParsed.length === 0 ||
                    regInvalid.some(Boolean) ||
                    regDuplicateFlags.some(Boolean)
                  }
                  onClick={async () => {
                    setBusy(true);
                    setBusyMsg('Registrando apostas…');
                    const res = await fetch(
                      '/api/loterias/mega-sena/games/add-items',
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
                      setBusy(false);
                      return;
                    }
                    if (!setId && data.setId) {
                      setSetId(data.setId);
                    }
                    setItems((prev) => [...prev, ...(data.items ?? [])]);
                    // marcar como manual os positions retornados
                    const newPositions = (
                      (data.items ?? []) as Array<{ position: number }>
                    ).map((it) => it.position);
                    setManualPositions((prev) => {
                      const next = new Set(prev);
                      for (const p of newPositions) next.add(p);
                      return next;
                    });
                    const n = Math.max(
                      6,
                      Math.min(20, Number(regCountInput || '6') || 6),
                    );
                    setRegOtp(Array.from({ length: n }, () => ''));
                    setRegInvalid(Array.from({ length: n }, () => false));
                    setBusy(false);
                  }}
                >
                  Registrar
                </button>
                <div className='text-xs text-zinc-500'>
                  {setId
                    ? 'Aposta será adicionada ao conjunto atual.'
                    : 'Um conjunto será criado automaticamente.'}
                </div>
              </div>
            </div>
            <div className='h-px bg-white/10 my-2' />
            <div className='text-sm text-zinc-300'>Gerar combinações</div>
          </div>
          <div>
            <div className='grid grid-cols-1 gap-2'>
              <div>
                <label className='text-xs text-zinc-400'>
                  Combinações salvas
                  <select
                    className='w-full rounded-md border border-black-30 bg-white-10 px-2 py-1 text-sm'
                    onFocus={async () => {
                      try {
                        const res = await fetch(
                          '/api/loterias/mega-sena/games/sets/list',
                          { cache: 'no-store' },
                        );
                        const data = await res.json();
                        if (res.ok) {
                          setSavedSets(
                            (data.items ?? []).map((it: any) => ({
                              id: it.id as string,
                              title: String(it.title ?? ''),
                              source_numbers:
                                (it.source_numbers as number[]) ?? [],
                              sample_size: Number(it.sample_size ?? 0),
                              marked_idx:
                                (it.marked_idx as number | null) ?? null,
                            })),
                          );
                        }
                      } catch {}
                    }}
                    onChange={async (e) => {
                      const id = e.target.value;
                      if (!id) return;
                      setBusy(true);
                      setBusyMsg('Carregando combinação…');
                      try {
                        const res = await fetch(
                          `/api/loterias/mega-sena/games/${id}?size=1000`,
                          { cache: 'no-store' },
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
                          String(Math.max(7, Math.min(15, src.length))),
                        );
                        setOtpValues(
                          src.slice(0, Math.max(7, Math.min(15, src.length))),
                        );
                        setOtpInvalid(
                          Array.from({ length: src.length }, () => false),
                        );
                        setKInput(String(set.sample_size).padStart(2, '0'));
                        setSetId(set.id);
                        setCurrentSource(set.source_numbers ?? []);
                        setTitleInput(set.title ?? '');
                        setMarkedIdx(set.marked_idx ?? null);
                        setItems(
                          (data.items ?? []).map((it: any) => ({
                            position: it.position as number,
                            numbers: (it.numbers as number[]) ?? [],
                            matches: it.matches ?? null,
                          })),
                        );
                        setManualPositions(new Set());
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <option value=''>Selecione…</option>
                    {savedSets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </label>
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
                      setBusy(true);
                      setBusyMsg('Salvando meta…');
                      try {
                        const res = await fetch(
                          '/api/loterias/mega-sena/games/sets/save-meta',
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
                        if (!res.ok) {
                          alert(data?.error || 'Falha ao salvar meta.');
                        } else {
                          alert('Salvo com sucesso.');
                        }
                      } finally {
                        setBusy(false);
                      }
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
                          '/api/loterias/mega-sena/games/sets/delete',
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
                        // reset UI
                        setItems([]);
                        setSetId(null);
                        setCheckedDraw([]);
                        setManualPositions(new Set());
                        setTitleInput('');
                        setMarkedIdx(null);
                        setCurrentSource(null);
                        setCountInput('7');
                        setOtpValues(Array.from({ length: 7 }, () => ''));
                        setOtpInvalid(Array.from({ length: 7 }, () => false));
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
                  Quantidade de dezenas a combinar (7 a 15)
                  <input
                    value={countInput}
                    onChange={(e) => setCountInput(e.target.value)}
                    className='mt-1 w-12 rounded-md border border-black-30 bg-white-10 px-2 py-1 text-sm'
                    placeholder='7'
                  />
                </label>
                <label className='text-xs text-zinc-400'>
                  Quantidade de combinações (k)
                  <input
                    value={kInput}
                    onChange={(e) => setKInput(e.target.value)}
                    className='mt-1 w-12 rounded-md border border-black-30 bg-white-10 px-2 py-1 text-sm'
                    placeholder='07'
                  />
                </label>
              </div>
              <div className='text-xs text-zinc-500'>
                Informe {countInput || '7'} dezenas abaixo. Cada “caixinha”
                aceita 2 algarismos e avança automaticamente.
              </div>

              <div className='flex flex-wrap gap-2'>
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
                        // validate and possibly advance
                        if (raw.length === 2) {
                          const num = Number(raw);
                          const isValid =
                            Number.isInteger(num) && num >= 1 && num <= 60;
                          setOtpInvalid((prev) => {
                            const next = [...prev];
                            next[idx] = !isValid;
                            return next;
                          });
                          if (isValid && idx + 1 < otpValues.length) {
                            otpRefs.current[idx + 1]?.focus();
                          }
                        } else {
                          // incomplete -> clear invalid
                          setOtpInvalid((prev) => {
                            const next = [...prev];
                            next[idx] = false;
                            return next;
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Backspace' &&
                          otpValues[idx].length === 0 &&
                          idx > 0
                        ) {
                          otpRefs.current[idx - 1]?.focus();
                        }
                        // Block tab forward when current value is invalid
                        if (e.key === 'Tab' && !e.shiftKey && otpInvalid[idx]) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const text = e.clipboardData.getData('text');
                        const digits = text.replace(/\D+/g, '');
                        if (!digits) return;
                        e.preventDefault();
                        const pairs: string[] = [];
                        for (let i = 0; i < digits.length; i += 2) {
                          pairs.push(digits.slice(i, i + 2));
                        }
                        setOtpValues((prev) => {
                          const next = [...prev];
                          let j = idx;
                          for (const p of pairs) {
                            if (j >= next.length) break;
                            next[j] = p.slice(0, 2);
                            j += 1;
                          }
                          // validate filled and focus first invalid or last
                          setOtpInvalid((invPrev) => {
                            const invNext = [...invPrev];
                            for (
                              let t = idx;
                              t < Math.min(idx + pairs.length, next.length);
                              t += 1
                            ) {
                              const num = Number(next[t]);
                              invNext[t] = !(
                                Number.isInteger(num) &&
                                num >= 1 &&
                                num <= 60
                              );
                            }
                            const firstInvalid = invNext.findIndex(
                              (v, t) => v && t >= idx,
                            );
                            const last = Math.min(j, next.length - 1);
                            requestAnimationFrame(() =>
                              otpRefs.current[
                                firstInvalid !== -1 ? firstInvalid : last
                              ]?.focus(),
                            );
                            return invNext;
                          });
                          return next;
                        });
                      }}
                      className={`h-9 w-9 rounded-md border text-center text-sm font-medium ${
                        otpInvalid[idx]
                          ? 'bg-white border-(--alertError) text-(--alertError) font-bold'
                          : duplicateFlags[idx]
                            ? 'bg-red-70 border-black-30 text-white font-bold'
                            : 'bg-white border-black-30 text-zinc-900'
                      }`}
                      aria-invalid={otpInvalid[idx] ? 'true' : 'false'}
                      title={
                        otpInvalid[idx]
                          ? 'Digite um número entre 01 e 60'
                          : undefined
                      }
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
            </div>
            <div className='flex items-center gap-2'>
              <label className='text-xs text-zinc-400'>
                Seed (opcional)
                <input
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  className='ml-2 w-28 rounded-md border border-black-30 bg-white-10 px-2 py-1 text-sm'
                  placeholder=''
                />
              </label>
              <label className='text-xs text-zinc-400 inline-flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={appendOnGenerate}
                  onChange={(e) => setAppendOnGenerate(e.target.checked)}
                />
                Adicionar aos jogos existentes
              </label>
              <div className='ml-auto flex flex-col gap-2'>
                <button
                  type='button'
                  className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                  disabled={
                    loading ||
                    parsedNumbers.length < 7 ||
                    parsedNumbers.length > 15 ||
                    parsedNumbers.length !== otpValues.length ||
                    otpValues.some((v) => v.length !== 2) ||
                    otpInvalid.some((b) => b) ||
                    duplicateFlags.some((b) => b)
                  }
                  onClick={handleGenerate}
                >
                  {loading ? 'Gerando…' : 'Gerar'}
                </button>
                <button
                  type='button'
                  className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10 w-28'
                  disabled={resampleLoading || !setId}
                  title='Refaz a amostra dos jogos a partir do mesmo conjunto base'
                  onClick={handleResample}
                >
                  {resampleLoading ? 'Re-sorteando…' : 'Re-sortear'}
                </button>
              </div>
            </div>
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
          </div>
        </div>

        {/* Conferir */}
        <div className='rounded-md border border-white/10 p-3'>
          <div className='text-sm text-zinc-300 mb-2'>Conferir resultado</div>
          <div className='space-y-2'>
            <div className='text-xs text-zinc-500'>
              Informe as 6 dezenas do sorteio. Cada “caixinha” aceita 2
              algarismos.
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
                        Number.isInteger(num) && num >= 1 && num <= 60;
                      setDrawInvalid((prev) => {
                        const next = [...prev];
                        next[idx] = !isValid;
                        return next;
                      });
                      if (isValid && idx + 1 < drawOtp.length) {
                        drawRefs.current[idx + 1]?.focus();
                      }
                    } else {
                      setDrawInvalid((prev) => {
                        const next = [...prev];
                        next[idx] = false;
                        return next;
                      });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Backspace' &&
                      drawOtp[idx].length === 0 &&
                      idx > 0
                    ) {
                      drawRefs.current[idx - 1]?.focus();
                    }
                    if (e.key === 'Tab' && !e.shiftKey && drawInvalid[idx]) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text');
                    const digits = text.replace(/\D+/g, '');
                    if (!digits) return;
                    e.preventDefault();
                    setCheckedDraw([]);
                    const pairs: string[] = [];
                    for (let i = 0; i < digits.length; i += 2) {
                      pairs.push(digits.slice(i, i + 2));
                    }
                    setDrawOtp((prev) => {
                      const next = [...prev];
                      let j = idx;
                      for (const p of pairs) {
                        if (j >= next.length) break;
                        next[j] = p.slice(0, 2);
                        j += 1;
                      }
                      setDrawInvalid((invPrev) => {
                        const invNext = [...invPrev];
                        for (
                          let t = idx;
                          t < Math.min(idx + pairs.length, next.length);
                          t += 1
                        ) {
                          const num = Number(next[t]);
                          invNext[t] = !(
                            Number.isInteger(num) &&
                            num >= 1 &&
                            num <= 60
                          );
                        }
                        const firstInvalid = invNext.findIndex(
                          (v, t) => v && t >= idx,
                        );
                        const last = Math.min(j, next.length - 1);
                        requestAnimationFrame(() =>
                          drawRefs.current[
                            firstInvalid !== -1 ? firstInvalid : last
                          ]?.focus(),
                        );
                        return invNext;
                      });
                      return next;
                    });
                  }}
                  className={`h-9 w-9 rounded-md border text-center text-sm font-medium ${
                    drawInvalid[idx]
                      ? 'bg-white border-(--alertError) text-(--alertError) font-bold'
                      : drawDuplicateFlags[idx]
                        ? 'bg-red-10 border-black-30 text-zinc-900 font-semibold'
                        : 'bg-white border-black-30 text-zinc-900'
                  }`}
                  aria-invalid={drawInvalid[idx] ? 'true' : 'false'}
                  title={
                    drawInvalid[idx]
                      ? 'Digite um número entre 01 e 60'
                      : undefined
                  }
                  placeholder='00'
                />
              ))}
            </div>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                disabled={
                  checkLoading ||
                  !setId ||
                  parsedDraw.length !== 6 ||
                  drawOtp.some((v) => v.length !== 2) ||
                  drawInvalid.some((b) => b) ||
                  drawDuplicateFlags.some((b) => b)
                }
                onClick={async () => {
                  await handleCheck();
                  setCheckedDraw(parsedDraw);
                }}
              >
                {checkLoading ? 'Conferindo…' : 'Conferir'}
              </button>
              <button
                type='button'
                className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                disabled={
                  !setId ||
                  // Só pode salvar após conferência ter sido feita (checkedDraw preenchido)
                  checkedDraw.length !== 6
                }
                onClick={() => {
                  setSaveContest('');
                  setSaveError(null);
                  setSaveOpen(true);
                }}
              >
                Salvar
              </button>
              <button
                type='button'
                className='rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                onClick={() => {
                  setDrawOtp(Array.from({ length: 6 }, () => ''));
                  setDrawInvalid(Array.from({ length: 6 }, () => false));
                  setCheckedDraw([]);
                  setItems((prev) =>
                    prev.map((it) => ({
                      ...it,
                      matches: null as number | null,
                    })),
                  );
                }}
              >
                Limpar resultado
              </button>
              <button
                type='button'
                className='rounded-md border border-red-20 px-3 py-1 text-sm hover:bg-white-10 text-red-300'
                onClick={async () => {
                  setBusy(true);
                  setBusyMsg('Limpando conferências…');
                  if (
                    !window.confirm(
                      'Tem certeza que deseja excluir TODAS as suas conferências salvas?',
                    )
                  ) {
                    setBusy(false);
                    return;
                  }
                  if (
                    !window.confirm(
                      'Confirma novamente? Esta ação não pode ser desfeita.',
                    )
                  ) {
                    setBusy(false);
                    return;
                  }
                  const res = await fetch(
                    '/api/loterias/mega-sena/games/delete-checks',
                    {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({}), // remove todas as conferências do usuário logado
                    },
                  );
                  const data = await res.json();
                  if (!res.ok) {
                    alert(data?.error || 'Falha ao remover conferências.');
                  } else {
                    alert(`Conferências removidas: ${data.deleted ?? 0}.`);
                  }
                  setBusy(false);
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
            <div className='text-xs text-zinc-500'>
              Sorteio: {parsedDraw.join(', ') || '—'}
            </div>
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
                '/api/loterias/mega-sena/games/bets/lists',
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
            if (!contest) return;
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
              '/api/loterias/mega-sena/games/bets/save-by-contest',
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
            if (!contest) return;
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
              '/api/loterias/mega-sena/games/bets/load-by-contest',
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
          className='ml-auto rounded-md border border-red-20 px-3 py-1 text-sm hover:bg-white-10 text-red-300'
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
              <span className='text-zinc-400'>4</span>
              <span className='font-semibold'>{matchesSummary.c4}</span>
            </span>
            <span className='inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5'>
              <span className='text-zinc-400'>5</span>
              <span className='font-semibold'>{matchesSummary.c5}</span>
            </span>
            <span className='inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5'>
              <span className='text-zinc-400'>6</span>
              <span className='font-semibold text-green-300'>
                {matchesSummary.c6}
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
              {items.map((it, idx) => {
                const parts = it.numbers.map((n, i) => {
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
                });
                return (
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
                      {parts}
                    </td>
                    <td className='py-2 pr-3'>{it.matches ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal salvar conferência */}
      {saveOpen ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <button
            aria-label='Fechar'
            onClick={() => setSaveOpen(false)}
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
          />
          <div
            role='dialog'
            aria-modal='true'
            aria-labelledby='save-title'
            className='relative z-10 max-w-md w-[92vw] bg-white text-zinc-900 rounded-md shadow-xl overflow-hidden flex flex-col border border-black/10'
          >
            <div className='px-5 py-3 border-b border-black/10 bg-white'>
              <h2
                id='save-title'
                className='text-sm font-semibold tracking-wider'
              >
                Salvar conferência
              </h2>
            </div>
            <div className='px-5 py-4 space-y-3'>
              <div className='text-xs text-zinc-600'>
                Informe o concurso para salvar os acertos deste set.
              </div>
              <div className='text-xs text-zinc-600'>
                Sorteio:{' '}
                {checkedDraw.length === 6
                  ? checkedDraw
                      .map((n) => String(n).padStart(2, '0'))
                      .join(', ')
                  : '—'}
              </div>
              <label className='text-xs text-zinc-700'>
                Concurso
                <input
                  type='number'
                  min={1}
                  value={saveContest}
                  onChange={(e) =>
                    setSaveContest(e.target.value.replace(/\D+/g, ''))
                  }
                  onBlur={() => {
                    const n = Number(saveContest || '0');
                    if (!Number.isInteger(n) || n <= 0) {
                      setSaveError(
                        'Digite um número de concurso válido (> 0).',
                      );
                    } else {
                      setSaveError(null);
                    }
                  }}
                  className={`mt-1 w-40 rounded-md border px-2 py-1 text-sm ${
                    saveError ? 'border-(--alertError)' : 'border-black/20'
                  }`}
                  placeholder='Ex.: 2680'
                />
              </label>
              {saveError ? (
                <div className='text-[11px] text-(--alertError)'>
                  {saveError}
                </div>
              ) : null}
            </div>
            <div className='px-5 py-3 border-t border-black/10 bg-white flex items-center justify-end gap-2'>
              <button
                type='button'
                className='rounded-md border border-black/10 px-3 py-1 text-sm hover:bg-black/5'
                onClick={() => setSaveOpen(false)}
              >
                Cancelar
              </button>
              <button
                type='button'
                className='rounded-md border border-black/10 px-3 py-1 text-sm hover:bg-black/5'
                disabled={
                  saveLoading ||
                  checkedDraw.length !== 6 ||
                  !Number.isInteger(Number(saveContest || '0')) ||
                  Number(saveContest || '0') <= 0
                }
                onClick={async () => {
                  setSaveLoading(true);
                  setBusy(true);
                  setBusyMsg('Salvando conferência…');
                  try {
                    const n = Number(saveContest || '0');
                    const res = await fetch(
                      '/api/loterias/mega-sena/games/save-check',
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
                    setSaveOpen(false);
                  } finally {
                    setSaveLoading(false);
                    setBusy(false);
                  }
                }}
              >
                {saveLoading ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
            aria-labelledby='lists-title'
            className='relative z-10 max-w-[80vw] w-[82vw] max-h-[82vh] bg-white text-zinc-900 rounded-md shadow-xl overflow-hidden flex flex-col border border-black/10'
          >
            <div className='px-5 py-3 border-b border-black/10 bg-white'>
              <h2
                id='lists-title'
                className='text-sm font-semibold tracking-wider'
              >
                Listas salvas
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
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedListIds(
                                  new Set(betLists.map((b) => b.id)),
                                );
                              } else {
                                setSelectedListIds(new Set());
                              }
                            }}
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
                            // Primeiro confirma se deseja carregar
                            const proceed = window.confirm(
                              'Carregar as apostas deste item?',
                            );
                            if (!proceed) return;
                            // Depois escolhe substituir ou adicionar
                            const mode = window.confirm(
                              'Clique OK para substituir os jogos atuais. Cancelar para adicionar (append).',
                            )
                              ? 'replace'
                              : 'append';
                            setBusy(true);
                            setBusyMsg('Carregando lista de apostas…');
                            const res = await fetch(
                              '/api/loterias/mega-sena/games/bets/load-by-contest',
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
            <div className='px-5 py-3 border-t border-black/10 bg-white'>
              <div className='flex w-full items-center justify-between'>
                <div className='text-xs text-zinc-600'>
                  Selecionados: {selectedListIds.size} de {betLists.length}
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    className='rounded-md border border-black/10 px-3 py-1 text-sm hover:bg-black/5'
                    onClick={() =>
                      setSelectedListIds(new Set(betLists.map((b) => b.id)))
                    }
                    disabled={betLists.length === 0}
                  >
                    Selecionar tudo
                  </button>
                  <button
                    type='button'
                    className='rounded-md border border-black/10 px-3 py-1 text-sm hover:bg-black/5'
                    onClick={() => setSelectedListIds(new Set())}
                    disabled={selectedListIds.size === 0}
                  >
                    Limpar seleção
                  </button>
                  <button
                    type='button'
                    className='rounded-md border border-red-20 px-3 py-1 text-sm hover:bg-black/5 text-red-600'
                    onClick={async () => {
                      if (selectedListIds.size === 0) return;
                      if (!window.confirm('Excluir listas selecionadas?'))
                        return;
                      const res = await fetch(
                        '/api/loterias/mega-sena/games/bets/lists/delete',
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
                        return;
                      }
                      // refresh list
                      setBetLists((prev) =>
                        prev.filter((b) => !selectedListIds.has(b.id)),
                      );
                      setSelectedListIds(new Set());
                    }}
                    disabled={selectedListIds.size === 0}
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
        </div>
      ) : null}
    </section>
  );
}
