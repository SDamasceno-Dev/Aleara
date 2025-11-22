'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type GeneratedItem = {
  position: number;
  numbers: number[];
  matches?: number | null;
};

export default function GamesPanel() {
  const [numbersInput, setNumbersInput] = useState('');
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
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [drawOtp, setDrawOtp] = useState<string[]>(
    Array.from({ length: 6 }, () => ''),
  );
  const [drawInvalid, setDrawInvalid] = useState<boolean[]>(
    Array.from({ length: 6 }, () => false),
  );
  const drawRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [checkLoading, setCheckLoading] = useState(false);
  const liveRef = useRef<HTMLDivElement | null>(null);
  const [checkedDraw, setCheckedDraw] = useState<number[]>([]);

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
    ).sort((a, b) => a - b);
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
    setLoading(true);
    try {
      const k = Number(kInput || '0');
      const res = await fetch('/api/loterias/mega-sena/games/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          numbers: parsedNumbers,
          k,
          seed: seedInput ? Number(seedInput) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || 'Falha ao gerar combinações.');
        return;
      }
      setSetId(data.setId);
      setItems(data.items ?? []);
      requestAnimationFrame(() => liveRef.current?.focus());
    } finally {
      setLoading(false);
    }
  }

  async function handleCheck() {
    if (!setId) return;
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
    }
  }

  return (
    <section className='rounded-lg border border-border/60 bg-card/90 p-4'>
      <div className='mb-3 text-sm text-zinc-200'>Jogos</div>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {/* Gerador */}
        <div className='rounded-md border border-white/10 p-3'>
          <div className='text-sm text-zinc-300 mb-2'>Gerar combinações</div>
          <div className='space-y-2'>
            <div className='grid grid-cols-1 gap-2'>
              <label className='block text-xs text-zinc-400'>
                Quantidade de dezenas a combinar (7 a 15)
                <input
                  value={countInput}
                  onChange={(e) => setCountInput(e.target.value)}
                  className='mt-1 w-28 rounded-md border border-black-30 bg-transparent px-2 py-1 text-sm'
                  placeholder='7'
                />
              </label>
              <div className='text-xs text-zinc-500'>
                Informe {countInput || '7'} dezenas abaixo. Cada “caixinha”
                aceita 2 algarismos e avança automaticamente.
              </div>
              <div className='flex flex-wrap gap-2'>
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
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
                ))}
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <label className='text-xs text-zinc-400'>
                Quantidade (k)
                <input
                  value={kInput}
                  onChange={(e) => setKInput(e.target.value)}
                  className='ml-2 w-24 rounded-md border border-black-30 bg-transparent px-2 py-1 text-sm'
                  placeholder='07'
                />
              </label>
              <label className='text-xs text-zinc-400'>
                Seed (opcional)
                <input
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  className='ml-2 w-28 rounded-md border border-black-30 bg-transparent px-2 py-1 text-sm'
                  placeholder=''
                />
              </label>
              <button
                type='button'
                className='ml-auto rounded-md border border-black-30 px-3 py-1 text-sm hover:bg-white/5'
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
                className='rounded-md border border-black-30 px-3 py-1 text-sm hover:bg-white/5 text-red-300'
                onClick={() => {
                  // Limpa jogos gerados localmente para permitir um novo fluxo
                  setItems([]);
                  setSetId(null);
                  setCheckedDraw([]);
                }}
                disabled={items.length === 0 && !setId}
              >
                Limpar jogos gerados
              </button>
            </div>
            <div className='text-xs text-zinc-500'>
              Dezenas válidas: {parsedNumbers.join(', ') || '—'}
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
                  ref={(el) => (drawRefs.current[idx] = el)}
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
                className='rounded-md border border-black-30 px-3 py-1 text-sm hover:bg-white/5'
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
                className='rounded-md border border-black-30 px-3 py-1 text-sm hover:bg-white/5'
                disabled={
                  !setId ||
                  // Só pode salvar após conferência ter sido feita (checkedDraw preenchido)
                  checkedDraw.length !== 6
                }
                onClick={async () => {
                  const contest = window.prompt('Informe o número do concurso para salvar a conferência:');
                  if (!contest) return;
                  const n = Number(contest);
                  if (!Number.isInteger(n) || n <= 0) {
                    alert('Número de concurso inválido.');
                    return;
                  }
                  const res = await fetch('/api/loterias/mega-sena/games/save-check', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ setId, draw: parsedDraw, contest: n }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    alert(data?.error || 'Falha ao salvar conferência.');
                  } else {
                    alert(`Conferência salva! Concurso ${n}, ${data.total} jogos registrados.`);
                  }
                }}
              >
                Salvar
              </button>
              <button
                type='button'
                className='rounded-md border border-black-30 px-3 py-1 text-sm hover:bg-white/5 text-red-300'
                onClick={async () => {
                  if (!window.confirm('Tem certeza que deseja excluir TODAS as suas conferências salvas?')) return;
                  if (!window.confirm('Confirma novamente? Esta ação não pode ser desfeita.')) return;
                  const res = await fetch('/api/loterias/mega-sena/games/delete-checks', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({}), // remove todas as conferências do usuário logado
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    alert(data?.error || 'Falha ao remover conferências.');
                  } else {
                    alert(`Conferências removidas: ${data.deleted ?? 0}.`);
                  }
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

      {/* Resultados */}
      <div className='mt-4 rounded-md border border-white/10'>
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
                    <td className='py-2 pr-3'>( {it.position} )</td>
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
    </section>
  );
}
