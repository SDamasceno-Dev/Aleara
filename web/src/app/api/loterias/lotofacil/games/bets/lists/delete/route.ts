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
  const parsed = (body ?? {}) as { listIds?: unknown };
  const listIds = Array.isArray(parsed.listIds)
    ? (parsed.listIds as unknown[]).map((x) => String(x))
    : [];

  if (listIds.length === 0) {
    return NextResponse.json({ error: 'No listIds provided' }, { status: 400 });
  }

  // Delete lists (cascade will delete items)
  const { data, error } = await supabase
    .from('lotofacil_bet_lists')
    .delete()
    .eq('user_id', user.id)
    .in('id', listIds)
    .select('id');

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: data?.length ?? 0 });
}
