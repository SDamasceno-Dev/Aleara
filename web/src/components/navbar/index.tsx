import Link from 'next/link';
import { navbarContainer, navbarLink, navbarRoot } from './styles';
import type { NavbarProps } from './types';

export function Navbar({ className }: NavbarProps) {
  return (
    <header className={`${navbarRoot} ${className ?? ''}`.trim()}>
      <div className={navbarContainer}>
        <Link href='/' className='inline-flex items-center gap-2'>
          <span className='inline-block h-6 w-6 rounded-md bg-primary' />
          <span className='text-base font-semibold tracking-tight'>Aleara</span>
        </Link>
        <nav className='flex items-center gap-3'>
          <Link
            href='#features'
            className={`hidden md:inline-block ${navbarLink}`}
          >
            Recursos
          </Link>
          <Link
            href='#precos'
            className={`hidden md:inline-block ${navbarLink}`}
          >
            Preços
          </Link>
          <Link href='/' className={navbarLink}>
            Entrar
          </Link>
          <Link
            href='/criar-conta'
            className='rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90'
          >
            Comece grátis
          </Link>
        </nav>
      </div>
    </header>
  );
}
