import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error) return { ok: false as const, supabase, status: 500 };
  if (!isAdmin) return { ok: false as const, supabase, status: 403 };
  return { ok: true as const, supabase };
}

export async function DELETE() {
  const admin = await assertAdmin();
  if (!admin.ok)
    return NextResponse.json({ error: 'Forbidden' }, { status: admin.status });
  const supabase = admin.supabase;
  const { error } = await supabase
    .from('lotomania_draws')
    .delete()
    .neq('concurso', -1);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: 'all' });
}
