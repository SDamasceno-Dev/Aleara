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
  const provider = (user.app_metadata as any)?.provider ?? null;
  const fullNameFromMeta =
    (user.user_metadata as any)?.full_name ??
    ((user.identities?.[0]?.identity_data as any)?.name ?? null);
  const avatarFromMeta =
    (user.user_metadata as any)?.avatar_url ??
    ((user.identities?.[0]?.identity_data as any)?.picture ?? null);
  return NextResponse.json({
    authenticated: true,
    email: user.email,
    role: profile?.role ?? null,
    displayName: fullNameFromMeta ?? profile?.display_name ?? user.email,
    provider,
    avatarUrl: avatarFromMeta ?? null,
  });
}


