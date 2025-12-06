import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const listIds: string[] = Array.isArray(body?.listIds) ? body.listIds : [];
  if (!listIds.length)
    return NextResponse.json({ error: 'No listIds' }, { status: 400 });
  const { error } = await supabase
    .from('quina_bet_lists')
    .delete()
    .in('id', listIds)
    .eq('user_id', user.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: listIds.length });
}
