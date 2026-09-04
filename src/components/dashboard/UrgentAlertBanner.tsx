'use client';

import Link from 'next/link';
import { Flame, ChefHat, ArrowRight } from 'lucide-react';

interface UrgentAlertBannerProps {
  urgentCount: number;
}

export function UrgentAlertBanner({ urgentCount }: UrgentAlertBannerProps) {
  if (urgentCount <= 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-red-500/15 to-orange-500/15 border border-amber-500/40 dark:border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
          <Flame className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
            Tienes <span className="text-red-600 dark:text-red-400 font-extrabold">{urgentCount} {urgentCount === 1 ? 'producto' : 'productos'}</span> en riesgo de caducar pronto
          </div>
          <div className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400">
            Aprovecha estos alimentos antes de que sea tarde con el generador de recetas de rescate.
          </div>
        </div>
      </div>

      <Link
        href="/recipes"
        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2 shrink-0 active:scale-95"
      >
        <ChefHat className="w-4 h-4 text-red-200" />
        <span>Ver Receta de Rescate</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
