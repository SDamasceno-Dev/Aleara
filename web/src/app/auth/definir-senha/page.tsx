'use client';

import { useEffect, useState } from 'react';
import { PasswordForm } from './PasswordForm';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function DefinirSenhaPage() {
  const supabase = createSupabaseBrowserClient();
  const [status, setStatus] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState<string>('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        // Debug: log initial URL context
        try {
          // eslint-disable-next-line no-console
          console.log('[definir-senha] mount href=', typeof window !== 'undefined' ? window.location.href : '(no-window)');
        } catch {}
        // Accept both hash and query-style callbacks
        const hasWindow = typeof window !== 'undefined';
        const hash = hasWindow ? window.location.hash : '';
        const search = hasWindow ? window.location.search : '';
        const parse = (s: string) => new URLSearchParams(s.startsWith('#') || s.startsWith('?') ? s.slice(1) : s);

        if (hash || search) {
          const hashParams = hash ? parse(hash) : new URLSearchParams();
          const qsParams = search ? parse(search) : new URLSearchParams();
          const params = hashParams.size > 0 ? hashParams : qsParams;
          const emailParam = params.get('email') || qsParams.get('email');
          if (emailParam && !cancelled) setEmail(emailParam);
          const err = params.get('error_description') || params.get('error');
          if (err && !cancelled) {
            setStatus(decodeURIComponent(err.replace(/\+/g, ' ')));
          }
          const access_token = params.get('access_token') || qsParams.get('access_token');
          const refresh_token = params.get('refresh_token') || qsParams.get('refresh_token');
          const code = params.get('code') || qsParams.get('code');
          const tokenHash = qsParams.get('token') || params.get('token'); // from verify?token=...&type=...
          const tokenType = qsParams.get('type') || params.get('type');
          try {
            // eslint-disable-next-line no-console
            console.log('[definir-senha] params', {
              hasHash: !!hash,
              hasSearch: !!search,
              access_token: !!access_token,
              refresh_token: !!refresh_token,
              code: !!code,
              tokenHash: !!tokenHash,
              tokenType: tokenType || '(empty)',
              emailParam,
            });
          } catch {}

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error && !cancelled) {
              setStatus(error.message);
              try {
                // eslint-disable-next-line no-console
                console.log('[definir-senha] setSession error', error.message);
              } catch {}
            } else {
              if (!cancelled) {
                setAuthed(true);
                // Clean the hash from the URL for aesthetics
                try {
                  window.history.replaceState({}, '', window.location.pathname);
                } catch {}
                try {
                  // eslint-disable-next-line no-console
                  console.log('[definir-senha] setSession OK -> authed');
                } catch {}
              }
            }
          } else if (code) {
            // For PKCE/magic link, exchange expects full URL (with code/state)
            const href = hasWindow ? window.location.href : code;
            const { error } = await supabase.auth.exchangeCodeForSession(href);
            if (error && !cancelled) setStatus(error.message);
            const { data } = await supabase.auth.getUser();
            if (!cancelled) setAuthed(!!data.user);
            try {
              // eslint-disable-next-line no-console
              console.log('[definir-senha] exchangeCodeForSession', { error: error?.message, authed: !!data.user });
            } catch {}
          } else if (tokenHash) {
            // Handle verify links that redirect with token (& optional type)
            const candidates = (tokenType && tokenType.length > 0)
              ? [tokenType]
              : ['signup', 'invite', 'magiclink', 'recovery', 'email_change'];
            let lastErr: string | null = null;
            for (const t of candidates) {
              // Try token_hash first (email link), then token+email (OTP format)
              let attemptErr: string | null = null;
              const byHash = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: t as any,
              });
              if (!byHash.error) {
                lastErr = null;
                try { console.log('[definir-senha] verifyOtp OK with type', t, 'via token_hash'); } catch {}
                break;
              } else {
                attemptErr = byHash.error.message;
                // Try with token + email
                const tokenPayload: any = {
                  token: tokenHash,
                  type: t as any,
                };
                if (emailParam) tokenPayload.email = emailParam;
                const byToken = await supabase.auth.verifyOtp(tokenPayload);
                if (!byToken.error) {
                  lastErr = null;
                  try { console.log('[definir-senha] verifyOtp OK with type', t, 'via token+email'); } catch {}
                  break;
                } else {
                  attemptErr = byToken.error.message;
                }
              }
              lastErr = attemptErr;
              try {
                // eslint-disable-next-line no-console
                console.log('[definir-senha] verifyOtp failed', t, attemptErr);
              } catch {}
            }
            if (lastErr && !cancelled) setStatus(lastErr);
            const { data } = await supabase.auth.getUser();
            if (!cancelled) setAuthed(!!data.user);
            try {
              // eslint-disable-next-line no-console
              console.log('[definir-senha] after verifyOtp authed=', !!data.user, 'status=', lastErr);
            } catch {}
          }
        }
        const { data } = await supabase.auth.getUser();
        if (!cancelled) setAuthed(!!data.user);
        try {
          // eslint-disable-next-line no-console
          console.log('[definir-senha] final authed=', !!data.user);
        } catch {}
      } catch (e: any) {
        if (!cancelled) setStatus(String(e?.message ?? e));
        try {
          // eslint-disable-next-line no-console
          console.log('[definir-senha] error', e);
        } catch {}
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-lg font-semibold text-zinc-100">Definir senha</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Crie sua senha de acesso. Ela deve ter pelo menos 20 caracteres e incluir caracteres
        especiais.
      </p>
      <div className="mt-4 rounded-md border border-white/10 bg-card-foreground p-4 relative z-50">
        {!ready ? (
          <div className="text-sm text-zinc-300">Preparando…</div>
        ) : authed ? (
          <PasswordForm />
        ) : (
          <div className="space-y-3 text-sm text-zinc-300">
            <div>Link inválido ou expirado.</div>
            <div className="space-y-2">
              <label htmlFor="invite-email" className="block text-xs text-zinc-400">
                Informe seu e-mail para reenviar o convite
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="h-11 w-full rounded-md border border-white/20 bg-white/5 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-(--wine)/40 focus:border-(--wine)"
              />
              <button
                type="button"
                disabled={resending || !email}
                onClick={async () => {
                  setResending(true);
                  setStatus(null);
                  try {
                    const res = await fetch('/api/auth/resend-invite', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      setStatus(data?.error ?? 'Falha ao reenviar convite.');
                    } else {
                      setStatus('Convite reenviado. Verifique seu e-mail.');
                    }
                  } catch {
                    setStatus('Falha de rede ao reenviar convite.');
                  } finally {
                    setResending(false);
                  }
                }}
                className="inline-flex items-center justify-center rounded-md bg-(--wine) px-4 py-2 text-sm text-white hover:opacity-95 disabled:opacity-60"
              >
                {resending ? 'Reenviando…' : 'Reenviar convite'}
              </button>
              <div className="text-xs text-zinc-500">ou</div>
              <button
                type="button"
                disabled={!email}
                onClick={async () => {
                  setStatus(null);
                  try {
                    const redirectTo =
                      (typeof window !== 'undefined'
                        ? `${window.location.origin}/auth/definir-senha?email=${encodeURIComponent(
                            email,
                          )}`
                        : `/auth/definir-senha?email=${encodeURIComponent(email)}`);
                    const { error } = await supabase.auth.signInWithOtp({
                      email,
                      options: { emailRedirectTo: redirectTo },
                    });
                    if (error) {
                      setStatus(error.message);
                    } else {
                      setStatus('Magic link enviado. Verifique seu e-mail.');
                    }
                  } catch {
                    setStatus('Falha ao enviar magic link.');
                  }
                }}
                className="inline-flex items-center justify-center rounded-md border border-white/20 px-4 py-2 text-sm text-zinc-100 hover:bg-white/10 disabled:opacity-60"
              >
                Enviar link de acesso (magic link)
              </button>
            </div>
          </div>
        )}
        {status ? (
          <div className="mt-2 text-xs text-red-500" role="alert" aria-live="assertive">
            {status}
          </div>
        ) : null}
      </div>
    </div>
  );
}


