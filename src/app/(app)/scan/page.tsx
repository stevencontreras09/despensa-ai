import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ScanContainer } from './ScanContainer';

export default async function ScanPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener hogar del usuario
  const { data: memberRecord } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!memberRecord) {
    redirect('/setup-household');
  }

  // Obtener zonas de almacenamiento
  const { data: storageLocations } = await supabase
    .from('storage_locations')
    .select('*')
    .eq('household_id', memberRecord.household_id)
    .order('name');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white">
          Ingesta Inteligente de Compras
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Sube la foto del ticket o dicta los productos por voz. Gemini 2.5 Flash procesará todo en segundos.
        </p>
      </div>

      <ScanContainer
        householdId={memberRecord.household_id}
        storageLocations={storageLocations || []}
      />
    </div>
  );
}
