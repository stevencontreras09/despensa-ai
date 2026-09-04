import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InventoryContainer } from './InventoryContainer';

export default async function InventoryPage() {
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

  // Obtener ubicaciones
  const { data: storageLocations } = await supabase
    .from('storage_locations')
    .select('*')
    .eq('household_id', memberRecord.household_id)
    .order('name');

  // Obtener items activos de inventario
  const { data: rawItems } = await supabase
    .from('inventory_items')
    .select('id, household_id, name, quantity, unit, expiration_date, estimated_cost, storage_location_id, status')
    .eq('household_id', memberRecord.household_id)
    .eq('status', 'active')
    .order('expiration_date', { ascending: true });

  const locationMap = new Map<string, any>();
  (storageLocations || []).forEach((loc) => {
    locationMap.set(loc.id, loc);
  });

  const items = (rawItems || []).map((it) => ({
    ...it,
    storage_location: locationMap.get(it.storage_location_id) || null,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white">
            Inventario de la Despensa
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Monitorea el semáforo de urgencia y registra consumos o descartes con 1 toque
          </p>
        </div>
      </div>

      <InventoryContainer
        householdId={memberRecord.household_id}
        initialItems={items}
        storageLocations={storageLocations || []}
      />
    </div>
  );
}
