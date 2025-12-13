'use client';

import { useState } from 'react';
import { TextInput } from '@/components/text-input';
import { useDialog } from '@/components/dialog';
import { Button } from '@/components/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export function ResetPasswordContent() {
  const dialog = useDialog();
  const [emailValid, setEmailValid] = useState(false);
  const [forceValidate, setForceValidate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const supabase = createSupabaseBrowserClient();

  return (
    <div className='space-y-3'>
      <p>Informe seu e-mail e enviaremos um link para redefinição.</p>
      <TextInput
        id='reset-password-email'
        type='email'
        validatable='email'
        placeholder='seu@email.com'
        onValidChange={setEmailValid}
        forceValidate={forceValidate}
      />
      {error ? <div className='text-[12px] text-red-500'>{error}</div> : null}
      {sent ? (
        <div className='text-[12px] text-green-400'>
          E-mail enviado com sucesso. Verifique sua caixa de entrada.
        </div>
      ) : null}
      <div className='flex justify-end'>
        <Button
          type='button'
          intent='gold'
          size='sm'
          disabled={loading}
          onClick={async () => {
            if (sent) {
              dialog.close();
              return;
            }
            if (!emailValid) {
              setForceValidate(true);
              return;
            }
            const input = document.getElementById(
              'reset-password-email',
            ) as HTMLInputElement | null;
            const email = (input?.value ?? '').trim();
            if (!email) {
              setForceValidate(true);
              return;
            }
            try {
              setLoading(true);
              setError(null);
              const origin =
                typeof window !== 'undefined' ? window.location.origin : '';
              const redirectTo = `${origin}/auth/definir-senha?email=${encodeURIComponent(
                email,
              )}`;
              const { error: err } = await supabase.auth.resetPasswordForEmail(
                email,
                { redirectTo },
              );
              if (err) {
                setError(err.message);
                setLoading(false);
                return;
              }
              setSent(true);
              setLoading(false);
            } catch (e: unknown) {
              setError(
                e instanceof Error ? e.message : 'Falha ao solicitar redefinição.',
              );
              setLoading(false);
            }
          }}
        >
          {sent ? 'Fechar' : loading ? 'Enviando…' : 'Enviar'}
        </Button>
      </div>
    </div>
  );
}
