import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ household_id: string; item_id: string }> }
) {
  const { household_id, item_id } = await context.params;

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
    const { action, quantity } = await request.json();

    if (action !== 'consume' && action !== 'waste') {
      return NextResponse.json(
        { error: 'Acción inválida. Usa "consume" o "waste"' },
        { status: 400 }
      );
    }

    // Obtener item
    const { data: item, error: fetchError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', item_id)
      .eq('household_id', household_id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    const currentQty = Number(item.quantity);
    const qtyToApply = quantity ? Math.min(currentQty, Number(quantity)) : currentQty;
    const remainingQty = Math.max(0, currentQty - qtyToApply);

    let financialImpact = 0;
    if (item.estimated_cost && currentQty > 0) {
      financialImpact = Number(((item.estimated_cost / currentQty) * qtyToApply).toFixed(2));
    }

    if (action === 'consume') {
      // Registrar consumo
      await supabase.from('consumption_logs').insert({
        household_id,
        item_id: item.id,
        item_name: item.name,
        action: 'consumed',
        quantity: qtyToApply,
        unit: item.unit,
        financial_impact: financialImpact,
      });

      if (remainingQty <= 0) {
        await supabase
          .from('inventory_items')
          .update({ quantity: 0, status: 'consumed', updated_at: new Date().toISOString() })
          .eq('id', item.id);

        // Auto sugerir reabastecimiento en lista de compras
        await supabase.from('shopping_list_items').insert({
          household_id,
          name: item.name,
          quantity: 1,
          unit: item.unit,
          is_auto_suggested: true,
          is_purchased: false,
        });
      } else {
        await supabase
          .from('inventory_items')
          .update({ quantity: remainingQty, updated_at: new Date().toISOString() })
          .eq('id', item.id);
      }

      return NextResponse.json({
        success: true,
        action: 'consumed',
        saved_amount: financialImpact,
        remaining_quantity: remainingQty,
        depleted: remainingQty <= 0,
      });
    } else {
      // Acción: Desechar (waste)
      await supabase.from('consumption_logs').insert({
        household_id,
        item_id: item.id,
        item_name: item.name,
        action: 'wasted',
        quantity: currentQty,
        unit: item.unit,
        financial_impact: financialImpact,
      });

      await supabase
        .from('inventory_items')
        .update({ quantity: 0, status: 'wasted', updated_at: new Date().toISOString() })
        .eq('id', item.id);

      return NextResponse.json({
        success: true,
        action: 'wasted',
        wasted_amount: financialImpact,
      });
    }
  } catch (err: any) {
    console.error('Error en micro-acción de inventario:', err);
    return NextResponse.json(
      { error: err.message || 'Error en el servidor al ejecutar la acción' },
      { status: 500 }
    );
  }
}
