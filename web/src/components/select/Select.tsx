'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ArrowBigDown } from 'lucide-react';

export type SelectItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = {
  items: SelectItem[];
  value: string | null | undefined;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  buttonClassName?: string;
  listClassName?: string;
};

export function Select({
  items,
  value,
  placeholder = 'Selecione…',
  onChange,
  className,
  buttonClassName,
  listClassName,
}: SelectProps) {
  const compId = useId();
  const listboxId = `${compId}-listbox`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    const idx = items.findIndex((it) => it.value === value);
    return idx >= 0 ? idx : 0;
  });
  useEffect(() => {
    // Schedule to avoid synchronous state updates inside effect (React 19 guidance)
    let timer: number | null = null;
    const idx = items.findIndex((it) => it.value === value);
    if (idx >= 0) {
      timer = window.setTimeout(() => {
        setActiveIndex(idx);
      }, 0);
    }
    return () => {
      if (timer != null) window.clearTimeout(timer);
    };
  }, [value, items]);

  const label = useMemo(() => {
    const it = items.find((i) => i.value === value);
    return it?.label ?? placeholder;
  }, [items, value, placeholder]);

  // click outside to close
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc, { passive: true });
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const commitSelection = useCallback(
    (idx: number) => {
      const it = items[idx];
      if (!it || it.disabled) return;
      onChange(it.value);
      setOpen(false);
      // return focus to button for accessibility
      requestAnimationFrame(() => btnRef.current?.focus());
    },
    [items, onChange],
  );

  // keyboard handling
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        requestAnimationFrame(() => btnRef.current?.focus());
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => {
          let j = Math.min(items.length - 1, i + 1);
          while (j < items.length && items[j]?.disabled) j += 1;
          return j;
        });
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => {
          let j = Math.max(0, i - 1);
          while (j >= 0 && items[j]?.disabled) j -= 1;
          return Math.max(0, j);
        });
        return;
      }
      if (e.key === 'Home') {
        e.preventDefault();
        setActiveIndex(0);
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        setActiveIndex(items.length - 1);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        commitSelection(activeIndex);
        return;
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, items, activeIndex, commitSelection]);

  // ensure active option is scrolled into view when list opens or index changes
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const li = list?.querySelector<HTMLLIElement>(
      `[data-index="${activeIndex}"]`,
    );
    if (list && li) {
      const lTop = list.scrollTop;
      const lBot = lTop + list.clientHeight;
      const oTop = li.offsetTop;
      const oBot = oTop + li.offsetHeight;
      if (oTop < lTop) list.scrollTop = oTop;
      else if (oBot > lBot) list.scrollTop = oBot - list.clientHeight;
    }
  }, [open, activeIndex]);

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`.trim()}>
      <button
        ref={btnRef}
        type='button'
        role='combobox'
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup='listbox'
        className={`w-full rounded-md border border-black/30 bg-transparent px-2 py-1.5 text-left text-sm flex items-center justify-between text-zinc-200 focus:outline-none ${buttonClassName ?? ''}`.trim()}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className={value ? '' : 'text-zinc-500'}>{label}</span>
        <ArrowBigDown
          className='float-right opacity-70 text-zinc-300'
          size={14}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role='listbox'
          aria-activedescendant={`${listboxId}-opt-${activeIndex}`}
          className={`absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-md border border-black/30 bg-[rgb(15,15,15)] text-zinc-100 shadow-lg outline-none scroll-y ${listClassName ?? ''}`.trim()}
          tabIndex={-1}
        >
          {items.map((it, idx) => {
            const selected = value === it.value;
            const active = idx === activeIndex;
            const dimmed = !!it.disabled;
            return (
              <li
                key={it.value}
                id={`${listboxId}-opt-${idx}`}
                data-index={idx}
                role='option'
                aria-selected={selected}
                aria-disabled={dimmed || undefined}
                className={`px-2 py-1.5 text-sm cursor-pointer select-none ${active ? 'bg-white/10' : ''} ${selected ? 'font-medium' : ''} ${dimmed ? 'opacity-50 cursor-not-allowed' : ''}`.trim()}
                onMouseEnter={() => !dimmed && setActiveIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!dimmed) commitSelection(idx);
                }}
              >
                {it.label}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
