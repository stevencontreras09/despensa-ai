import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deductRecipeRequestSchema } from '@/lib/validations/recipes';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ household_id: string }> }
) {
  const { household_id } = await context.params;

  // Header de idempotencia obligatorio
  const idempotencyKey = request.headers.get('Idempotency-Key') || request.headers.get('idempotency-key');
  if (!idempotencyKey || !idempotencyKey.trim()) {
    return NextResponse.json(
      { error: 'Cabecera obligatoria "Idempotency-Key" no encontrada en la solicitud' },
      { status: 400 }
    );
  }

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
    const body = await request.json();
    const parsed = deductRecipeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de deducción de receta inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { recipe_id, recipe_title, items } = parsed.data;

    // 1. Verificar idempotencia en DB
    const { data: existingIdempotency } = await supabase
      .from('idempotency_keys')
      .select('response')
      .eq('household_id', household_id)
      .eq('key', idempotencyKey)
      .maybeSingle();

    if (existingIdempotency && existingIdempotency.response) {
      return NextResponse.json(existingIdempotency.response);
    }

    // 2. Intentar llamar al procedimiento transaccional atómico deduct_recipe_atomic
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'deduct_recipe_atomic',
      {
        p_household_id: household_id,
        p_idempotency_key: idempotencyKey,
        p_recipe_id: recipe_id,
        p_recipe_title: recipe_title,
        p_items: items,
      }
    );

    if (!rpcError && rpcResult) {
      return NextResponse.json(rpcResult);
    }

    // 3. Fallback de aplicación si el RPC aún no fue ejecutado en el editor SQL de Supabase
    let totalSaved = 0;
    let deductedCount = 0;
    const depletedItems: string[] = [];

    for (const item of items) {
      const { data: currentItem } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', item.item_id)
        .eq('household_id', household_id)
        .single();

      if (!currentItem || currentItem.status !== 'active') continue;

      const currentQty = Number(currentItem.quantity);
      const usedQty = item.used_quantity;
      const newQty = Math.max(0, currentQty - usedQty);

      if (currentItem.estimated_cost && currentQty > 0) {
        const itemSaving = Number(
          ((currentItem.estimated_cost / currentQty) * Math.min(currentQty, usedQty)).toFixed(2)
        );
        totalSaved += itemSaving;
      }

      // Log de consumo
      await supabase.from('consumption_logs').insert({
        household_id,
        item_id: currentItem.id,
        item_name: currentItem.name,
        action: 'consumed',
        quantity: Math.min(currentQty, usedQty),
        unit: currentItem.unit,
        financial_impact: currentItem.estimated_cost ? Number((currentItem.estimated_cost / currentQty) * Math.min(currentQty, usedQty)) : 0,
      });

      if (newQty <= 0) {
        await supabase
          .from('inventory_items')
          .update({ quantity: 0, status: 'consumed', updated_at: new Date().toISOString() })
          .eq('id', currentItem.id);

        // Auto sugerir en lista de compras
        await supabase.from('shopping_list_items').insert({
          household_id,
          name: currentItem.name,
          quantity: 1,
          unit: currentItem.unit,
          is_auto_suggested: true,
          is_purchased: false,
        });

        depletedItems.push(currentItem.name);
      } else {
        await supabase
          .from('inventory_items')
          .update({ quantity: newQty, updated_at: new Date().toISOString() })
          .eq('id', currentItem.id);
      }

      deductedCount++;
    }

    const fallbackResponse = {
      success: true,
      recipe_id,
      recipe_title,
      items_deducted: deductedCount,
      total_money_saved: Number(totalSaved.toFixed(2)),
      depleted_items_added_to_shopping_list: depletedItems,
      timestamp: new Date().toISOString(),
    };

    // Guardar clave de idempotencia
    await supabase.from('idempotency_keys').insert({
      household_id,
      key: idempotencyKey,
      action: 'deduct_recipe',
      response: fallbackResponse,
    });

    return NextResponse.json(fallbackResponse);
  } catch (err: any) {
    console.error('Error en deducción de receta:', err);
    return NextResponse.json(
      { error: err.message || 'Error transaccional al descontar receta' },
      { status: 500 }
    );
  }
}
