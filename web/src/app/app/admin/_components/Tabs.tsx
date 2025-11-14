'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

type TabConfig = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type TabsProps = {
  tabs: TabConfig[];
  initialTabId?: string;
  className?: string;
};

export function Tabs({ tabs, initialTabId, className }: TabsProps) {
  const baseId = useId();
  const [activeId, setActiveId] = useState<string>(() => {
    if (initialTabId && tabs.some((t) => t.id === initialTabId)) return initialTabId;
    return tabs[0]?.id ?? '';
  });

  useEffect(() => {
    if (initialTabId && tabs.some((t) => t.id === initialTabId)) {
      setActiveId(initialTabId);
    }
  }, [initialTabId, tabs]);

  const activeIndex = useMemo(
    () => Math.max(0, tabs.findIndex((t) => t.id === activeId)),
    [activeId, tabs],
  );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  if (!tabs.length) return null;

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Ferramentas administrativas"
        className="flex items-center gap-2 border-b border-white/10"
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeId;
          const tabId = `${baseId}-tab-${tab.id}`;
          const panelId = `${baseId}-panel-${tab.id}`;
          return (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[idx] = el)}
              id={tabId}
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              className={[
                'px-3 py-2 text-sm rounded-t-md outline-none transition-colors',
                isActive ? 'text-zinc-100 bg-white/5' : 'text-zinc-400 hover:text-zinc-200',
              ].join(' ')}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const dir = e.key === 'ArrowRight' ? 1 : -1;
                  const nextIndex = (activeIndex + dir + tabs.length) % tabs.length;
                  setActiveId(tabs[nextIndex].id);
                  requestAnimationFrame(() => {
                    tabRefs.current[nextIndex]?.focus();
                  });
                }
                if (e.key === 'Home') {
                  e.preventDefault();
                  setActiveId(tabs[0].id);
                  requestAnimationFrame(() => {
                    tabRefs.current[0]?.focus();
                  });
                }
                if (e.key === 'End') {
                  e.preventDefault();
                  setActiveId(tabs[tabs.length - 1].id);
                  requestAnimationFrame(() => {
                    tabRefs.current[tabs.length - 1]?.focus();
                  });
                }
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const panelId = `${baseId}-panel-${tab.id}`;
        const tabId = `${baseId}-tab-${tab.id}`;
        return (
          <div
            key={tab.id}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!isActive}
            className="pt-4"
          >
            {isActive ? tab.content : null}
          </div>
        );
      })}
    </div>
  );
}


