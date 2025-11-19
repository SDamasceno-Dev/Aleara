'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type {
  DialogContextValue,
  DialogIntent,
  DialogOpenInput,
  DialogState,
} from './types';
import {
  dialogContainer,
  dialogHeaderBar,
  dialogOverlay,
  intentStyles,
} from './styles';

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return ctx;
}

export function DialogProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [state, setState] = useState<DialogState>({
    open: false,
    intent: 'message',
  });
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  function close() {
    setState((s) => ({ ...s, open: false }));
    state.onClose?.();
  }

  function open(input: DialogOpenInput) {
    setState({
      open: true,
      intent: input.intent,
      title: input.title,
      description: input.description,
      actions: input.actions,
      onClose: input.onClose,
      size: input.size,
    });
  }

  useEffect(() => {
    if (state.open) {
      previouslyFocusedRef.current =
        (document.activeElement as HTMLElement) ?? null;
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
        // restore focus to previously focused element
        previouslyFocusedRef.current?.focus?.();
      };
    }
  }, [state.open]);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <DialogRoot state={state} close={close} />
    </DialogContext.Provider>
  );
}

function DialogRoot({
  state,
  close,
}: {
  state: DialogState;
  close: () => void;
}) {
  const styles = intentStyles[state.intent as DialogIntent];
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // focus the first focusable element or the container
    const focusables = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    (focusables[0] ?? container).focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'Tab') {
        const list = Array.from(focusables).filter(
          (el) => el.offsetParent !== null,
        );
        if (list.length === 0) {
          e.preventDefault();
          return;
        }
        const active = document.activeElement as HTMLElement | null;
        const currentIndex = active ? list.indexOf(active) : -1;
        if (e.shiftKey) {
          // backwards
          const idx = currentIndex <= 0 ? list.length - 1 : currentIndex - 1;
          e.preventDefault();
          list[idx].focus();
        } else {
          // forwards
          const idx = currentIndex === list.length - 1 ? 0 : currentIndex + 1;
          e.preventDefault();
          list[idx].focus();
        }
      }
    }
    container.addEventListener('keydown', onKeyDown);
    return () => container.removeEventListener('keydown', onKeyDown);
  }, [state.open, close]);

  return (
    <>
      {/* Static placeholder keeps tree stable across SSR/CSR */}
      <div data-dialog-root-placeholder aria-hidden />
      {typeof document !== 'undefined' && state.open
        ? createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* overlay */}
      <button
        aria-label='Fechar'
        onClick={close}
        className={dialogOverlay}
        aria-hidden='true'
        tabIndex={-1}
      />
      {/* content */}
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='dialog-title'
        aria-describedby='dialog-description'
                className={`${dialogContainer} ${styles.border} ${
                  state.size === 'xl'
                    ? 'min-w-[80vw] w-[82vw] max-w-[96vw] h-[80vh]'
                    : 'max-w-md'
                } flex flex-col`}
        ref={containerRef}
        tabIndex={-1}
      >
        <div className={`${dialogHeaderBar} ${styles.headerBg}`}>
          <h2
            id='dialog-title'
            className='text-xs font-semibold tracking-widest'
          >
                    {state.title ?? 'AVISO'}
          </h2>
          <button
            onClick={close}
            className='absolute right-2 top-1.5 rounded-md p-1 text-white/90 hover:bg-white/15'
            aria-label='Fechar diálogo'
          >
            <svg viewBox='0 0 24 24' className='h-4 w-4' aria-hidden='true'>
              <path
                d='M6 6l12 12M18 6L6 18'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
              />
            </svg>
          </button>
        </div>
        <div
          id='dialog-description'
                  className='px-5 py-4 text-sm text-zinc-700 flex-1 min-h-0 overflow-hidden'
        >
          {typeof state.description === 'string' ? (
            <p>{state.description}</p>
          ) : (
            state.description
          )}
        </div>
      </div>
    </div>,
    document.body,
          )
        : null}
    </>
  );
}

export * from './types';
