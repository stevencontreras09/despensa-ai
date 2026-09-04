import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ household_id: string }> }
) {
  const { household_id } = await context.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data: items, error } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('household_id', household_id)
    .order('is_purchased', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items });
}

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

  const body = await request.json();
  const { name, quantity = 1, unit = 'unidad', is_auto_suggested = false } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Nombre de producto requerido' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert({
      household_id,
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit,
      is_auto_suggested,
      is_purchased: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, item: data });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ household_id: string }> }
) {
  const { household_id } = await context.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { id, is_purchased, quantity } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  }

  const updateData: any = {};
  if (is_purchased !== undefined) updateData.is_purchased = is_purchased;
  if (quantity !== undefined) updateData.quantity = Number(quantity);
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('shopping_list_items')
    .update(updateData)
    .eq('id', id)
    .eq('household_id', household_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, item: data });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ household_id: string }> }
) {
  const { household_id } = await context.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const clearPurchased = searchParams.get('clearPurchased');

  if (clearPurchased === 'true') {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('household_id', household_id)
      .eq('is_purchased', true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, cleared: true });
  }

  if (!id) {
    return NextResponse.json({ error: 'ID de item requerido' }, { status: 400 });
  }

  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', id)
    .eq('household_id', household_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted_id: id });
}
