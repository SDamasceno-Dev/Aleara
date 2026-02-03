import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = (body ?? {}) as { setId?: unknown };
  const setId = String(parsed.setId ?? '');
  if (!setId)
    return NextResponse.json({ error: 'Missing setId' }, { status: 400 });

  // Verify ownership
  const { data: setData, error: setErr } = await supabase
    .from('lotofacil_user_sets')
    .select('id, user_id')
    .eq('id', setId)
    .single();
  if (setErr || !setData)
    return NextResponse.json({ error: 'Set not found' }, { status: 404 });
  if (setData.user_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Delete set (cascade will delete items)
  const { error: deleteErr } = await supabase
    .from('lotofacil_user_sets')
    .delete()
    .eq('id', setId);
  if (deleteErr)
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
