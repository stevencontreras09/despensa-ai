import { TrafficLightStatus } from '@/types/inventory';

export interface TrafficLightCalculation {
  days_remaining: number;
  status: TrafficLightStatus;
  urgency_label: string;
  is_expired: boolean;
  is_critical: boolean; // <= 48h (2 días)
}

/**
 * Calcula los días restantes hasta la fecha de caducidad y clasifica el estado:
 * - Rojo: <= 48h (<= 2 días) o ya vencido
 * - Amarillo: 3 a 5 días
 * - Verde: > 5 días
 */
export function calculateTrafficLight(expirationDateStr: string): TrafficLightCalculation {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expDate = new Date(expirationDateStr);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - now.getTime();
  const days_remaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const is_expired = days_remaining < 0;
  const is_critical = days_remaining <= 2;

  let status: TrafficLightStatus = 'green';
  let urgency_label = '';

  if (days_remaining < 0) {
    status = 'red';
    urgency_label = `Vencido hace ${Math.abs(days_remaining)} ${Math.abs(days_remaining) === 1 ? 'día' : 'días'}`;
  } else if (days_remaining === 0) {
    status = 'red';
    urgency_label = '¡Caduca hoy!';
  } else if (days_remaining === 1) {
    status = 'red';
    urgency_label = 'Caduca mañana';
  } else if (days_remaining === 2) {
    status = 'red';
    urgency_label = 'Caduca en 2 días';
  } else if (days_remaining >= 3 && days_remaining <= 5) {
    status = 'yellow';
    urgency_label = `Caduca en ${days_remaining} días`;
  } else {
    status = 'green';
    urgency_label = `Fresco (${days_remaining} días)`;
  }

  return {
    days_remaining,
    status,
    urgency_label,
    is_expired,
    is_critical,
  };
}

export const TRAFFIC_LIGHT_COLORS = {
  red: {
    bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    badge: 'bg-red-500 text-white',
    border: 'border-red-500',
    text: 'text-red-600 dark:text-red-400',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.35)]',
  },
  yellow: {
    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    badge: 'bg-amber-500 text-white',
    border: 'border-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
  },
  green: {
    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    badge: 'bg-emerald-500 text-white',
    border: 'border-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
  },
};
