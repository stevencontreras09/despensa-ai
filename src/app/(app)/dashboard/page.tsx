import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Sparkles,
  Camera,
  PackageOpen,
  ChefHat,
  ShoppingCart,
  ShieldCheck,
  Refrigerator,
  Flame,
  ArrowRight,
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Obtener membresía del hogar
  const { data: memberRecord } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user?.id || '')
    .limit(1)
    .maybeSingle();

  const householdId = memberRecord?.household_id;

  // Obtener datos del hogar, zonas e inventario en paralelo
  const [householdRes, storageRes, inventoryRes] = householdId
    ? await Promise.all([
        supabase
          .from('households')
          .select('id, name, invite_code')
          .eq('id', householdId)
          .maybeSingle(),
        supabase
          .from('storage_locations')
          .select('id, name, is_default')
          .eq('household_id', householdId)
          .order('name'),
        supabase
          .from('inventory_items')
          .select('id, expiration_date, status')
          .eq('household_id', householdId)
          .eq('status', 'active'),
      ])
    : [{ data: null }, { data: [] }, { data: [] }];

  const household = householdRes.data;
  const storageLocations = storageRes.data || [];
  const inventoryItems = inventoryRes.data || [];
  const totalActiveItems = inventoryItems.length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <section className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white shadow-xl shadow-emerald-700/15 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>Despensa Inteligente Activa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ¡Hola, {user?.user_metadata?.full_name || 'Chef del Hogar'}!
          </h1>
          <p className="text-sm text-emerald-100/90 mt-2">
            Hogar <span className="font-semibold text-white">{household?.name}</span>. Todo listo para evitar el desperdicio de comida y ahorrar dinero.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition-all shadow-md active:scale-95"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              Escanear Ticket de Compra
            </Link>
            <Link
              href="/recipes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 text-white font-semibold text-xs transition-all border border-white/20"
            >
              <ChefHat className="w-4 h-4 text-emerald-300" />
              Recetas de Rescate
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/inventory"
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <PackageOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-stone-900 dark:text-white">
              {totalActiveItems}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center justify-between">
              <span>Alimentos activos</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Link>

        <Link
          href="/scan"
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-stone-900 dark:text-white">Ingesta IA</div>
            <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center justify-between">
              <span>Foto o voz</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Link>

        <Link
          href="/recipes"
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-stone-900 dark:text-white">Rescate</div>
            <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center justify-between">
              <span>Recetas Zero-Waste</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Link>

        <Link
          href="/shopping-list"
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-stone-900 dark:text-white">Compras</div>
            <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center justify-between">
              <span>Auto-sugerencias</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Link>
      </div>

      {/* Storage Zones (Preloaded in Sprint 1) */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Refrigerator className="w-4 h-4 text-emerald-600" />
              Zonas de Almacenamiento
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Ubicaciones precargadas de tu hogar para ordenar alimentos
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {storageLocations?.length || 4} Zonas
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(storageLocations && storageLocations.length > 0
            ? storageLocations
            : [
                { id: '1', name: 'Nevera' },
                { id: '2', name: 'Congelador' },
                { id: '3', name: 'Despensa Seca' },
                { id: '4', name: 'Frutero' },
              ]
          ).map((loc) => (
            <div
              key={loc.id}
              className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700 flex items-center gap-2.5"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                {loc.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Household Invitation Card */}
      <section className="p-5 rounded-2xl bg-stone-100/80 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">
              Invita a otros miembros de tu hogar
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Comparte el código de 12 caracteres para que puedan ver y editar la despensa juntos.
            </p>
          </div>
        </div>
        <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono font-bold text-sm tracking-wider text-emerald-700 dark:text-emerald-400 select-all">
          {household?.invite_code || 'CONFIGURANDO'}
        </div>
      </section>
    </div>
  );
}
