'use client';

import { useState } from 'react';
import { Check, Trash2, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { calculateTrafficLight, TRAFFIC_LIGHT_COLORS } from '@/lib/utils/traffic-light';
import { formatCurrency } from '@/lib/utils/currency';

interface InventoryItemCardProps {
  item: {
    id: string;
    household_id: string;
    name: string;
    quantity: number;
    unit: string;
    expiration_date: string;
    estimated_cost: number | null;
    storage_location?: { name: string } | null;
    status: string;
  };
  onActionComplete: () => void;
}

export function InventoryItemCard({ item, onActionComplete }: InventoryItemCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const traffic = calculateTrafficLight(item.expiration_date);
  const colors = TRAFFIC_LIGHT_COLORS[traffic.status];

  const handleAction = async (action: 'consume' | 'waste') => {
    setIsProcessing(true);
    try {
      const res = await fetch(
        `/api/v1/households/${item.household_id}/inventory/${item.id}/action`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al ejecutar acción');

      if (action === 'consume') {
        setFeedback(
          data.saved_amount > 0
            ? `+${formatCurrency(data.saved_amount)} ahorrados`
            : '¡Consumido!'
        );
      } else {
        setFeedback('Descartado');
      }

      setTimeout(() => {
        onActionComplete();
      }, 700);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al actualizar producto');
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-white dark:bg-stone-900 border transition-all shadow-sm hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden ${colors.border}`}
    >
      {/* Visual Semáforo Stripe */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          traffic.status === 'red'
            ? 'bg-red-500'
            : traffic.status === 'yellow'
            ? 'bg-amber-500'
            : 'bg-emerald-500'
        }`}
      />

      {/* Main Info */}
      <div className="flex-1 min-w-0 pl-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-bold text-sm text-stone-900 dark:text-white truncate">
            {item.name}
          </h4>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors.badge}`}
          >
            {traffic.urgency_label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1 flex-wrap">
          <span className="font-semibold text-stone-800 dark:text-stone-200">
            {item.quantity} {item.unit}
          </span>
          <span>•</span>
          <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md text-[11px]">
            {item.storage_location?.name || 'Despensa'}
          </span>
          {item.estimated_cost != null && (
            <>
              <span>•</span>
              <span className="text-[11px] text-stone-600 dark:text-stone-300">
                {formatCurrency(item.estimated_cost)}
              </span>
            </>
          )}
          <span>•</span>
          <span className="flex items-center gap-1 text-[11px]">
            <Calendar className="w-3 h-3 text-stone-400" />
            {item.expiration_date}
          </span>
        </div>
      </div>

      {/* Feedback Alert or 1-Tap Micro-actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
        {feedback ? (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            {feedback}
          </span>
        ) : isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleAction('consume')}
              title="Consumido (descuenta stock y registra ahorro financiero)"
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-950/40 dark:hover:bg-emerald-600 dark:text-emerald-300 transition-colors text-xs font-bold flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Consumir</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction('waste')}
              title="Desechar (registra pérdida por caducidad)"
              className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
