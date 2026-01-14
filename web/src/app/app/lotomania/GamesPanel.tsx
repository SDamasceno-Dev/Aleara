'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Select } from '@/components/select/Select';
import { LoadingOverlay } from '@/components/overlay/LoadingOverlay';
import { useDialog } from '@/components/dialog';
import { Button } from '@/components/button';

function InfoTip({ children }: { children: React.ReactNode }) {
  return (
    <span className='group relative inline-flex items-center'>
      <button
        type='button'
        tabIndex={0}
        aria-label='Informação'
        className='ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/30 text-[10px] leading-none text-zinc-300 hover:bg-white/10 focus:outline-none'
      >
        i
      </button>
      <span
        role='tooltip'
        className='pointer-events-none absolute left-1/2 top-full z-50 mt-1 hidden w-64 -translate-x-1/2 rounded-md border border-white/10 bg-[rgb(15,15,15)] p-2 text-xs text-zinc-100 shadow-lg group-hover:block group-focus-within:block'
      >
        {children}
      </span>
    </span>
  );
}

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
  // Registrar apostas (manual)
  const [regCountInput, setRegCountInput] = useState('50');
  const [regOtp, setRegOtp] = useState<string[]>(
    Array.from({ length: 50 }, () => ''),
  );
  const [regInvalid, setRegInvalid] = useState<boolean[]>(
    Array.from({ length: 50 }, () => false),
  );
  const regRefs = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => {
    const n = Math.max(50, Math.min(100, Number(regCountInput || '50') || 50));
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
      .map((v) => {
        const num = Number(v);
        return num === 0 ? 100 : num;
      })
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 100);
    const desired = Math.max(
      50,
      Math.min(100, Number(regCountInput || '50') || 50),
    );
    if (nums.length !== desired) return [];
    // Preserve insertion order, don't sort
    const unique: number[] = [];
    const seen = new Set<number>();
    for (const n of nums) {
      if (!seen.has(n)) {
        seen.add(n);
        unique.push(n);
      }
    }
    return unique.length === desired ? unique : [];
  }, [regOtp, regCountInput]);

  // Gerar
  const [countInput, setCountInput] = useState('50');
  const [otpValues, setOtpValues] = useState<string[]>(
    Array.from({ length: 50 }, () => ''),
  );
  const [otpInvalid, setOtpInvalid] = useState<boolean[]>(
    Array.from({ length: 50 }, () => false),
  );
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  // Keep OTP inputs length in sync with countInput (50..100)
  useEffect(() => {
    const n = Math.max(50, Math.min(100, Number(countInput || '0') || 50));
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
      return prev.slice(0, n);
    });
    otpRefs.current = otpRefs.current.slice(0, n);
  }, [countInput]);
  const [kInput, setKInput] = useState('05');
  const [seedInput, setSeedInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState<string>('Processando…');
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
      const res = await fetch('/api/loterias/lotomania/games/sets/list', {
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
    const n = Math.max(50, Math.min(100, Number(countInput || '0') || 50));
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
          .map((v) => {
            const num = Number(v);
            return num === 0 ? 100 : num;
          })
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= 100),
      ),
    );
    // Preserve insertion order, don't sort
    return nums;
  }, [otpValues]);

  // Duplicate flags for OTP boxes
  const duplicateFlags = useMemo(() => {
    const norm = otpValues.map((v) => {
      if (!v || v.length !== 2) return '';
      const num = Number(v);
      // Normalize: 0 becomes 100, but keep as number for comparison
      const normalized = num === 0 ? 100 : num;
      // Return normalized number as string for comparison (00 and 100 both become "100")
      return String(normalized);
    });
    const counts = new Map<string, number>();
    for (const s of norm) {
      if (!s) continue;
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return norm.map((s) => (s && (counts.get(s) ?? 0) > 1 ? true : false));
  }, [otpValues]);

  // Conferir
  const [drawOtp, setDrawOtp] = useState<string[]>(
    Array.from({ length: 20 }, () => ''),
  );
  const [drawInvalid, setDrawInvalid] = useState<boolean[]>(
    Array.from({ length: 20 }, () => false),
  );
  const drawRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkedDraw, setCheckedDraw] = useState<number[]>([]);
  const checkedDrawSet = useMemo(() => new Set(checkedDraw), [checkedDraw]);
  const parsedDraw = useMemo(() => {
    const nums = drawOtp
      .map((v) => v.trim())
      .filter((v) => v.length === 2)
      .map((v) => {
        const num = Number(v);
        return num === 0 ? 100 : num;
      })
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 100);
    return nums;
  }, [drawOtp]);
  const drawDuplicateFlags = useMemo(() => {
    const norm = drawOtp.map((v) => {
      if (!v || v.length !== 2) return '';
      const num = Number(v);
      const normalized = num === 0 ? 100 : num;
      return String(normalized).padStart(2, '0');
    });
    const counts = new Map<string, number>();
    for (const s of norm) {
      if (!s) continue;
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return norm.map((s) => (s && (counts.get(s) ?? 0) > 1 ? true : false));
  }, [drawOtp]);
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
    const totalCombinations = binom(n, 50); // Lotomania: 50 numbers per game

    // Show confirmation modal
    return new Promise<void>((resolve) => {
      dialog.open({
        intent: 'message',
        title: 'Confirmar geração de combinações',
        description: (
          <div className='space-y-3'>
            <p className='text-sm text-zinc-700'>
              Você está prestes a gerar <strong>{k}</strong> combinações de{' '}
              <strong>50</strong> números a partir de <strong>{n}</strong>{' '}
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
      let endpoint = '/api/loterias/lotomania/games/generate';
      if (appendOnGenerate && setId) {
        endpoint = '/api/loterias/lotomania/games/generate/append';
      } else if (setId) {
        const changed =
          !!currentSource &&
          (currentSource.length !== parsedNumbers.length ||
            currentSource.some((v, i) => v !== parsedNumbers[i]));
        if (changed)
          endpoint = '/api/loterias/lotomania/games/generate/replace';
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
      const res = await fetch('/api/loterias/lotomania/games/check', {
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
    if (checkedDraw.length !== 20) return null;
    let c15 = 0,
      c16 = 0,
      c17 = 0,
      c18 = 0,
      c19 = 0,
      c20 = 0;
    for (const it of items) {
      const m = it.matches ?? null;
      if (m === 15) c15 += 1;
      else if (m === 16) c16 += 1;
      else if (m === 17) c17 += 1;
      else if (m === 18) c18 += 1;
      else if (m === 19) c19 += 1;
      else if (m === 20) c20 += 1;
    }
    return { c15, c16, c17, c18, c19, c20, total: items.length };
  }, [items, checkedDraw]);

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
          <div className='mb-2 flex items-center text-sm text-zinc-300'>
            Registrar apostas
            <InfoTip>
              Informe {regCountInput || '50'} dezenas para cadastrar uma aposta
              manualmente.
            </InfoTip>
          </div>
          <div className='space-y-2'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex w-full flex-col'>
                <label className='text-xs text-zinc-400'>
                  Qtd. dezenas (50 a 100)
                  <input
                    type='number'
                    min={50}
                    max={100}
                    inputMode='numeric'
                    value={regCountInput}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D+/g, '');
                      setRegCountInput(v);
                    }}
                    onBlur={() => {
                      const n = Number(regCountInput || '0');
                      if (!Number.isInteger(n) || n < 50 || n > 100) {
                        const clamped = Math.min(100, Math.max(50, n || 50));
                        setRegCountInput(String(clamped));
                      }
                    }}
                    className='ml-2 w-16 rounded-md border px-2 py-1 text-sm border-black-30 bg-white-10'
                    placeholder='50'
                  />
                </label>
                <button
                  type='button'
                  className='rounded-md border border-red-20 px-3 py-1 text-sm text-red-300 hover:bg-red-600 hover:text-white w-full text-center my-2'
                  onClick={() => {
                    const n = Math.max(
                      50,
                      Math.min(100, Number(regCountInput || '50') || 50),
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
                        Number.isInteger(num) && num >= 0 && num <= 100;
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
            </div>
            <div>
              <div className='items-center gap-2'>
                <button
                  type='button'
                  className='w-full rounded-md border border-white-10 px-2 py-1 text-sm hover:bg-white-10 my-2'
                  disabled={regParsed.length === 0 || regInvalid.some(Boolean)}
                  onClick={async () => {
                    setBusy(true);
                    setBusyMsg('Registrando apostas…');
                    try {
                      const res = await fetch(
                        '/api/loterias/lotomania/games/add-items',
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
                      if (!setId && data.setId) setSetId(data.setId);
                      setItems((prev) => [...prev, ...(data.items ?? [])]);
                      const n = Math.max(
                        50,
                        Math.min(100, Number(regCountInput || '50') || 50),
                      );
                      setRegOtp(Array.from({ length: n }, () => ''));
                      setRegInvalid(Array.from({ length: n }, () => false));
                      setBusy(false);
                    } catch {
                      setBusy(false);
                    }
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
            <div className='h-px bg-white/10 my-5' />
            <div className='flex items-center text-sm text-zinc-300'>
              Gerar combinações
              <InfoTip>
                Informe {countInput || '50'} dezenas abaixo. Cada &quot;caixinha&quot;
                aceita 2 algarismos (00 = 100) e avança automaticamente.
              </InfoTip>
            </div>
          </div>
          <div>
            <div className='grid grid-cols-1 gap-2'>
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
              <div className='flex justify-between'>
                <label className='block text-xs text-zinc-400'>
                  Quantidade de dezenas a combinar (50 a 100)
                  <input
                    value={countInput}
                    onChange={(e) => setCountInput(e.target.value)}
                    className='mt-1 w-12 rounded-md border border-black-30 bg-white-10 px-2 py-1 text-sm'
                    placeholder='50'
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
                            Number.isInteger(num) && num >= 0 && num <= 100;
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
                              const isValid =
                                Number.isInteger(num) && num >= 0 && num <= 100;
                              invNext[t] = !isValid;
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
                      placeholder='00'
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
                    parsedNumbers.length < 50 ||
                    parsedNumbers.length > 100 ||
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
                  disabled={!setId}
                  title='Refaz a amostra dos jogos a partir do mesmo conjunto base'
                  onClick={async () => {
                    if (!setId) return;
                    setBusy(true);
                    setBusyMsg('Re-sorteando jogos…');
                    try {
                      const res = await fetch(
                        '/api/loterias/lotomania/games/resample',
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
                        setBusy(false);
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
                          matches: null as number | null,
                        })),
                      );
                      setCheckedDraw([]);
                      setBusy(false);
                    } catch {
                      setBusy(false);
                    }
                  }}
                >
                  Re-sortear
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
          <div className='mt-4 mb-2'>
            {setId ? (
              <div className='flex justify-between gap-2'>
                <button
                  type='button'
                  className='w-full rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                  disabled={!setId || !titleInput.trim()}
                  onClick={async () => {
                    if (!setId || !titleInput.trim()) return;
                    setBusy(true);
                    setBusyMsg('Salvando meta…');
                    try {
                      const res = await fetch(
                        '/api/loterias/lotomania/games/sets/save-meta',
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
                  className='w-full rounded-md border border-red-20 px-3 py-1 text-sm hover:bg-white-10 text-red-300'
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
                        '/api/loterias/lotomania/games/sets/delete',
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
                      setTitleInput('');
                      setMarkedIdx(null);
                      setCurrentSource(null);
                      setCountInput('50');
                      setOtpValues(Array.from({ length: 50 }, () => ''));
                      setOtpInvalid(Array.from({ length: 50 }, () => false));
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
          </div>
          <div>
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
                      '/api/loterias/lotomania/games/sets/list',
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
                  setBusy(true);
                  setBusyMsg('Carregando combinação…');
                  try {
                    const res = await fetch(
                      `/api/loterias/lotomania/games/${id}?size=1000`,
                      {
                        cache: 'no-store',
                      },
                    );
                    const data = await res.json();
                    if (!res.ok) {
                      alert(data?.error || 'Falha ao carregar set.');
                      setBusy(false);
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
                      String(Math.max(50, Math.min(100, src.length))),
                    );
                    setOtpValues(
                      src.slice(0, Math.max(50, Math.min(100, src.length))),
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
                    setBusy(false);
                  } catch {
                    setBusy(false);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Conferir */}
        <div className='rounded-md border border-white/10 p-3'>
          <div className='mb-2 flex items-center text-sm text-zinc-300'>
            Conferir resultado
            <InfoTip>
              Informe as 20 dezenas do sorteio. Cada &quot;caixinha&quot; aceita 2
              algarismos (00 = 100).
            </InfoTip>
          </div>
          <div className='space-y-2'>
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
                        Number.isInteger(num) && num >= 0 && num <= 100;
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
                      : drawDuplicateFlags[idx]
                        ? 'bg-red-10 border-black-30 text-zinc-900 font-semibold'
                        : 'bg-white border-black-30 text-zinc-900'
                  }`}
                  aria-invalid={drawInvalid[idx] ? 'true' : 'false'}
                  title={
                    drawInvalid[idx]
                      ? 'Digite um número entre 00 e 100'
                      : undefined
                  }
                  placeholder='00'
                />
              ))}
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <button
                type='button'
                className='w-full rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                disabled={
                  checkLoading ||
                  !setId ||
                  parsedDraw.length !== 20 ||
                  drawOtp.some((v) => v.length !== 2) ||
                  drawInvalid.some((b) => b) ||
                  drawDuplicateFlags.some((b) => b)
                }
                onClick={async () => {
                  await handleCheck(parsedDraw);
                  setCheckedDraw(parsedDraw);
                }}
              >
                {checkLoading ? 'Conferindo…' : 'Conferir'}
              </button>
              <button
                type='button'
                className='w-full rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                disabled={
                  !setId ||
                  // Só pode salvar após conferência ter sido feita (checkedDraw preenchido)
                  checkedDraw.length !== 20
                }
                onClick={async () => {
                  const contest = window.prompt('Número do concurso:');
                  if (!contest) return;
                  const n = Number(contest);
                  if (!Number.isInteger(n) || n <= 0) {
                    alert('Concurso inválido.');
                    return;
                  }
                  setBusy(true);
                  setBusyMsg('Salvando conferência…');
                  try {
                    const res = await fetch(
                      '/api/loterias/lotomania/games/save-check',
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
                      setBusy(false);
                      return;
                    }
                    alert(
                      `Conferência salva! Concurso ${n}, ${data.total} jogos registrados.`,
                    );
                    setBusy(false);
                  } catch {
                    setBusy(false);
                  }
                }}
              >
                Salvar
              </button>
              <button
                type='button'
                className='w-full rounded-md border border-white-10 px-3 py-1 text-sm hover:bg-white-10'
                onClick={() => {
                  setDrawOtp(Array.from({ length: 20 }, () => ''));
                  setDrawInvalid(Array.from({ length: 20 }, () => false));
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
                className='w-full rounded-md border border-red-20 px-3 py-1 text-sm text-red-300 hover:bg-red-600 hover:text-white'
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
                    '/api/loterias/lotomania/games/delete-checks',
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
      <div className='mt-4 mb-2 flex'>
        <div className='flex gap-2'>
          <ManageLists
            setId={setId}
            setItems={setItems}
            setCheckedDraw={setCheckedDraw}
          />
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
                window.prompt(
                  'Título (opcional) para esta lista de apostas:',
                ) || undefined;
              const res = await fetch(
                '/api/loterias/lotomania/games/bets/save-by-contest',
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
                '/api/loterias/lotomania/games/bets/load-by-contest',
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
        </div>
        <button
          type='button'
          className='ml-auto rounded-md border border-red-20 px-3 py-1 text-sm text-red-300 hover:bg-red-600 hover:text-white'
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
      <div className='rounded-md border border-white/10'>
        {matchesSummary ? (
          <div className='flex items-center justify-end gap-3 px-3 py-2 text-sm text-zinc-300 border-b border-white/10'>
            <span className='text-zinc-400'>Sumário de acertos:</span>
            <span className='inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5'>
              <span className='text-zinc-400'>15</span>
              <span className='font-semibold'>{matchesSummary.c15}</span>
            </span>
            <span className='inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5'>
              <span className='text-zinc-400'>16</span>
              <span className='font-semibold'>{matchesSummary.c16}</span>
            </span>
            <span className='inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5'>
              <span className='text-zinc-400'>17</span>
              <span className='font-semibold'>{matchesSummary.c17}</span>
            </span>
            <span className='inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5'>
              <span className='text-zinc-400'>18</span>
              <span className='font-semibold'>{matchesSummary.c18}</span>
            </span>
            <span className='inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5'>
              <span className='text-zinc-400'>19</span>
              <span className='font-semibold'>{matchesSummary.c19}</span>
            </span>
            <span className='inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5'>
              <span className='text-zinc-400'>20</span>
              <span className='font-semibold text-green-300'>
                {matchesSummary.c20}
              </span>
            </span>
          </div>
        ) : null}
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
                      const s = n === 100 ? '00' : String(n).padStart(2, '0');
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
            const res = await fetch('/api/loterias/lotomania/games/bets/lists');
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
                Listas salvas — Lotomania
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
                              '/api/loterias/lotomania/games/bets/load-by-contest',
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
                      '/api/loterias/lotomania/games/bets/lists/delete',
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
