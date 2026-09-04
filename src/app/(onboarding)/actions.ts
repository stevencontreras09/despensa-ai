'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createHouseholdSchema, joinHouseholdSchema } from '@/lib/validations/household';
import { generateInviteCode } from '@/lib/utils/invite-code';

export type HouseholdActionResult = {
  error?: string;
  success?: boolean;
};

export async function createHouseholdAction(
  prevState: HouseholdActionResult | null,
  formData: FormData
): Promise<HouseholdActionResult> {
  const rawData = {
    name: formData.get('name'),
  };

  const parsed = createHouseholdSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Nombre de hogar inválido' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Usar adminClient si está disponible para evitar restricciones de RLS durante la creación inicial
  const adminClient = createAdminClient();
  const clientToUse = adminClient || supabase;

  // Generar código de 12 caracteres único y ID de hogar explícito
  const inviteCode = generateInviteCode(12);
  const householdId = crypto.randomUUID();

  // Asegurar que el usuario existe en public.users para evitar fallos de foreign key
  await clientToUse
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
      },
      { onConflict: 'id' }
    );

  // 1. Insertar hogar
  const { error: householdError } = await clientToUse
    .from('households')
    .insert({
      id: householdId,
      name: parsed.data.name,
      invite_code: inviteCode,
    });

  if (householdError) {
    return { error: `Error al crear el hogar: ${householdError.message}` };
  }

  // 2. Asociar al creador como 'admin'
  const { error: memberError } = await clientToUse
    .from('household_members')
    .insert({
      household_id: householdId,
      user_id: user.id,
      role: 'admin',
    });

  if (memberError) {
    return { error: `Error al asignar rol de administrador: ${memberError.message}` };
  }

  // 3. Asegurar zonas de almacenamiento por defecto si el trigger no las creó
  const { count } = await clientToUse
    .from('storage_locations')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId);

  if (!count || count === 0) {
    await clientToUse.from('storage_locations').insert([
      { household_id: householdId, name: 'Nevera', is_default: true },
      { household_id: householdId, name: 'Congelador', is_default: true },
      { household_id: householdId, name: 'Despensa Seca', is_default: true },
      { household_id: householdId, name: 'Frutero', is_default: true },
    ]);
  }

  redirect('/dashboard');
}

export async function joinHouseholdAction(
  prevState: HouseholdActionResult | null,
  formData: FormData
): Promise<HouseholdActionResult> {
  const rawData = {
    invite_code: formData.get('invite_code'),
  };

  const parsed = joinHouseholdSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Código de invitación inválido' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Usamos adminClient si está disponible para buscar el código, o el cliente supabase autenticado
  const adminClient = createAdminClient();
  const clientToUse = adminClient || supabase;

  // 1. Buscar hogar con ese código de 12 caracteres
  const { data: household, error: findError } = await clientToUse
    .from('households')
    .select('id, name')
    .eq('invite_code', parsed.data.invite_code)
    .maybeSingle();

  if (findError || !household) {
    return { error: 'No se encontró ningún hogar con ese código de invitación. Verifica los 12 caracteres.' };
  }

  // 2. Comprobar si ya es miembro
  const { data: existingMember } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', household.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMember) {
    redirect('/dashboard');
  }

  // Asegurar que el usuario existe en public.users
  await clientToUse
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
      },
      { onConflict: 'id' }
    );

  // 3. Unir al usuario con rol 'member'
  const { error: joinError } = await clientToUse
    .from('household_members')
    .insert({
      household_id: household.id,
      user_id: user.id,
      role: 'member',
    });

  if (joinError) {
    return { error: `No pudiste unirte al hogar: ${joinError.message}` };
  }

  redirect('/dashboard');
}
