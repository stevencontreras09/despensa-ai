'use client';

import Link from 'next/link';
import { AlertTriangle, Clock, ShieldCheck, Flame } from 'lucide-react';
import { TrafficLightStatus } from '@/types/inventory';

interface TrafficLightHeroProps {
  counts: {
    red: number; // <= 48h o vencidos
    yellow: number; // 3-5 días
    green: number; // > 5 días
    total: number;
  };
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  asLink?: boolean;
}

export function TrafficLightHero({
  counts,
  activeFilter = 'all',
  onFilterChange,
  asLink = false,
}: TrafficLightHeroProps) {
  const tiers = [
    {
      id: 'red',
      status: 'red' as TrafficLightStatus,
      label: 'Crítico (≤ 48h)',
      count: counts.red,
      icon: Flame,
      cardBg: 'bg-red-500/10 hover:bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-400',
      pillBg: 'bg-red-500 text-white',
      desc: 'Consumir urgente',
    },
    {
      id: 'yellow',
      status: 'yellow' as TrafficLightStatus,
      label: 'Atención (3-5d)',
      count: counts.yellow,
      icon: Clock,
      cardBg: 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400',
      pillBg: 'bg-amber-500 text-white',
      desc: 'Planificar consumo',
    },
    {
      id: 'green',
      status: 'green' as TrafficLightStatus,
      label: 'Fresco (> 5d)',
      count: counts.green,
      icon: ShieldCheck,
      cardBg: 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
      pillBg: 'bg-emerald-500 text-white',
      desc: 'Consumo seguro',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      {tiers.map((t) => {
        const Icon = t.icon;
        const isActive = activeFilter === t.id;

        const content = (
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${t.cardBg} ${
              isActive ? 'ring-2 ring-emerald-500 shadow-md scale-[1.02]' : 'shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[10px] sm:text-xs font-bold tracking-tight uppercase truncate">
                {t.label}
              </span>
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-black tracking-tight">{t.count}</span>
              <span className="text-[10px] sm:text-xs opacity-75 font-medium hidden sm:inline">
                {t.desc}
              </span>
            </div>
          </div>
        );

        if (asLink) {
          return (
            <Link key={t.id} href={`/inventory?traffic=${t.id}`} className="block">
              {content}
            </Link>
          );
        }

        return (
          <div
            key={t.id}
            onClick={() => onFilterChange && onFilterChange(isActive ? 'all' : t.id)}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
