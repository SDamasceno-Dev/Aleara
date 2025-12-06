import { Tabs } from '@/components/tabs';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ImportCsvPanel } from './ImportCsvPanel';
import { DataPanel } from './DataPanel';
import GamesPanel from './GamesPanel';
import ReportsPanel from './ReportsPanel';

export default async function MegaSenaPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: isAdminData, error } = await supabase.rpc('is_admin');
  const isAdmin = !error && Boolean(isAdminData);

  const overview = <DataPanel />;

  const importPanel = <ImportCsvPanel />;

  const commonTabs = [
    { id: 'overview', label: 'Dados', content: overview },
    { id: 'games', label: 'Jogos', content: <GamesPanel /> },
    { id: 'reports', label: 'Relatórios', content: <ReportsPanel /> },
  ] as const;
  const tabs = isAdmin
    ? [
        ...commonTabs,
        { id: 'import', label: 'Importação', content: importPanel },
      ]
    : [...commonTabs];

  const sp = (await searchParams) ?? undefined;
  const requestedTab =
    sp && typeof sp.tab === 'string' ? (sp.tab as string) : null;
  const allowedIds = new Set(tabs.map((t) => t.id));
  const initialId =
    requestedTab && allowedIds.has(requestedTab) ? requestedTab : 'overview';

  return (
    <div className='flex-1 min-h-0 flex flex-col space-y-4'>
      <h1 className='text-xl font-semibold'>Mega-Sena</h1>
      <Tabs
        tabs={tabs}
        initialTabId={initialId}
        ariaLabel='Mega-Sena'
        refreshOnChange
        className='min-h-0 flex flex-col'
        tablistClassName='sticky top-0 z-10'
        panelsClassName='min-h-0 flex-1 overflow-y-auto scroll-y'
      />
    </div>
  );
}
