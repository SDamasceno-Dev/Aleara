import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = (body ?? {}) as { setId?: unknown };
  const setId = String(parsed.setId ?? '');
  if (!setId)
    return NextResponse.json({ error: 'setId is required' }, { status: 400 });

  const { error: delItemsErr } = await supabase
    .from('lotomania_user_items')
    .delete()
    .eq('set_id', setId);
  if (delItemsErr)
    return NextResponse.json({ error: delItemsErr.message }, { status: 500 });

  const { error: delSetErr } = await supabase
    .from('lotomania_user_sets')
    .delete()
    .eq('id', setId);
  if (delSetErr)
    return NextResponse.json({ error: delSetErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, deleted: 1 });
}
