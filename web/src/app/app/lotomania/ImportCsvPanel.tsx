'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/button';
import { useRouter } from 'next/navigation';
import { LoadingOverlay } from '@/components/overlay/LoadingOverlay';

export function ImportCsvPanel() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState<string>('Processando…');
  const [confirmClear, setConfirmClear] = useState<0 | 1 | 2>(0);

  async function onFileSelected(file: File) {
    setFileName(file.name);
    setStatus(null);
  }

  async function runImport() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setStatus('Selecione um arquivo CSV primeiro.');
      return;
    }
    setBusyMsg('Processando importação da Lotomania…');
    setBusy(true);
    try {
      const text = await file.text();
      const res = await fetch('/api/loterias/lotomania/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      });
      let data: {
        error?: string;
        processed?: number;
        errors?: unknown[];
        imported?: number;
        updated?: number;
        skipped?: number;
      } = {};
      try {
        data = await res.json();
      } catch {
        try {
          const t = await res.text();
          data = { error: t };
        } catch {}
      }
      const meta =
        typeof data?.processed === 'number'
          ? ` processadas ${data.processed} linhas`
          : '';
      const errCount =
        Array.isArray(data?.errors) && data.errors.length
          ? `, erros ${data.errors.length}`
          : '';
      if (!res.ok) {
        setStatus(`${data?.error ?? 'Falha ao importar.'}${meta}${errCount}`);
        if (Array.isArray(data?.errors) && data.errors.length) {
          console.warn('Erros de parse (amostra):', data.errors.slice(0, 5));
        }
      } else {
        setStatus(
          `Importação concluída: inseridos ${data?.imported ?? 0}, atualizados ${data?.updated ?? 0}, ignorados ${
            data?.skipped ?? 0
          }.${meta}${errCount}`,
        );
        if (Array.isArray(data?.errors) && data.errors.length) {
          console.warn('Erros de parse (amostra):', data.errors.slice(0, 5));
        }
        router.refresh();
      }
    } catch {
      setStatus('Erro ao ler/enviar o arquivo.');
    } finally {
      setBusy(false);
    }
  }

  async function clearAll() {
    if (confirmClear === 0) {
      setConfirmClear(1);
      setStatus(
        'Confirma limpar toda a base da Lotomania? Clique novamente para confirmar.',
      );
      return;
    }
    if (confirmClear === 1) {
      setConfirmClear(2);
      setStatus(
        'Última confirmação: esta ação é permanente. Clique mais uma vez para prosseguir.',
      );
      return;
    }
    setBusyMsg('Limpando base da Lotomania…');
    setBusy(true);
    try {
      const res = await fetch('/api/loterias/lotomania/clear', {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data?.error ?? 'Falha ao limpar a base.');
      } else {
        setStatus('Base limpa com sucesso.');
        if (inputRef.current) inputRef.current.value = '';
        setFileName(null);
        router.refresh();
      }
    } catch {
      setStatus('Erro ao limpar a base.');
    } finally {
      setBusy(false);
      setConfirmClear(0);
    }
  }

  return (
    <section className='rounded-lg border border-[var(--black-30)] bg-[var(--black-20)] p-4 space-y-3'>
      <LoadingOverlay
        show={busy}
        message={busyMsg}
        subtitle='Isso pode levar alguns instantes.'
      />
      <div className='text-sm text-zinc-200'>
        Importação da base de sorteios — Lotomania
      </div>
      <p className='text-xs text-zinc-400'>
        Envie o CSV da Lotomania com o cabeçalho fornecido. A validação completa e a
        importação em lotes serão realizadas no servidor.
      </p>
      <div className='flex items-center gap-2 flex-wrap'>
        <input
          ref={inputRef}
          type='file'
          placeholder='Selecione um arquivo CSV'
          accept='.csv,text/csv'
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileSelected(f);
          }}
          className='text-sm border border-[var(--black-30)] p-1 rounded-md cursor-pointer bg-[var(--white-10)]'
        />
        <Button
          type='button'
          intent='primary'
          size='sm'
          disabled={busy}
          onClick={runImport}
        >
          {busy ? 'Enviando…' : 'Iniciar importação'}
        </Button>
        <Button
          type='button'
          intent='danger'
          variant='outline'
          size='sm'
          disabled={busy}
          onClick={clearAll}
        >
          {confirmClear === 0
            ? 'Limpar base'
            : confirmClear === 1
              ? 'Confirmar limpeza'
              : 'Confirmar (final)'}
        </Button>
      </div>
      <div className='text-xs text-zinc-500'>
        {fileName
          ? `Arquivo selecionado: ${fileName}`
          : 'Nenhum arquivo selecionado'}
      </div>
      <div role='status' aria-live='polite' className='text-xs text-zinc-300'>
        {status}
      </div>
    </section>
  );
}
