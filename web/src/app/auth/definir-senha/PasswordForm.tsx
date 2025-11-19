'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

function validatePassword(pw: string): string | null {
  if (pw.length < 20) return 'A senha deve ter pelo menos 20 caracteres.';
  if (!/[A-Z]/.test(pw)) return 'Inclua pelo menos uma letra maiúscula.';
  if (!/[a-z]/.test(pw)) return 'Inclua pelo menos uma letra minúscula.';
  if (!/[0-9]/.test(pw)) return 'Inclua pelo menos um número.';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Inclua pelo menos um caractere especial.';
  return null;
}

export function PasswordForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus(null);
        const err = validatePassword(pw);
        if (err) {
          setStatus(err);
          return;
        }
        if (pw !== confirm) {
          setStatus('As senhas não coincidem.');
          return;
        }
        setSubmitting(true);
        try {
          const { error } = await supabase.auth.updateUser({ password: pw });
          if (error) {
            setStatus(error.message);
          } else {
            setStatus('Senha atualizada com sucesso. Redirecionando...');
            setTimeout(() => router.push('/app'), 600);
          }
        } catch {
          setStatus('Falha ao atualizar a senha.');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div>
        <label htmlFor="new-password" className="block text-sm text-zinc-100">
          Nova senha
        </label>
        <input
          id="new-password"
          type="password"
          className="mt-1 h-11 w-full rounded-md border border-zinc-400 bg-white px-3 text-sm text-black outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-(--wine)/40 focus:border-(--wine) block"
          style={{ backgroundColor: '#ffffff', color: '#000000', opacity: 1, visibility: 'visible' }}
          placeholder="Mínimo 20 caracteres, com especiais"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="new-password"
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm text-zinc-100">
          Confirmar senha
        </label>
        <input
          id="confirm-password"
          type="password"
          className="mt-1 h-11 w-full rounded-md border border-zinc-400 bg-white px-3 text-sm text-black outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-(--wine)/40 focus:border-(--wine) block"
          style={{ backgroundColor: '#ffffff', color: '#000000', opacity: 1, visibility: 'visible' }}
          placeholder="Repita a senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div role="status" aria-live="assertive" className="text-xs text-red-500">
        {status}
      </div>
      <div className="pt-1">
        <Button type="submit" intent="primary" disabled={submitting}>
          {submitting ? 'Salvando…' : 'Definir senha'}
        </Button>
      </div>
      <p className="text-[11px] text-zinc-500">
        Dica: use uma frase longa com espaços e símbolos para mais segurança.
      </p>
    </form>
  );
}


