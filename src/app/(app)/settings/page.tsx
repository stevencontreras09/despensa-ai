import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '@/app/(auth)/actions';
import {
  Home,
  Users,
  Shield,
  Refrigerator,
  BarChart3,
  LogOut,
  Smartphone,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: memberRecord } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!memberRecord) {
    redirect('/setup-household');
  }

  const { data: household } = await supabase
    .from('households')
    .select('*')
    .eq('id', memberRecord.household_id)
    .single();

  const { data: members } = await supabase
    .from('household_members')
    .select('id, role, user:users(email, full_name)')
    .eq('household_id', memberRecord.household_id);

  const { data: storageLocations } = await supabase
    .from('storage_locations')
    .select('*')
    .eq('household_id', memberRecord.household_id)
    .order('name');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white">
          Ajustes del Hogar
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Administra los miembros de tu despensa, zonas y preferencias del sistema.
        </p>
      </div>

      {/* Household Info & Invite Code */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-white">
              {household?.name}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Creado el {new Date(household?.created_at || '').toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Código de Invitación (12 caracteres)
            </div>
            <div className="text-lg font-mono font-extrabold text-emerald-700 dark:text-emerald-400 tracking-widest mt-0.5">
              {household?.invite_code}
            </div>
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 max-w-xs">
            Comparte este código con los convivientes para que se unan desde la pantalla de bienvenida.
          </div>
        </div>
      </section>

      {/* Storage Locations */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Refrigerator className="w-4 h-4 text-emerald-600" />
            Zonas de Almacenamiento
          </h2>
          <span className="text-xs text-stone-400">{storageLocations?.length || 4} zonas</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {(storageLocations || []).map((loc) => (
            <div
              key={loc.id}
              className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700 font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{loc.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Quick Links */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-3 shadow-sm divide-y divide-stone-100 dark:divide-stone-800 text-xs">
        <Link
          href="/metrics"
          className="p-3 hover:bg-stone-50 dark:hover:bg-stone-800/60 rounded-2xl flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2.5 font-bold text-stone-800 dark:text-stone-200">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>Ver Métricas Financieras y Ahorro</span>
          </div>
          <ExternalLink className="w-4 h-4 text-stone-400" />
        </Link>

        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-stone-800 dark:text-stone-200">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>PWA Instalada</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
            Habilitada
          </span>
        </div>
      </section>

      {/* Logout Action */}
      <form action={logoutAction}>
        <button
          type="submit"
          className="w-full py-3.5 px-4 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 font-bold text-xs transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </form>
    </div>
  );
}
