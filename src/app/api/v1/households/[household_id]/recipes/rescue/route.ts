import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rescueRecipesRequestSchema } from '@/lib/validations/recipes';
import { generateRescueRecipesWithGemini } from '@/lib/gemini/recipe-generator';
import { calculateTrafficLight } from '@/lib/utils/traffic-light';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ household_id: string }> }
) {
  const { household_id } = await context.params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Verificar pertenencia al hogar
  const { data: isMember } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', household_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!isMember) {
    return NextResponse.json({ error: 'Acceso denegado a este hogar' }, { status: 403 });
  }

  try {
    const rawBody = await request.json().catch(() => ({}));
    const parsed = rescueRecipesRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros de búsqueda de recetas inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { expiring_within_days, max_prep_time_minutes, excluded_item_ids, dietary_preferences } =
      parsed.data;

    // Obtener inventario activo del hogar
    const { data: rawItems, error: itemsError } = await supabase
      .from('inventory_items')
      .select('id, name, quantity, unit, expiration_date, estimated_cost')
      .eq('household_id', household_id)
      .eq('status', 'active');

    if (itemsError) {
      return NextResponse.json(
        { error: `Error al consultar el inventario: ${itemsError.message}` },
        { status: 500 }
      );
    }

    if (!rawItems || rawItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay productos activos en tu despensa para crear recetas.',
        recipes: [],
      });
    }

    // Calcular días restantes y filtrar excluidos
    const enriched = rawItems
      .filter((it) => !excluded_item_ids.includes(it.id))
      .map((it) => {
        const tl = calculateTrafficLight(it.expiration_date);
        return {
          id: it.id,
          name: it.name,
          quantity: Number(it.quantity),
          unit: it.unit,
          expiration_date: it.expiration_date,
          days_remaining: tl.days_remaining,
          traffic_light: tl.status,
        };
      })
      // Priorizar productos críticos (menor días_remaining)
      .sort((a, b) => a.days_remaining - b.days_remaining);

    // Filtrar los que están dentro del rango (o si todos vencen más tarde, pasar los más antiguos)
    const candidates = enriched.filter((i) => i.days_remaining <= expiring_within_days);
    const itemsForAI = candidates.length > 0 ? candidates : enriched.slice(0, 8);

    const recipesResult = await generateRescueRecipesWithGemini({
      inventoryItems: itemsForAI,
      maxPrepTimeMinutes: max_prep_time_minutes,
      dietaryPreferences: dietary_preferences,
    });

    return NextResponse.json({
      success: true,
      total_items_considered: itemsForAI.length,
      recipes: recipesResult.recipes || [],
    });
  } catch (err: any) {
    console.error('Error generando recetas de rescate:', err);
    let errorMessage = err.message || 'Error en el servidor al formular recetas';
    try {
      const parsed = JSON.parse(errorMessage);
      if (parsed?.error?.message) {
        errorMessage = parsed.error.message;
      }
    } catch {
      // no es JSON
    }

    if (
      errorMessage.includes('503') ||
      errorMessage.includes('high demand') ||
      errorMessage.includes('UNAVAILABLE')
    ) {
      errorMessage = 'Los servidores de Gemini están con alta demanda temporal. Por favor reintenta generar las recetas en unos segundos.';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
