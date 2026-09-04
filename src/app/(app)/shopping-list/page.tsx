import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ShoppingListContainer } from './ShoppingListContainer';

export default async function ShoppingListPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
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

  // Obtener items de la lista de compras
  const { data: items } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('household_id', memberRecord.household_id)
    .order('is_purchased', { ascending: true })
    .order('created_at', { ascending: false });

  // Obtener zonas de almacenamiento para el reabastecimiento
  const { data: storageLocations } = await supabase
    .from('storage_locations')
    .select('*')
    .eq('household_id', memberRecord.household_id)
    .order('name');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white">
          Lista de Compras Inteligente
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Reabastecimiento asistido: los alimentos que agotas al cocinar se añaden aquí automáticamente.
        </p>
      </div>

      <ShoppingListContainer
        householdId={memberRecord.household_id}
        initialItems={items || []}
        storageLocations={storageLocations || []}
      />
    </div>
  );
}
