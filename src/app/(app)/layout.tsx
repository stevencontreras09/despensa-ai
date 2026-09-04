import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
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

    // Obtener membresía del hogar
    const { data: memberRecord } = await supabase
      .from('household_members')
      .select('household_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!memberRecord) {
      redirect('/setup-household');
    }

    // Obtener datos del hogar
    const { data: household } = await supabase
      .from('households')
      .select('id, name, invite_code')
      .eq('id', memberRecord.household_id)
      .single();

    if (!household) {
      redirect('/setup-household');
    }

    return (
      <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950">
        <AppHeader
          householdName={household.name}
          inviteCode={household.invite_code}
          userEmail={user.email || ''}
          userRole={memberRecord.role}
        />
        <PWAInstallPrompt />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-24">
          {children}
        </main>
        <BottomNav />
      </div>
    );
  } catch (err) {
    console.error('Error en AppLayout:', err);
    redirect('/login');
  }
}
