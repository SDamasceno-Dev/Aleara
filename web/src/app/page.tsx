'use client';

import Image from 'next/image';
import prismUrl from '@assets/prism.svg?url';
import googleIconUrl from '@assets/icons/google-icon-logo.svg?url';
import { useDialog } from '@/components/dialog';
import { ResetPasswordContent } from '@/components/dialog/reset-password-content';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function Home() {
	const dialog = useDialog();
	const router = useRouter();
  const supabase = createSupabaseBrowserClient();

	return (
    <div className='relative flex min-h-full items-center justify-center overflow-hidden'>
			{/* Content */}
      <div className='relative z-10 mx-auto w-full max-w-md px-4 py-10'>
        <div className='mb-8 flex flex-col items-center justify-center gap-3 text-center'>
          <Image
            src={prismUrl}
            alt='Aleara'
            width={256}
            height={256}
            priority
          />
          <p className='text-sm text-zinc-300/80'>
            Acesso exclusivo para membros
          </p>
				</div>

        <form className='space-y-4' onSubmit={(e) => e.preventDefault()}>
          <div className='input-frame input-gold rounded-md border bg-foreground px-3 py-2'>
						<input
              type='email'
              name='email'
              placeholder='E-mail'
              className='w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-500 focus:outline-none'
              autoComplete='email'
							required
						/>
					</div>
          <div className='input-frame input-gold rounded-md border bg-foreground px-3 py-2'>
						<input
              type='password'
              name='password'
              placeholder='Senha'
              className='w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-500 focus:outline-none'
              autoComplete='current-password'
							required
						/>
					</div>

          <div className='flex justify-center'>
						<button
              type='button'
							onClick={() =>
								dialog.open({
                  intent: 'alertInfo',
                  title: 'Redefinir senha',
									description: <ResetPasswordContent />,
								})
							}
              className='text-xs text-zinc-300/80 underline-offset-4 hover:underline'
						>
							Esqueceu sua senha?
						</button>
					</div>

					<button
            type='button'
						onClick={(e) => {
              const form = (e.currentTarget as HTMLButtonElement).closest(
                'form',
              ) as HTMLFormElement | null;
              if (form && !form.checkValidity()) {
                form.reportValidity();
                return;
              }
							try {
                localStorage.setItem('auth', '1');
                document.cookie = 'auth=1; path=/; SameSite=Lax';
							} catch {}
							router.push('/app');
						}}
            className='btn-gold mt-1 inline-flex h-11 w-full items-center justify-center rounded-md text-sm font-medium'
					>
						Entrar
					</button>
				</form>

        <div className='my-6 flex items-center gap-3 text-xs text-zinc-400/80'>
          <div className='h-px flex-1 bg-white/10' />
					<span>ou</span>
          <div className='h-px flex-1 bg-white/10' />
				</div>

        <div className='space-y-3'>
					<button
            type='button'
            onClick={async () => {
              const origin =
                typeof window !== 'undefined' ? window.location.origin : '';
              await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${origin}/auth/callback?next=/app` },
              });
            }}
            className='glass-dark inline-flex h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/5'
					>
            <Image src={googleIconUrl} alt='Google' width={16} height={16} />
						<span>Continuar com Google</span>
					</button>
          <div className='flex items-center justify-center gap-4 pt-4 text-xs text-zinc-400/90'>
            <a href='/sobre' className='hover:text-zinc-200'>
              Sobre
            </a>
            <span className='opacity-40'>•</span>
            <a href='/planos' className='hover:text-zinc-200'>
              Planos
            </a>
					</div>
				</div>
			</div>
		</div>
	);
}
