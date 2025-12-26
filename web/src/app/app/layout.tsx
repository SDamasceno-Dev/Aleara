import { Sidebar } from '@/components/sidebar';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    redirect('/');
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('user_id', user.id)
    .maybeSingle();
  const role = (profile?.role as 'ADMIN' | 'USER' | null) ?? null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const identities = Array.isArray(user.identities) ? user.identities : [];
  const firstIdentity =
    (identities[0] as unknown as {
      identity_data?: { name?: string; picture?: string } | null;
    }) ?? {};
  const displayName =
    (typeof meta.full_name === 'string' && (meta.full_name as string)) ||
    (firstIdentity?.identity_data?.name as string | undefined) ||
    (profile?.display_name as string | undefined) ||
    (user.email as string | undefined) ||
    'Usuário';
  const avatarUrl =
    (typeof meta.avatar_url === 'string' && (meta.avatar_url as string)) ||
    (firstIdentity?.identity_data?.picture as string | undefined) ||
    null;

  return (
    <div className='relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-6 overflow-hidden'>
      <div className='flex flex-1 min-h-0 gap-4 items-stretch overflow-hidden'>
        <Sidebar isAdmin={role === 'ADMIN'} />
        <div className='flex-1 min-h-0 flex flex-col overflow-hidden'>
          <div className='flex flex-row justify-end pb-4 flex-shrink-0'>
            <div className='flex items-center gap-3 '>
              <div className='leading-tight text-right'>
                <div className='text-sm text-zinc-100'>
                  {displayName || 'Usuário'}
                </div>
                <div className='text-[10px] text-zinc-400/80'>
                  {role === 'ADMIN' ? 'Admin' : 'Plano standard'}
                </div>
              </div>
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt='Avatar'
                  width={40}
                  height={40}
                  className='h-10 w-10 rounded-full object-cover'
                />
              ) : (
                <div className='h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/80'>
                  {(displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className='flex-1 min-h-0 flex flex-col overflow-hidden'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
