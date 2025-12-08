'use client';

import { useMemo, useRef, useState } from 'react';
import { TextInput } from '@/components/text-input';
import { Button } from '@/components/button';
import { useDialog } from '@/components/dialog';
import { ImportCsvModal } from './ImportCsvModal';

type UsersPanelProps = {
  initialUsers?: string[];
};

export function UsersPanel({ initialUsers }: UsersPanelProps) {
  const dialog = useDialog();
  const [emailValid, setEmailValid] = useState(false);
  const [forceValidate, setForceValidate] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);

  const [, setSelected] = useState<Record<string, boolean>>({});
  return (
    <div className='space-y-6'>
      {/* Adicionar usuário */}
      <section className='rounded-md border border-white/10 p-4'>
        <div className='flex flex-col gap-1'>
          <h2 className='text-sm font-medium text-zinc-100'>
            Adicionar usuário
          </h2>
          <p className='text-xs text-zinc-400'>
            Inclua um e-mail autorizado a acessar o sistema.
          </p>
        </div>
        <div className='mt-4 grid gap-3 sm:grid-cols-[1fr_auto]'>
          <TextInput
            id='admin-users-add-email'
            placeholder='email@exemplo.com'
            type='email'
            validatable='email'
            onValidChange={(v) => setEmailValid(v)}
            forceValidate={forceValidate}
            className='sm:col-span-1'
          />
          <div className='sm:col-span-1 flex items-start'>
            <Button
              type='button'
              intent='primary'
              variant='solid'
              className='w-full sm:w-auto'
              onClick={async () => {
                setForceValidate(true);
                if (!emailValid) {
                  setStatus('Informe um e-mail válido.');
                  liveRef.current?.focus();
                  return;
                }
                const input = document.getElementById(
                  'admin-users-add-email',
                ) as HTMLInputElement | null;
                const newEmail = input?.value.trim().toLowerCase() ?? '';
                if (!newEmail) {
                  setStatus('Informe um e-mail válido.');
                  liveRef.current?.focus();
                  return;
                }
                try {
                  // Reutiliza o endpoint de convite em lote para um único e-mail
                  const res = await fetch('/api/admin/users/invite-batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emails: [newEmail], role: 'USER' }),
                    credentials: 'include',
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    setStatus(data?.error ?? 'Falha ao enviar convite.');
                  } else {
                    const invited = Number(data?.invited ?? 0);
                    const exists = Number(data?.exists ?? 0);
                    const errors = Number(data?.errors ?? 0);
                    if (invited > 0) {
                      setStatus('Convite enviado com sucesso.');
                    } else if (exists > 0) {
                      setStatus('Usuário já existe. Convite não enviado.');
                    } else if (errors > 0) {
                      setStatus('Falha ao enviar convite.');
                    } else {
                      setStatus('Operação concluída.');
                    }
                  }
                } catch {
                  setStatus('Falha de rede ao enviar convite.');
                }
                liveRef.current?.focus();
                if (input) input.value = '';
                setEmailValid(false);
                setForceValidate(false);
              }}
            >
              Adicionar
            </Button>
          </div>
        </div>
        <div
          ref={liveRef}
          role='status'
          aria-live='assertive'
          tabIndex={-1}
          className='mt-3 text-xs text-zinc-400'
        >
          {status}
        </div>
      </section>

      {/* Listagem e remoção */}
      <section className='rounded-md border border-white/10 p-4'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h2 className='text-sm font-medium text-zinc-100'>
              Usuários permitidos
            </h2>
            <p className='text-xs text-zinc-400'>
              Selecione para remover um ou mais e-mails.
            </p>
          </div>
          <div className='mt-2 sm:mt-0 flex items-center gap-2'>
            <Button
              type='button'
              intent='gold'
              variant='solid'
              size='sm'
              onClick={() => {
                dialog.open({
                  intent: 'message',
                  size: 'xl',
                  title: 'Importar CSV de usuários',
                  description: (
                    <ImportCsvModal
                      onDone={(s) => {
                        setStatus(
                          `Importação: convidados ${s.invited}, já existentes ${s.exists}, erros ${s.errors}.`,
                        );
                        requestAnimationFrame(() => liveRef.current?.focus());
                        dialog.close();
                      }}
                    />
                  ),
                });
              }}
            >
              Importar CSV
            </Button>
            <Button
              type='button'
              intent='danger'
              variant='outline'
              size='sm'
              onClick={() => {
                dialog.open({
                  intent: 'message',
                  size: 'xl',
                  title: 'Remover usuários',
                  description: (
                    <RemovalModalContent
                      onConfirmRemove={(emails, removedCount, errorMsg) => {
                        setSelected({});
                        if (errorMsg) {
                          setStatus(errorMsg);
                        } else {
                          setStatus(`${removedCount} e-mail(s) removido(s).`);
                        }
                        requestAnimationFrame(() => {
                          liveRef.current?.focus();
                        });
                        dialog.close();
                      }}
                    />
                  ),
                });
              }}
            >
              Gerenciar remoção
            </Button>
          </div>
        </div>
        <div className='mt-4 text-xs text-zinc-400'>
          Para listas grandes, use “Gerenciar remoção” para pesquisar e remover
          em massa.
        </div>
      </section>
    </div>
  );
}

function RemovalModalContent({
  onConfirmRemove,
}: {
  onConfirmRemove: (
    emails: string[],
    removedCount: number,
    errorMsg?: string,
  ) => void;
}) {
  const [term, setTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [confirming, setConfirming] = useState(false);
  const canSearch = term.trim().length >= 3;
  const hasSearched = searchTerm != null;
  const allSelected = useMemo(
    () => results.length > 0 && results.every((u) => selected[u]),
    [results, selected],
  );
  const selectedCount = useMemo(
    () => results.filter((u) => selected[u]).length,
    [results, selected],
  );
  const [hardDelete, setHardDelete] = useState(false);

  async function runSearch(reset = true) {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('q', term.trim());
      params.set('limit', '50');
      if (!reset && nextCursor) params.set('cursor', nextCursor);
      const res = await fetch(`/api/admin/allowlist?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Falha ao buscar.');
      } else {
        const emails = ((data?.items ?? []) as Array<{ email: string }>).map(
          (i) => i.email,
        );
        setResults((prev) => (reset ? emails : [...prev, ...emails]));
        setNextCursor(data?.nextCursor ?? null);
        setSearchTerm(term);
        setSelected({});
        setConfirming(false);
      }
    } catch {
      setError('Falha de rede ao buscar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='relative flex flex-col h-full'>
      {/* Search area (fixed inside dialog content) */}
      <div className='border-b border-white/10 pb-3'>
        <div className='flex gap-2'>
          <input
            type='text'
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder='Pesquisar por parte do e-mail'
            className='h-11 w-full rounded-md border border-(--wine)/30 bg-transparent px-3 text-sm text-(--wine) placeholder:text-(--wine)/60 outline-none focus:ring-2 focus:ring-(--wine)/40 focus:border-(--wine)'
            aria-label='Pesquisar e-mails'
          />
          <Button
            type='button'
            intent='primary'
            disabled={!canSearch || loading}
            onClick={() => runSearch(true)}
          >
            {loading ? 'Buscando...' : 'Pesquisar'}
          </Button>
        </div>
        {!canSearch ? (
          <div className='mt-1 text-[11px] text-(--wine)/70'>
            Digite pelo menos 3 caracteres para pesquisar.
          </div>
        ) : null}
        {error ? (
          <div className='mt-1 text-[11px] text-red-600'>{error}</div>
        ) : null}
      </div>

      {/* Results list */}
      {/* Results area (only this area scrolls) */}
      <div className='mt-4 flex-1 min-h-0 overflow-y-auto'>
        {!hasSearched ? (
          <div className='text-xs text-zinc-500'>
            Digite um termo e clique em pesquisar.
          </div>
        ) : results.length === 0 ? (
          <div className='text-xs text-zinc-400'>Nenhum e-mail encontrado.</div>
        ) : (
          <ul className='divide-y divide-white/5 rounded-md border border-white/10 overflow-hidden'>
            {results.map((email) => (
              <li
                key={email}
                className='flex items-center justify-between gap-3 px-3 py-2 text-sm'
              >
                <label className='flex items-center gap-3 min-w-0 flex-1'>
                  <input
                    aria-label={`Selecionar ${email}`}
                    type='checkbox'
                    checked={!!selected[email]}
                    onChange={(e) =>
                      setSelected((prev) => ({
                        ...prev,
                        [email]: e.target.checked,
                      }))
                    }
                    className='h-4 w-4 rounded border-zinc-600 bg-transparent shrink-0'
                  />
                  <span className='truncate text-zinc-800'>{email}</span>
                </label>
                <Button
                  type='button'
                  intent='danger'
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setSelected({ [email]: true });
                    setConfirming(true);
                  }}
                >
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Sticky footer controls */}
      {/* Footer actions (fixed inside dialog content) */}
      {hasSearched && results.length > 0 ? (
        <div className='mt-4 border-t border-white/10 pt-3'>
          <div className='flex items-center justify-between gap-3 flex-nowrap'>
            <div className='flex items-center gap-3 flex-nowrap'>
              <label className='inline-flex items-center gap-2 text-xs text-zinc-600'>
                <input
                  type='checkbox'
                  checked={hardDelete}
                  onChange={(e) => setHardDelete(e.target.checked)}
                  className='h-4 w-4 rounded border-zinc-600 bg-transparent'
                />
                Excluir conta no Supabase (permanente)
              </label>
              {nextCursor ? (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => runSearch(false)}
                  disabled={loading}
                >
                  {loading ? 'Carregando…' : 'Carregar mais'}
                </Button>
              ) : null}
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                  const map = Object.fromEntries(results.map((u) => [u, true]));
                  setSelected(map);
                }}
              >
                Selecionar todos
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => setSelected({})}
              >
                Limpar todos
              </Button>
            </div>
            <div className='flex items-center gap-2 flex-nowrap'>
              {confirming ? (
                <>
                  <span className='text-xs text-zinc-600'>
                    Confirmar remoção de {selectedCount} selecionado(s)?
                  </span>
                  <Button
                    type='button'
                    intent='danger'
                    size='sm'
                    onClick={async () => {
                      const emails = results.filter((u) => selected[u]);
                      try {
                        const res = await fetch('/api/admin/users/delete', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ emails, hardDelete }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          onConfirmRemove(
                            emails,
                            0,
                            data?.error ?? 'Falha ao remover.',
                          );
                        } else {
                          const removedAllowed = Number(
                            data?.removedAllowed ?? 0,
                          );
                          const deletedUsers = Number(data?.deletedUsers ?? 0);
                          // remove da lista os removidos ou deletados
                          const removedSet = new Set(
                            (
                              (data?.results ?? []) as Array<{
                                email: string;
                                removedAllowed?: boolean;
                                deletedUser?: boolean;
                              }>
                            )
                              .filter((r) => r.removedAllowed || r.deletedUser)
                              .map((r) => r.email),
                          );
                          setResults((prev) =>
                            prev.filter((e) => !removedSet.has(e)),
                          );
                          setSelected({});
                          setConfirming(false);
                          onConfirmRemove(
                            emails,
                            deletedUsers || removedAllowed,
                          );
                        }
                      } catch {
                        onConfirmRemove(emails, 0, 'Falha de rede ao remover.');
                      }
                    }}
                  >
                    Remover selecionados
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => setConfirming(false)}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button
                  type='button'
                  intent='danger'
                  variant='outline'
                  size='sm'
                  disabled={selectedCount === 0}
                  onClick={() => setConfirming(true)}
                >
                  Remover selecionados ({selectedCount})
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
