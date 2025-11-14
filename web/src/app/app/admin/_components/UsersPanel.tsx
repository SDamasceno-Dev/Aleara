'use client';

import { useMemo, useRef, useState } from 'react';
import { TextInput } from '@/components/text-input';
import { Button } from '@/components/button';
import { useDialog } from '@/components/dialog';

type UsersPanelProps = {
  initialUsers?: string[];
};

export function UsersPanel({ initialUsers }: UsersPanelProps) {
  const dialog = useDialog();
  const [emailValid, setEmailValid] = useState(false);
  const [forceValidate, setForceValidate] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);

  const [users, setUsers] = useState<string[]>(
    initialUsers && initialUsers.length > 0
      ? initialUsers
      : [
          'ana.silva@example.com',
          'joao.souza@example.com',
          'maria.oliveira@example.com',
          'carlos.santos@example.com',
          'patricia.gomes@example.com',
          'rodrigo.melo@example.com',
          'fernanda.alves@example.com',
          'juliana.costa@example.com',
          'marcos.lima@example.com',
          'bianca.rocha@example.com',
          'eduardo.pereira@example.com',
          'aline.souza@example.com',
          'rafael.oliveira@example.com',
          'camila.silva@example.com',
          'lucas.ferreira@example.com',
          'leticia.martins@example.com',
          'vinicius.andrade@example.com',
          'renata.ramos@example.com',
          'daniel.cardoso@example.com',
          'sabrina.araujo@example.com',
          'thiago.barbosa@example.com',
          'sofia.teixeira@example.com',
          'arthur.pinto@example.com',
          'isabela.monteiro@example.com',
          'gustavo.moreira@example.com',
          'amanda.freitas@example.com',
          'ricardo.nunes@example.com',
          'carla.ribeiro@example.com',
          'felipe.duarte@example.com',
          'vanessa.cunha@example.com',
        ],
  );
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const allSelected = useMemo(
    () => users.length > 0 && users.every((u) => selected[u]),
    [users, selected],
  );
  const selectedCount = useMemo(
    () => users.filter((u) => selected[u]).length,
    [users, selected],
  );
  return (
    <div className="space-y-6">
      {/* Adicionar usuário */}
      <section className="rounded-md border border-white/10 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-zinc-100">Adicionar usuário</h2>
          <p className="text-xs text-zinc-400">
            Inclua um e-mail autorizado a acessar o sistema.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <TextInput
            id="admin-users-add-email"
            placeholder="email@exemplo.com"
            type="email"
            validatable="email"
            onValidChange={(v) => setEmailValid(v)}
            forceValidate={forceValidate}
            className="sm:col-span-1"
          />
          <div className="sm:col-span-1 flex items-start">
            <Button
              type="button"
              intent="primary"
              variant="solid"
              className="w-full sm:w-auto"
              onClick={() => {
                setForceValidate(true);
                if (!emailValid) {
                  setStatus('Informe um e-mail válido.');
                  liveRef.current?.focus();
                  return;
                }
                // Layout-first: simulando adição local
                const input = document.getElementById(
                  'admin-users-add-email',
                ) as HTMLInputElement | null;
                const newEmail = input?.value.trim().toLowerCase() ?? '';
                if (!newEmail) {
                  setStatus('Informe um e-mail válido.');
                  liveRef.current?.focus();
                  return;
                }
                if (users.includes(newEmail)) {
                  setStatus('Este e-mail já está na lista.');
                  liveRef.current?.focus();
                  return;
                }
                setUsers((prev) => [newEmail, ...prev]);
                setSelected((prev) => ({ ...prev, [newEmail]: false }));
                setStatus('E-mail adicionado (somente layout — não persistido).');
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
          role="status"
          aria-live="assertive"
          tabIndex={-1}
          className="mt-3 text-xs text-zinc-400"
        >
          {status}
        </div>
      </section>

      {/* Listagem e remoção */}
      <section className="rounded-md border border-white/10 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-100">Usuários permitidos</h2>
            <p className="text-xs text-zinc-400">
              Selecione para remover um ou mais e-mails.
            </p>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center gap-2">
            <Button
              type="button"
              intent="danger"
              variant="outline"
              size="sm"
              onClick={() => {
                dialog.open({
                  intent: 'message',
                  size: 'xl',
                  title: 'Remover usuários',
                  description: (
                    <RemovalModalContent
                      users={users}
                      onConfirmRemove={(emails) => {
                        const toRemove = new Set(emails);
                        setUsers((prev) => prev.filter((u) => !toRemove.has(u)));
                        setSelected({});
                        setStatus(
                          `${emails.length} e-mail(s) removido(s) (somente layout — não persistido).`,
                        );
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
        <div className="mt-4 text-xs text-zinc-400">
          Para listas grandes, use “Gerenciar remoção” para pesquisar e remover em massa.
        </div>
      </section>
    </div>
  );
}

function RemovalModalContent({
  users,
  onConfirmRemove,
}: {
  users: string[];
  onConfirmRemove: (emails: string[]) => void;
}) {
  const [term, setTerm] = useState('');
  // searchTerm is the committed term used for the last executed search.
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [confirming, setConfirming] = useState(false);
  const canSearch = term.trim().length >= 3;
  const hasSearched = searchTerm != null;
  const results = useMemo(() => {
    const t = (searchTerm ?? '').trim().toLowerCase();
    if (!hasSearched || t.length < 3) return [];
    return users.filter((u) => u.toLowerCase().includes(t));
  }, [searchTerm, hasSearched, users]);
  const allSelected = useMemo(
    () => results.length > 0 && results.every((u) => selected[u]),
    [results, selected],
  );
  const selectedCount = useMemo(
    () => results.filter((u) => selected[u]).length,
    [results, selected],
  );

  return (
    <div className="relative flex flex-col h-full">
      {/* Search area (fixed inside dialog content) */}
      <div className="border-b border-white/10 pb-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Pesquisar por parte do e-mail"
            className="h-11 w-full rounded-md border border-(--wine)/30 bg-transparent px-3 text-sm text-(--wine) placeholder:text-(--wine)/60 outline-none focus:ring-2 focus:ring-(--wine)/40 focus:border-(--wine)"
            aria-label="Pesquisar e-mails"
          />
          <Button
            type="button"
            intent="primary"
            disabled={!canSearch}
            onClick={() => {
              if (!canSearch) return;
              // Commit the current term; keep previous results until a new search is committed.
              setSearchTerm(term);
              setConfirming(false);
              setSelected({});
            }}
          >
            Pesquisar
          </Button>
        </div>
        {!canSearch ? (
          <div className="mt-1 text-[11px] text-(--wine)/70">
            Digite pelo menos 3 caracteres para pesquisar.
          </div>
        ) : null}
      </div>

      {/* Results list */}
      {/* Results area (only this area scrolls) */}
      <div className="mt-4 flex-1 min-h-0 overflow-y-auto">
        {!hasSearched ? (
          <div className="text-xs text-zinc-500">Digite um termo e clique em pesquisar.</div>
        ) : results.length === 0 ? (
          <div className="text-xs text-zinc-400">Nenhum e-mail encontrado.</div>
        ) : (
          <ul className="divide-y divide-white/5 rounded-md border border-white/10 overflow-hidden">
            {results.map((email) => (
              <li
                key={email}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <label className="flex items-center gap-3 min-w-0 flex-1">
                  <input
                    aria-label={`Selecionar ${email}`}
                    type="checkbox"
                    checked={!!selected[email]}
                    onChange={(e) =>
                      setSelected((prev) => ({ ...prev, [email]: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-zinc-600 bg-transparent shrink-0"
                  />
                  <span className="truncate text-zinc-800">{email}</span>
                </label>
                <Button
                  type="button"
                  intent="danger"
                  variant="ghost"
                  size="sm"
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
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between gap-3 flex-nowrap">
            <div className="flex items-center gap-3 flex-nowrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const map = Object.fromEntries(results.map((u) => [u, true]));
                  setSelected(map);
                }}
              >
                Selecionar todos
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelected({})}
              >
                Limpar todos
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-nowrap">
              {confirming ? (
                <>
                  <span className="text-xs text-zinc-600">
                    Confirmar remoção de {selectedCount} selecionado(s)?
                  </span>
                  <Button
                    type="button"
                    intent="danger"
                    size="sm"
                    onClick={() => {
                      const emails = results.filter((u) => selected[u]);
                      onConfirmRemove(emails);
                    }}
                  >
                    Remover selecionados
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirming(false)}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  intent="danger"
                  variant="outline"
                  size="sm"
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


