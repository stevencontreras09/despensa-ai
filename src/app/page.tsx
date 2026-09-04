import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Si aún no se configuró Supabase en Vercel, redirigir limpiamente al login
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    redirect('/login');
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data: memberRecord } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!memberRecord) {
      redirect('/setup-household');
    }

    redirect('/dashboard');
  } catch (err) {
    console.error('Error en HomePage:', err);
    redirect('/login');
  }
}
