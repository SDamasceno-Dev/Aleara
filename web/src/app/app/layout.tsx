'use client';

import { Sidebar } from '@/components/sidebar';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<{
    email: string | null;
    role: 'ADMIN' | 'USER' | null;
    displayName: string | null;
    avatarUrl: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        const data = await res.json();
        if (!cancelled) {
          if (!data?.authenticated) {
            window.location.replace('/');
            return;
          }
          setMe({
            email: data?.email ?? null,
            role: data?.role ?? null,
            displayName: data?.displayName ?? null,
            avatarUrl: data?.avatarUrl ?? null,
          });
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          window.location.replace('/');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  return (
    <div className='relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-6'>
      <div className='flex flex-1 min-h-0 gap-4 items-stretch'>
        <Sidebar />
        <div className='flex-1 min-h-0 flex flex-col'>
          <div className='flex flex-row justify-end pb-4'>
            <div className='flex items-center gap-3 '>
              <div className='leading-tight text-right'>
                <div className='text-sm text-zinc-100'>
                  {me?.displayName || me?.email || 'Usuário'}
                </div>
                <div className='text-[10px] text-zinc-400/80'>
                  {me?.role === 'ADMIN' ? 'Admin' : 'Plano standard'}
                </div>
              </div>
              {me?.avatarUrl ? (
                <Image
                  src={me.avatarUrl}
                  alt='Avatar'
                  width={40}
                  height={40}
                  className='h-10 w-10 rounded-full object-cover'
                />
              ) : (
                <div className='h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/80'>
                  {(me?.displayName || me?.email || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className='flex-1 min-h-0 overflow-y-auto'>{children}</div>
        </div>
      </div>
    </div>
  );
}
