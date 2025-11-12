import type { DialogIntent } from './types';

export const dialogOverlay =
  'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity';

export const dialogContainer =
  'relative z-10 w-full max-w-md rounded-xl border bg-card-foreground p-0 shadow-2xl';

export const dialogHeaderBar =
  'relative rounded-t-xl px-5 py-3 text-center text-white';

export const intentStyles: Record<
  DialogIntent,
  { headerBg: string; border: string }
> = {
  alertError: {
    headerBg: 'bg-(--alertError)',
    border: 'border-(--alertError)',
  },
  alertWarning: {
    headerBg: 'bg-(--alertWarning)',
    border: 'border-(--alertWarning)',
  },
  alertSuccess: {
    headerBg: 'bg-(--alertSuccess)',
    border: 'border-(--alertSuccess)',
  },
  alertInfo: {
    headerBg: 'bg-(--alertInfo)',
    border: 'border-(--alertInfo)',
  },
  message: {
    headerBg: 'bg-(--wine)',
    border: 'border-(--wine)',
  },
};
