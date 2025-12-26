import { Tabs } from '@/components/tabs';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ImportCsvPanel } from './ImportCsvPanel';
import { DataPanel } from './DataPanel';
import { GamesPanel } from './GamesPanel';
import ReportsPanel from './ReportsPanel';

export default async function QuinaPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  const isLogged = !!user;
  let isAdmin = false;
  if (isLogged) {
    const { data } = await supabase.rpc('is_admin');
    isAdmin = !!data;
  }
  const sp = (await searchParams) ?? undefined;
  const requestedTab =
    sp && typeof sp.tab === 'string' ? (sp.tab as string) : null;
  const overview = <DataPanel />;
  const commonTabs = [
    { id: 'overview', label: 'Dados', content: overview },
    { id: 'games', label: 'Jogos', content: <GamesPanel /> },
    { id: 'reports', label: 'Relatórios', content: <ReportsPanel /> },
  ] as const;
  const tabs = isAdmin
    ? [
        ...commonTabs,
        { id: 'import', label: 'Importação', content: <ImportCsvPanel /> },
      ]
    : [...commonTabs];
  const allowedIds = new Set(tabs.map((t) => t.id));
  const initialId =
    requestedTab && allowedIds.has(requestedTab) ? requestedTab : 'overview';
  return (
    <div className='flex-1 min-h-0 flex flex-col overflow-hidden'>
      <h1 className='text-lg font-semibold text-zinc-100 flex-shrink-0 pb-4'>Quina</h1>
      <Tabs
        tabs={tabs}
        initialTabId={initialId}
        ariaLabel='Quina'
        refreshOnChange
        className='min-h-0 flex-1 flex flex-col overflow-hidden'
        tablistClassName='flex-shrink-0'
        panelsClassName='min-h-0 flex-1 overflow-y-auto scroll-y'
      />
    </div>
  );
}
