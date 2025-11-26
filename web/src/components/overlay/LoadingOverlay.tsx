'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type LoadingOverlayProps = {
  show: boolean;
  message?: string;
  subtitle?: string;
};

export function LoadingOverlay({
  show,
  message = 'Processando…',
  subtitle,
}: LoadingOverlayProps) {
  // Lock page scroll while the overlay is visible
  useEffect(() => {
    if (!show) return;
    const { style } = document.documentElement;
    const prev = style.overflow;
    style.overflow = 'hidden';
    return () => {
      style.overflow = prev;
    };
  }, [show]);

  if (!show) return null;

  return createPortal(
    <div
      role='alertdialog'
      aria-modal='true'
      aria-live='assertive'
      className='fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm'
    >
      <div className='flex flex-col items-center justify-center gap-4 p-6 rounded-xl border border-[var(--white-10)] bg-[color-mix(in_oklab,_#0b0b0b_88%,_transparent)] shadow-xl'>
        <div className='relative h-[74px] w-[74px] grid place-items-center'>
          {/* outer pulse ring */}
          <div className='absolute inset-0 rounded-full border-2 border-[var(--wine)]/60 animate-pulse-slow' />
          {/* breathing logo */}
          <div className='translate-y-[-5px]'>
            <img
              src='/assets/Logo_Aleara.svg'
              alt='Carregando'
              className='h-12 w-12 animate-breathe select-none'
              draggable={false}
            />
          </div>
        </div>
        <div className='text-sm font-medium text-zinc-100'>{message}</div>
        {subtitle ? (
          <div className='text-xs text-zinc-400'>{subtitle}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
