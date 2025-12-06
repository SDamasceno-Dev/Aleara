import { footerContainer, footerLink, footerRoot } from './styles';
import { getAppVersion } from '@/lib/version';
import type { FooterProps } from './types';

export function Footer({ className }: FooterProps) {
  const { version, rev } = getAppVersion();
  return (
    <footer className={`${footerRoot} ${className ?? ''}`.trim()}>
      <div className={footerContainer}>
        <p>© 2025 Aleara. Todos os direitos reservados.</p>
        <div className='flex items-center gap-4'>
          {version ? (
            <span className='text-[11px] text-zinc-400'>
              v{version}
              {rev ? ` • ${rev}` : ''}
            </span>
          ) : null}
          <a className={footerLink} href='/privacidade'>
            Privacidade
          </a>
          <a className={footerLink} href='/termos'>
            Termos
          </a>
        </div>
      </div>
    </footer>
  );
}
