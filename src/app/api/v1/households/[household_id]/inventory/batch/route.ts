import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { batchInventoryItemSchema } from '@/lib/validations/inventory';

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
    const body = await request.json();
    const parsed = batchInventoryItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de inventario inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const itemsToInsert = parsed.data.items.map((item) => ({
      household_id,
      name: item.name,
      storage_location_id: item.storage_location_id,
      category_id: item.category_id || null,
      quantity: item.quantity,
      unit: item.unit,
      purchase_date: item.purchase_date,
      expiration_date: item.expiration_date,
      estimated_cost: item.estimated_cost ?? null,
      status: 'active' as const,
      created_by: user.id,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('inventory_items')
      .insert(itemsToInsert)
      .select('id, name, quantity, unit, expiration_date');

    if (insertError) {
      return NextResponse.json(
        { error: `Error al guardar los productos: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: inserted?.length || 0,
      items: inserted,
    });
  } catch (err: any) {
    console.error('Error en batch insert:', err);
    return NextResponse.json(
      { error: err.message || 'Error en el servidor al guardar el lote' },
      { status: 500 }
    );
  }
}
