import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseTicketWithGemini } from '@/lib/gemini/ticket-parser';

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

  // Verificar que el usuario pertenece al hogar
  const { data: isMember } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', household_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!isMember) {
    return NextResponse.json({ error: 'Acceso denegado a este hogar' }, { status: 403 });
  }

  // Obtener zonas de almacenamiento del hogar para enlazar IDs
  const { data: locations } = await supabase
    .from('storage_locations')
    .select('id, name')
    .eq('household_id', household_id);

  const locationMap = new Map<string, string>();
  (locations || []).forEach((loc) => {
    locationMap.set(loc.name.toLowerCase(), loc.id);
  });

  const contentType = request.headers.get('content-type') || '';

  let extractionResult;

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('ticket') as File | null;
      const text = formData.get('text') as string | null;

      if (!file && !text) {
        return NextResponse.json(
          { error: 'Debes enviar un archivo de ticket o texto dictado' },
          { status: 400 }
        );
      }

      let imageBuffer: Buffer | undefined;
      let mimeType: string | undefined;

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        mimeType = file.type || 'image/jpeg';
      }

      extractionResult = await parseTicketWithGemini({
        imageBuffer,
        mimeType,
        text: text || undefined,
      });
    } else {
      const body = await request.json();
      extractionResult = await parseTicketWithGemini({
        text: body.text,
      });
    }

    const baseDateStr = extractionResult.purchase_date || new Date().toISOString().split('T')[0];
    const baseDate = new Date(baseDateStr);

    // Enriquecer items con fechas proyectadas y storage_location_id resuelto
    const enrichedItems = extractionResult.items.map((item) => {
      const expDate = new Date(baseDate);
      expDate.setDate(expDate.getDate() + (item.default_shelf_life_days || 7));
      const expiration_date = expDate.toISOString().split('T')[0];

      const matchedLocationId =
        locationMap.get(item.storage_location.toLowerCase()) ||
        locationMap.get('nevera') ||
        (locations && locations[0]?.id) ||
        '';

      return {
        ...item,
        purchase_date: baseDateStr,
        expiration_date,
        storage_location_id: matchedLocationId,
      };
    });

    return NextResponse.json({
      success: true,
      store_name: extractionResult.store_name,
      purchase_date: baseDateStr,
      currency: extractionResult.currency || 'EUR',
      items: enrichedItems,
    });
  } catch (err: any) {
    console.error('Error procesando ticket con Gemini:', err);
    return NextResponse.json(
      { error: err.message || 'Error al procesar el ticket con IA' },
      { status: 500 }
    );
  }
}
