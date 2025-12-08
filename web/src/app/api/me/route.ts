import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('user_id', user.id)
    .maybeSingle();
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const identities = Array.isArray(user.identities) ? user.identities : [];
  const firstIdentity =
    (identities[0] as unknown as {
      identity_data?: { name?: string; picture?: string } | null;
    }) ?? {};
  const provider =
    (typeof appMeta.provider === 'string' && appMeta.provider) || null;
  const fullNameFromMeta =
    (typeof userMeta.full_name === 'string' && userMeta.full_name) ||
    firstIdentity.identity_data?.name ||
    null;
  const avatarFromMeta =
    (typeof userMeta.avatar_url === 'string' && userMeta.avatar_url) ||
    firstIdentity.identity_data?.picture ||
    null;
  return NextResponse.json({
    authenticated: true,
    email: user.email,
    role: profile?.role ?? null,
    displayName: fullNameFromMeta ?? profile?.display_name ?? user.email,
    provider,
    avatarUrl: avatarFromMeta ?? null,
  });
}
