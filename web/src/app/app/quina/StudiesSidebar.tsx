'use client';

import { useEffect, useState } from 'react';

type CatalogItem = { study_key: string; title: string };
type StudyItem = { rank: number; item_key: string; value: number; extra?: any };

export function StudiesSidebar() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studyTitle, setStudyTitle] = useState<string>('');
  const [items, setItems] = useState<StudyItem[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/loterias/quina/studies');
      const data = await res.json();
      setCatalog(data?.catalog ?? []);
    })();
  }, []);

  async function loadStudy(key: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/loterias/quina/studies?study_key=${encodeURIComponent(key)}&limit=60`);
      const data = await res.json();
      setStudyTitle(data?.study?.title ?? key);
      setItems(data?.items ?? []);
      setOpen(true);
      setSelected('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className='rounded-lg border border-border/60 bg-card/90 p-4 md:w-1/2'>
      <div className='text-sm text-zinc-200 mb-2'>Estudos</div>
      <select
        value={selected}
        onChange={(e) => {
          const v = e.target.value;
          if (v) loadStudy(v);
        }}
        className='w-full rounded-md border border-black-30 bg-white-10 px-2 py-1.5 text-sm text-zinc-100'
      >
        <option value=''>Escolha uma opção</option>
        {catalog.map((c) => (
          <option key={c.study_key} value={c.study_key}>
            {c.title}
          </option>
        ))}
      </select>
      {open ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <button
            aria-label='Fechar'
            onClick={() => setOpen(false)}
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
          />
          <div className='relative z-10 max-w-[80vw] w-[82vw] max-h-[82vh] bg-white text-zinc-900 rounded-md shadow-xl overflow-hidden flex flex-col border border-black/10'>
            <div className='px-5 py-3 border-b border-black/10 bg-white sticky top-0 z-10'>
              <h2 className='text-sm font-semibold tracking-wider'>{studyTitle}</h2>
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
                        <tr key={it.item_key} className='border-t border-black/10 hover:bg-[var(--black-10)] cursor-pointer'>
                          <td className='py-2 pl-3 pr-3 text-zinc-600'>{it.rank}</td>
                          <td className='py-2 pr-3 font-medium'>{String(it.item_key).replace(/^.*?:/, '')}</td>
                          <td className='py-2 pr-3 text-right text-zinc-700'>{it.value}</td>
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


