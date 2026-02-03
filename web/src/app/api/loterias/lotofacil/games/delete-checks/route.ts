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
    body = {};
  }
  const parsed = (body ?? {}) as { setId?: unknown };
  const setId = parsed.setId ? String(parsed.setId) : null;

  // Delete all checks for user (optionally filtered by setId)
  let query = supabase
    .from('lotofacil_checks')
    .delete()
    .eq('user_id', user.id);
  if (setId) {
    query = query.eq('set_id', setId);
  }
  const { data, error } = await query.select('id');
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    deleted: data?.length ?? 0,
  });
}
