import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { calculateTrafficLight } from '@/lib/utils/traffic-light';
import { RecipesContainer } from './RecipesContainer';

export default async function RecipesPage() {
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

  // Obtener items activos de inventario
  const { data: rawItems } = await supabase
    .from('inventory_items')
    .select('id, name, quantity, unit, expiration_date, estimated_cost')
    .eq('household_id', memberRecord.household_id)
    .eq('status', 'active');

  const items = (rawItems || []).map((it) => {
    const tl = calculateTrafficLight(it.expiration_date);
    return {
      ...it,
      days_remaining: tl.days_remaining,
      traffic_light: tl.status,
      urgency_label: tl.urgency_label,
    };
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white">
          Motor de Recetas de Rescate
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Cocina anti-desperdicio con Gemini 3.7 Flash. Recetas optimizadas para vaciar los alimentos en riesgo.
        </p>
      </div>

      <RecipesContainer
        householdId={memberRecord.household_id}
        inventoryItems={items}
      />
    </div>
  );
}
