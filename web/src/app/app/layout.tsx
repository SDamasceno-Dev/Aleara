'use client';

import { Sidebar } from '@/components/sidebar';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import prismUrl from '@assets/prism.svg?url';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        const data = await res.json();
        if (!cancelled) {
          if (!data?.authenticated) {
            window.location.replace('/');
            return;
          }
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
            <div className='flex  items-center gap-3 '>
              <div className='leading-tight'>
                <div className='text-sm text-zinc-100'>Usuário</div>
                <div className='text-[10px] text-zinc-400/80'>Plano Free</div>
              </div>
              <div className='h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/80'>
                U
              </div>
            </div>
          </div>
          <div className='flex-1 min-h-0 overflow-y-auto'>{children}</div>
        </div>
      </div>
    </div>
  );
}
