'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Home, LogOut, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Select } from '@/components/select/Select';
const itemBase =
  'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-300/90 hover:text-white hover:bg-white/10 transition-colors';

const lotterySlugs = [
  { slug: 'mega-sena', label: 'Mega-Sena' },
  { slug: 'quina', label: 'Quina' },
  { slug: 'dupla-sena', label: 'Dupla Sena' },
  { slug: 'lotofacil', label: 'Lotofácil' },
  { slug: 'lotomania', label: 'Lotomania' },
  { slug: 'dia-de-sorte', label: 'Dia de Sorte' },
  { slug: 'super-sete', label: 'Super Sete' },
  { slug: 'timemania', label: 'Timemania' },
  { slug: 'federal', label: 'Federal' },
  { slug: 'mais-milionaria', label: '+Milionária' },
];

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLottery = (() => {
    const m = pathname?.match(/^\/app\/([^/]+)/);
    return m ? m[1] : '';
  })();
  const [selectedLottery, setSelectedLottery] = useState<string>('');

  useEffect(() => {
    let timer: number | null = null;
    try {
      const isLotteryRoute = lotterySlugs.some(
        (l) => l.slug === currentLottery,
      );
      const next = isLotteryRoute ? currentLottery : '';
      timer = window.setTimeout(() => {
        setSelectedLottery(next);
      }, 0);
    } catch {
      timer = window.setTimeout(() => {
        setSelectedLottery(currentLottery);
      }, 0);
    }
    return () => {
      if (timer != null) window.clearTimeout(timer);
    };
  }, [currentLottery]);

  return (
    <div className='flex flex-col items-center gap-2'>
      <Image
        src='/assets/Logo_Aleara.svg'
        alt='Aleara'
        width={64}
        height={64}
        priority
      />
      <aside className='w-56 rounded-lg overflow-hidden'>
        <nav className='flex p-2 flex-col bg-black/20 h-[calc(100vh-13rem)]'>
          <div className='space-y-1'>
            <Link href='/app' className={itemBase}>
              <LayoutDashboard className='h-4 w-4' /> Dashboard
            </Link>
            <div className='mt-3 text-xs uppercase tracking-wide text-zinc-500'>
              Loterias
            </div>
            <div className='mb-2'>
              <label htmlFor='lottery' className='sr-only'>
                Selecionar loteria
              </label>
              <Select
                theme='light'
                items={[
                  { value: '', label: 'Escolha a loteria', disabled: true },
                  ...lotterySlugs.map((l) => ({
                    value: l.slug,
                    label: l.label,
                  })),
                ]}
                value={selectedLottery || ''}
                onChange={(v) => {
                  if (!v) return;
                  setSelectedLottery(v);
                  try {
                    localStorage.setItem('lastLottery', v);
                  } catch {}
                  if (pathname !== `/app/${v}`) router.push(`/app/${v}`);
                }}
                className='glass-dark border'
              />
            </div>
          </div>
          <div className='mt-6 space-y-1'>
            {isAdmin ? (
              <>
                <div className='mt-3 text-xs uppercase tracking-wide text-zinc-500'>
                  Administração
                </div>
                <Link href='/app/admin' className={itemBase}>
                  <Home className='h-4 w-4' /> Área Privada
                </Link>
              </>
            ) : null}
          </div>
          <div className='mt-auto pt-2'>
            <form method='post' action='/auth/signout'>
              <button className={`${itemBase} w-full`} type='submit'>
                <LogOut className='h-4 w-4' /> Sair do app
              </button>
            </form>
          </div>
        </nav>
      </aside>
    </div>
  );
}
