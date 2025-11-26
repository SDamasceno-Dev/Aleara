'use client';

import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/button';

type ImportCsvModalProps = {
  onDone: (summary: {
    invited: number;
    exists: number;
    errors: number;
  }) => void;
};

type ParsedEmail = {
  email: string;
  valid: boolean;
  line: number;
  raw: string;
};

const emailRe = /^[\w.!#$%&’*+/=?`{|}~^-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function ImportCsvModal({ onDone }: ImportCsvModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedEmail[]>([]);
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    invited: number;
    exists: number;
    errors: number;
  } | null>(null);
  const [problemRows, setProblemRows] = useState<
    Array<{
      line: number;
      raw: string;
      reason: 'invalid' | 'duplicate' | 'empty';
    }>
  >([]);

  const stats = useMemo(() => {
    const seen = new Set<string>();
    let valid = 0;
    let invalid = 0;
    let deduped = 0;
    const uniques: ParsedEmail[] = [];
    for (const p of parsed) {
      const lower = p.email.toLowerCase();
      if (seen.has(lower)) {
        deduped += 1;
        continue;
      }
      seen.add(lower);
      if (p.valid) valid += 1;
      else invalid += 1;
      uniques.push(p);
    }
    return { valid, invalid, deduped, uniques };
  }, [parsed]);

  function parseCsvText(text: string) {
    // very small parser: split lines, take 'email' column if header found, else first column
    const rawLines = text.split(/\r?\n/);
    const lines = rawLines.map((l) => l); // keep raw for reporting
    if (lines.length === 0) {
      setParsed([]);
      setProblemRows([]);
      return;
    }
    let startIdx = 0;
    let emailIdx = 0;
    const headerCols = lines[0]
      .split(',')
      .map((x) => x.trim().replace(/^"|"$/g, ''));
    if (headerCols.some((h) => h.toLowerCase() === 'email')) {
      emailIdx = headerCols.findIndex((h) => h.toLowerCase() === 'email');
      startIdx = 1;
    }
    const temp: ParsedEmail[] = [];
    const problems: Array<{
      line: number;
      raw: string;
      reason: 'invalid' | 'duplicate' | 'empty';
    }> = [];
    const seenRaw: Record<string, number> = {};
    for (let i = startIdx; i < lines.length; i += 1) {
      const raw = lines[i] ?? '';
      const trimmed = raw.trim();
      if (!trimmed) {
        problems.push({ line: i + 1, raw, reason: 'empty' });
        continue;
      }
      const cols = raw.split(',').map((x) => x.trim().replace(/^"|"$/g, ''));
      const email = (cols[emailIdx] ?? '').toLowerCase();
      const valid = emailRe.test(email);
      if (!valid) {
        problems.push({ line: i + 1, raw, reason: 'invalid' });
      }
      temp.push({ email, valid, line: i + 1, raw });
      if (email) {
        if (seenRaw[email]) {
          problems.push({ line: i + 1, raw, reason: 'duplicate' });
        } else {
          seenRaw[email] = i + 1;
        }
      }
    }
    setParsed(temp);
    setProblemRows(problems);
  }

  function onFileSelected(file: File) {
    setError(null);
    setSummary(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setRawText(text);
      parseCsvText(text);
    };
    reader.onerror = () => setError('Falha ao ler arquivo.');
    reader.readAsText(file);
  }

  async function runImport() {
    setProcessing(true);
    setError(null);
    setSummary(null);
    const emails = stats.uniques.filter((u) => u.valid).map((u) => u.email);
    const chunkSize = 50;
    let invited = 0;
    let exists = 0;
    let errors = 0;
    setProgress({ done: 0, total: Math.ceil(emails.length / chunkSize) });
    for (let i = 0; i < emails.length; i += chunkSize) {
      const chunk = emails.slice(i, i + chunkSize);
      try {
        const res = await fetch('/api/admin/users/invite-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ emails: chunk, role }),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          errors += chunk.length;
        } else {
          invited += Number(data.invited ?? 0);
          exists += Number(data.exists ?? 0);
          errors += Number(data.errors ?? 0);
        }
      } catch {
        errors += chunk.length;
      }
      setProgress((p) => ({ done: p.done + 1, total: p.total }));
    }
    const s = { invited, exists, errors };
    setSummary(s);
    onDone(s);
    setProcessing(false);
  }

  return (
    <div className='flex h-full flex-col gap-3'>
      <div>
        <div className='text-sm text-zinc-800'>Importar CSV de e-mails</div>
        <p className='text-xs text-zinc-600'>
          CSV com coluna <code>email</code> (ou primeira coluna como e-mail).
          Opção de papel abaixo.
        </p>
      </div>
      <div className='flex items-center gap-2'>
        <input
          ref={inputRef}
          type='file'
          placeholder='Selecione um arquivo CSV'
          accept='.csv,text/csv'
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileSelected(f);
          }}
          className='text-sm border border-[var(--black-30)] p-1 rounded-md cursor-pointer'
        />
        <div className='rounded-md border border-[var(--black-30)] p-1'>
          <select
            value={role}
            onChange={(e) =>
              setRole((e.target.value as 'USER' | 'ADMIN') ?? 'USER')
            }
            className='text-sm'
          >
            <option value='USER'>USER</option>
            <option value='ADMIN'>ADMIN</option>
          </select>
        </div>
        <Button
          type='button'
          intent='primary'
          size='sm'
          disabled={processing || stats.valid === 0}
          onClick={runImport}
        >
          {processing
            ? `Importando (${progress.done}/${progress.total})`
            : 'Iniciar importação'}
        </Button>
      </div>
      {rawText ? (
        <div className='text-xs text-zinc-700 space-y-2'>
          <div>
            Lidas {parsed.length} linhas • Válidos {stats.valid} • Inválidos{' '}
            {stats.invalid} • Duplicados ignorados {stats.deduped}
          </div>
          {problemRows.length > 0 ? (
            <div className='max-h-40 overflow-y-auto rounded-md border border-white/10 p-2 bg-white/5'>
              <div className='text-[11px] text-zinc-500 mb-1'>
                Linhas com problema (mostrando até 50):
              </div>
              <ul className='space-y-1'>
                {problemRows.slice(0, 50).map((p, idx) => (
                  <li
                    key={`${p.line}-${idx}`}
                    className='text-[11px] text-zinc-300'
                  >
                    <span className='text-zinc-500'>#{p.line}</span> —{' '}
                    {p.reason}:{' '}
                    <span className='text-zinc-200'>{p.raw || '(vazia)'}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      {error ? <div className='text-xs text-red-600'>{error}</div> : null}
      {summary ? (
        <div className='rounded-md border border-white/10 p-3 text-xs text-zinc-800'>
          Importação concluída: convidados {summary.invited}, já existentes{' '}
          {summary.exists}, erros {summary.errors}.
        </div>
      ) : null}
      <div className='mt-2 text-[11px] text-zinc-500'>
        Dica: gere um CSV com cabeçalho <code>email</code> para melhor
        compatibilidade.
      </div>
    </div>
  );
}
