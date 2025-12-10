import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = (body ?? {}) as {
    setId?: unknown;
    title?: unknown;
    markedIdx?: unknown;
  };
  const setId = String(parsed.setId ?? '');
  const title =
    typeof parsed.title === 'string' ? parsed.title.trim() : undefined;
  const markedIdx =
    parsed.markedIdx == null ? null : Number(parsed.markedIdx as number);
  if (!setId || !title)
    return NextResponse.json({ error: 'setId and title are required' }, { status: 400 });

  const { error } = await supabase
    .from('quina_user_sets')
    .update({ title, marked_idx: markedIdx })
    .eq('id', setId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


