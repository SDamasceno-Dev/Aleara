import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }
  const setId = body?.setId ? String(body.setId) : null;

  // Always scope deletions to the current user to satisfy "WHERE" requirement
  let builder = supabase
    .from('megasena_checks')
    .delete({ count: 'exact' })
    .eq('user_id', user.id);
  if (setId) builder = builder.eq('set_id', setId);
  const { error, count } = await builder;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: count ?? 0 });
}
