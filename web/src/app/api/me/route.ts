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
  return NextResponse.json({
    authenticated: true,
    email: user.email,
    role: profile?.role ?? null,
    displayName: profile?.display_name ?? null,
  });
}


