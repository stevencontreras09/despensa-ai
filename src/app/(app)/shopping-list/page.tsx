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

  // Obtener items de la lista y zonas de almacenamiento en paralelo
  const [itemsRes, storageRes] = await Promise.all([
    supabase
      .from('shopping_list_items')
      .select('*')
      .eq('household_id', memberRecord.household_id)
      .order('is_purchased', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('storage_locations')
      .select('*')
      .eq('household_id', memberRecord.household_id)
      .order('name'),
  ]);

  const items = itemsRes.data || [];
  const storageLocations = storageRes.data || [];

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
