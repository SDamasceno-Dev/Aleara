'use client';

import { useEffect, useMemo, useState } from 'react';
import { Select } from '@/components/select/Select';

type StudyPreview = {
  study_key: string;
  title: string;
  items: Array<{
    item_key: string;
    rank: number;
    value: number;
    extra?: Record<string, unknown>;
  }>;
};

export function StudiesSidebar({
  previews,
  allStudies,
}: {
  previews: StudyPreview[];
  allStudies: Array<{ study_key: string; title: string }>;
}) {
  const [selected, setSelected] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studyTitle, setStudyTitle] = useState<string>('');
  const [items, setItems] = useState<
    Array<{ rank: number; item_key: string; value: number }>
  >([]);

  const mapTitle = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of allStudies) m.set(s.study_key, s.title);
    return m;
  }, [allStudies]);

  async function loadStudy(key: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/loterias/quina/studies?study_key=${encodeURIComponent(
          key,
        )}&limit=60`,
      );
      const data = await res.json();
      setStudyTitle(data?.study?.title ?? key);
      setItems(
        ((data?.items ?? []) as Array<{
          rank: number;
          item_key: string;
          value: number;
        }>) ?? [],
      );
      setOpen(true);
      setSelected('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className='rounded-lg border border-border/60 bg-card/90 p-4 md:w-1/2'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <div className='text-sm text-zinc-200'>Estudos</div>
        <div className='min-w-0'>
          <Select
            theme='light'
            items={allStudies.map((s) => ({
              value: s.study_key,
              label: s.title,
            }))}
            value={selected}
            placeholder='Escolha uma opção'
            onChange={(v) => {
              setSelected(v);
              if (v) loadStudy(v);
            }}
          />
        </div>
      </div>
      <div className='space-y-4'>
        {previews
          .filter((p) => (p.items?.length ?? 0) > 0)
          .map((p) => (
            <div
              key={p.study_key}
              className='rounded-md border border-white/10 p-3'
            >
              <div className='text-sm text-zinc-400 mb-2'>{p.title}</div>
              <ul className='text-sm text-zinc-300/90 space-y-1'>
                {p.items.slice(0, 5).map((it) => (
                  <li
                    key={it.item_key}
                    className='flex items-center justify-between'
                  >
                    <span>{`${String(it.item_key).replace(/^.*?:/, '')} • ${it.value}`}</span>
                    <span className='text-zinc-500'>#{it.rank}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>

      {open ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <button
            aria-label='Fechar'
            onClick={() => setOpen(false)}
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
          />
          <div className='relative z-10 max-w-[80vw] w-[82vw] max-h-[82vh] bg-white text-zinc-900 rounded-md shadow-xl overflow-hidden flex flex-col border border-black/10'>
            <div className='px-5 py-3 border-b border-black/10 bg-white sticky top-0 z-10'>
              <h2 className='text-sm font-semibold tracking-wider'>
                {studyTitle}
              </h2>
            </div>
            <div className='px-5 py-4 flex-1 min-h-0 overflow-hidden'>
              {loading ? (
                <div className='text-sm text-zinc-500'>Carregando…</div>
              ) : items.length === 0 ? (
                <div className='text-sm text-zinc-500'>Sem dados.</div>
              ) : (
                <div className='max-h-[60vh] overflow-y-auto overflow-x-auto scroll-y rounded-md border border-black/10'>
                  <table className='min-w-full text-sm'>
                    <thead className='sticky top-0 bg-white text-zinc-700 shadow-sm'>
                      <tr className='text-left'>
                        <th className='py-2 pl-3 pr-3 w-12'>#</th>
                        <th className='py-2 pr-3'>Item</th>
                        <th className='py-2 pr-3 w-24 text-right'>Valor</th>
                      </tr>
                    </thead>
                    <tbody className='text-zinc-900'>
                      {items.map((it) => (
                        <tr
                          key={it.item_key}
                          className='border-t border-black/10 hover:bg-black-10 cursor-pointer'
                        >
                          <td className='py-2 pl-3 pr-3 text-zinc-600'>
                            {it.rank}
                          </td>
                          <td className='py-2 pr-3 font-medium'>
                            {String(it.item_key).replace(/^.*?:/, '')}
                          </td>
                          <td className='py-2 pr-3 text-right text-zinc-700'>
                            {it.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className='px-5 py-3 border-t border-black/10 bg-white flex items-center justify-end'>
              <button
                type='button'
                className='rounded-md border border-black/10 px-3 py-1 text-sm hover:bg-black/5'
                onClick={() => setOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
