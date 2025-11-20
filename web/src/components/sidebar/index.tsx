'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Home,
  TicketPercent,
  History,
  Settings,
  LogOut,
  Coins,
  LayoutDashboard,
} from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
const itemBase =
  'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-300/90 hover:text-white hover:bg-white/10 transition-colors';

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
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
  const currentLottery = (() => {
    const m = pathname?.match(/^\/app\/([^/]+)/);
    return m ? m[1] : '';
  })();
  const [selectedLottery, setSelectedLottery] = useState<string>('');

  useEffect(() => {
    try {
      const isLotteryRoute = lotterySlugs.some((l) => l.slug === currentLottery);
      // When outside lottery routes, reset selection to placeholder
      setSelectedLottery(isLotteryRoute ? currentLottery : '');
    } catch {
      setSelectedLottery(currentLottery);
    }
  }, [currentLottery]);

  return (
    <div className='flex flex-col items-center gap-2'>
      <Image src='/assets/prism.svg' alt='Aleara' width={64} height={64} priority />
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
              <div className='glass-dark rounded-md border px-2 py-1.5'>
                <select
                  id='lottery'
                  value={selectedLottery}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) {
                      setSelectedLottery(v);
                      try {
                        localStorage.setItem('lastLottery', v);
                      } catch {}
                      if (pathname !== `/app/${v}`) router.push(`/app/${v}`);
                    }
                  }}
                  className='bg-transparent text-sm text-zinc-100 outline-none w-full'
                >
                  <option value='' disabled>
                    Escolha a loteria
                  </option>
                  {lotterySlugs.map((l) => (
                    <option key={l.slug} value={l.slug}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
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
            <Link href='/app/apostas' className={itemBase}>
              <TicketPercent className='h-4 w-4' /> Apostas
            </Link>
            <Link href='/app/historico' className={itemBase}>
              <History className='h-4 w-4' /> Histórico
            </Link>
            <Link href='/app/configuracoes' className={itemBase}>
              <Settings className='h-4 w-4' /> Configurações
            </Link>
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
