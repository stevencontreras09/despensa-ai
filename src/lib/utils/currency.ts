/**
 * Formatea un valor numérico a moneda (por defecto Peso Dominicano DOP / RD$).
 */
export function formatCurrency(amount: number | null | undefined, currency = 'DOP'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (currency === 'DOP' || currency === 'RD$') {
    const formatted = new Intl.NumberFormat('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absAmount);
    return isNegative ? `-RD$ ${formatted}` : `RD$ ${formatted}`;
  }

  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

