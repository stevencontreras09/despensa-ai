import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils/currency';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  History,
  CheckCircle2,
  Trash2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default async function MetricsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: memberRecord } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!memberRecord) {
    redirect('/setup-household');
  }

  // Obtener logs de consumo y desperdicio
  const { data: logs } = await supabase
    .from('consumption_logs')
    .select('*')
    .eq('household_id', memberRecord.household_id)
    .order('created_at', { ascending: false })
    .limit(30);

  let totalSaved = 0;
  let totalWasted = 0;
  let consumedCount = 0;
  let wastedCount = 0;

  (logs || []).forEach((log) => {
    const val = Number(log.financial_impact) || 0;
    if (log.action === 'consumed') {
      totalSaved += val;
      consumedCount++;
    } else if (log.action === 'wasted') {
      totalWasted += val;
      wastedCount++;
    }
  });

  const totalActions = consumedCount + wastedCount;
  const rescueRate =
    totalActions > 0 ? Math.round((consumedCount / totalActions) * 100) : 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white">
          Balance Financiero y Desperdicio
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Trazabilidad del dinero ahorrado por consumo a tiempo vs. pérdidas por comida descartada.
        </p>
      </div>

      {/* Hero Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Saved */}
        <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Dinero Ahorrado
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totalSaved)}
            </div>
            <div className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
              {consumedCount} {consumedCount === 1 ? 'alimento consumido' : 'alimentos consumidos'}
            </div>
          </div>
        </div>

        {/* Wasted */}
        <div className="p-5 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-900 dark:text-red-300 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
              Dinero Desperdiciado
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-red-600 dark:text-red-400">
              {formatCurrency(totalWasted)}
            </div>
            <div className="text-[11px] text-red-800/80 dark:text-red-300/80 mt-0.5">
              {wastedCount} {wastedCount === 1 ? 'alimento descartado' : 'alimentos descartados'}
            </div>
          </div>
        </div>

        {/* Rescue Efficiency Rate */}
        <div className="p-5 rounded-3xl bg-stone-900 text-white dark:bg-stone-800 border border-stone-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
              Tasa Anti-Desperdicio
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-400">
              {rescueRate}%
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              {rescueRate >= 80 ? '¡Excelente gestión del hogar!' : 'Espacio de optimización'}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log Table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            Historial de Micro-Acciones
          </h2>
          <span className="text-xs text-stone-400">Últimos movimientos</span>
        </div>

        {!logs || logs.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-500 dark:text-stone-400">
            Aún no hay registros de consumo o descarte.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {logs.map((log) => {
              const isConsumed = log.action === 'consumed';
              return (
                <div
                  key={log.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isConsumed
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                      }`}
                    >
                      {isConsumed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 dark:text-white">
                        {log.item_name}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        {log.quantity} {log.unit} •{' '}
                        {new Date(log.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-black text-xs ${
                        isConsumed
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isConsumed ? '+' : '-'}
                      {formatCurrency(log.financial_impact)}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-stone-400">
                      {isConsumed ? 'Ahorrado' : 'Pérdida'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
