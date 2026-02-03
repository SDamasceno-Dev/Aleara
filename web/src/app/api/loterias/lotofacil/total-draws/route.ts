import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { count, error } = await supabase
    .from('lotofacil_draws')
    .select('concurso', { count: 'exact' });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ total: count ?? 0 });
}
