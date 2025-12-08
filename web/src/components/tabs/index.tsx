'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type TabConfig = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type TabsProps = {
  tabs: TabConfig[];
  initialTabId?: string;
  ariaLabel?: string;
  className?: string;
  refreshOnChange?: boolean;
  paramName?: string;
  tablistClassName?: string;
  panelsClassName?: string;
};

export function Tabs({
  tabs,
  initialTabId,
  ariaLabel = 'Abas',
  className,
  refreshOnChange = false,
  paramName = 'tab',
  tablistClassName,
  panelsClassName,
}: TabsProps) {
  const baseId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeId, setActiveId] = useState<string>(() => {
    if (initialTabId && tabs.some((t) => t.id === initialTabId))
      return initialTabId;
    return tabs[0]?.id ?? '';
  });

  useEffect(() => {
    if (initialTabId && tabs.some((t) => t.id === initialTabId)) {
      const timer = window.setTimeout(() => {
        setActiveId(initialTabId);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [initialTabId, tabs]);

  const activeIndex = useMemo(
    () =>
      Math.max(
        0,
        tabs.findIndex((t) => t.id === activeId),
      ),
    [activeId, tabs],
  );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  if (!tabs.length) return null;

  return (
    <div className={`min-h-0 flex flex-col ${className ?? ''}`}>
      <div
        role='tablist'
        aria-label={ariaLabel}
        className={`flex items-center gap-2 border-b border-white/10 ${tablistClassName ?? ''}`}
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeId;
          const tabId = `${baseId}-tab-${tab.id}`;
          const panelId = `${baseId}-panel-${tab.id}`;
          return (
            <button
              key={tab.id}
              id={tabId}
              role='tab'
              aria-selected={isActive}
              aria-controls={panelId}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              className={`px-3 py-2 text-xs sm:text-sm rounded-t-md border-b-2 ${
                isActive
                  ? 'border-[var(--color-primary)] text-zinc-100'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
              onClick={() => {
                setActiveId(tab.id);
                if (refreshOnChange) {
                  const sp = new URLSearchParams(
                    searchParams?.toString() ?? '',
                  );
                  sp.set(paramName, tab.id);
                  router.replace(`?${sp.toString()}`);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  const next = (activeIndex + 1) % tabs.length;
                  setActiveId(tabs[next].id);
                  tabRefs.current[next]?.focus();
                  if (refreshOnChange) {
                    const sp = new URLSearchParams(
                      searchParams?.toString() ?? '',
                    );
                    sp.set(paramName, tabs[next].id);
                    router.replace(`?${sp.toString()}`);
                  }
                } else if (e.key === 'ArrowLeft') {
                  const prev = (activeIndex - 1 + tabs.length) % tabs.length;
                  setActiveId(tabs[prev].id);
                  tabRefs.current[prev]?.focus();
                  if (refreshOnChange) {
                    const sp = new URLSearchParams(
                      searchParams?.toString() ?? '',
                    );
                    sp.set(paramName, tabs[prev].id);
                    router.replace(`?${sp.toString()}`);
                  }
                }
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className={panelsClassName}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          const panelId = `${baseId}-panel-${tab.id}`;
          const tabId = `${baseId}-tab-${tab.id}`;
          return (
            <div
              key={tab.id}
              id={panelId}
              role='tabpanel'
              aria-labelledby={tabId}
              hidden={!isActive}
              className='pt-4'
            >
              {isActive ? tab.content : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
