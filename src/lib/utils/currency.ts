/**
 * Formatea un valor numérico a moneda (por defecto EUR o USD según configuración).
 */
export function formatCurrency(amount: number | null | undefined, currency = 'EUR'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
