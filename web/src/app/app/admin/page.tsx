import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Tabs } from '@/components/tabs';
import { UsersPanel } from './_components/UsersPanel';

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
  if (rpcError) {
    // If we cannot verify, deny by default
    redirect('/app');
  }
  if (!isAdmin) {
    redirect('/app');
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  const { data: profile } = userId
    ? await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('user_id', userId)
        .maybeSingle()
    : { data: null as any };

  return (
    <div className='p-4 space-y-2'>
      <h1 className='text-lg font-semibold'>Área Privada (Admin)</h1>
      <p className='text-sm text-zinc-400'>
        Bem-vindo, {profile?.display_name || userData.user?.email} — papel:{' '}
        {profile?.role || 'ADMIN'}
      </p>
      <div className='mt-4'>
        <Tabs
          tabs={[
            {
              id: 'users',
              label: 'Usuários',
              content: <UsersPanel />,
            },
            {
              id: 'reports',
              label: 'Relatórios',
              content: (
                <div className='rounded-md border border-white/10 p-4 text-sm text-zinc-300'>
                  Em breve: relatórios e visões administrativas.
                </div>
              ),
            },
            {
              id: 'settings',
              label: 'Configurações',
              content: (
                <div className='rounded-md border border-white/10 p-4 text-sm text-zinc-300'>
                  Em breve: preferências e ajustes do painel.
                </div>
              ),
            },
          ]}
          initialTabId='users'
        />
      </div>
    </div>
  );
}
