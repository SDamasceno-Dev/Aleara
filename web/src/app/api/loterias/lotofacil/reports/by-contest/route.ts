import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const contestNo = Number(url.searchParams.get('contest') ?? 0);

  if (!Number.isInteger(contestNo) || contestNo <= 0) {
    return NextResponse.json({ error: 'Invalid contest number' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('lotofacil_draws')
    .select('*')
    .eq('concurso', contestNo)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data)
    return NextResponse.json({ error: 'Contest not found' }, { status: 404 });

  return NextResponse.json({ draw: data });
}
