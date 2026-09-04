'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, registerSchema } from '@/lib/validations/auth';

export type AuthActionResult = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos de inicio de sesión inválidos' };
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return {
      error: 'Configura las variables de entorno de Supabase en Vercel (Settings -> Environment Variables) para habilitar el inicio de sesión.',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message === 'Invalid login credentials' 
      ? 'Credenciales incorrectas. Verifica tu email y contraseña.' 
      : error.message 
    };
  }

  // Comprobar si el usuario ya tiene un hogar asignado
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: memberRecord } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!memberRecord) {
      redirect('/setup-household');
    }
  }

  redirect('/dashboard');
}

export async function registerAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  };

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos de registro inválidos' };
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return {
      error: 'Configura las variables de entorno de Supabase en Vercel (Settings -> Environment Variables) para registrarte.',
    };
  }

  const appUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://midespensa-wheat.vercel.app';

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
      },
      emailRedirectTo: `${appUrl}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Si requiere confirmación por email y no hay sesión activa inmediatamente
  if (data?.user && !data.session) {
    return {
      success: true,
      error: 'Hemos enviado un enlace de confirmación a tu correo electrónico. Por favor verifícalo para ingresar.',
    };
  }

  redirect('/setup-household');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
