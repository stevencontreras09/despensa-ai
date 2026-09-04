'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Check,
  Trash2,
  Plus,
  Sparkles,
  ArrowRight,
  PackageCheck,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { ShoppingItemRow, StorageLocationRow, VALID_UNITS } from '@/types/inventory';

interface ShoppingListContainerProps {
  householdId: string;
  initialItems: ShoppingItemRow[];
  storageLocations: StorageLocationRow[];
}

export function ShoppingListContainer({
  householdId,
  initialItems,
  storageLocations,
}: ShoppingListContainerProps) {
  const router = useRouter();
  const [items, setItems] = useState<ShoppingItemRow[]>(initialItems);

  // Formulario de nuevo item
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('unidad');
  const [isAdding, setIsAdding] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const purchasedItems = items.filter((i) => i.is_purchased);
  const pendingItems = items.filter((i) => !i.is_purchased);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch(`/api/v1/households/${householdId}/shopping-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          quantity: qty,
          unit,
          is_auto_suggested: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al añadir item');

      setItems((prev) => [data.item, ...prev]);
      setName('');
      setQty(1);
    } catch (err) {
      console.error(err);
      alert('No se pudo añadir el producto');
    } finally {
      setIsAdding(false);
    }
  };

  const handleTogglePurchased = async (item: ShoppingItemRow) => {
    const nextPurchased = !item.is_purchased;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_purchased: nextPurchased } : i))
    );

    try {
      await fetch(`/api/v1/households/${householdId}/shopping-list`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_purchased: nextPurchased }),
      });
    } catch (err) {
      console.error(err);
      // Revert on error
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_purchased: !nextPurchased } : i))
      );
    }
  };

  const handleDeleteItem = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/v1/households/${householdId}/shopping-list?id=${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearPurchased = async () => {
    setItems((prev) => prev.filter((i) => !i.is_purchased));
    try {
      await fetch(
        `/api/v1/households/${householdId}/shopping-list?clearPurchased=true`,
        { method: 'DELETE' }
      );
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Fase 5 -> Fase 2/3: Mover comprados al inventario de la despensa
   */
  const handleMovePurchasedToPantry = async () => {
    if (purchasedItems.length === 0) return;

    setIsMoving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const defaultExp = nextWeek.toISOString().split('T')[0];

      const defaultLocId = storageLocations[0]?.id || '';

      const batchPayload = {
        items: purchasedItems.map((pi) => ({
          name: pi.name,
          storage_location_id: defaultLocId,
          category_id: null,
          quantity: Number(pi.quantity),
          unit: pi.unit,
          purchase_date: today,
          expiration_date: defaultExp,
        })),
      };

      // 1. Inyectar en inventario
      const insertRes = await fetch(`/api/v1/households/${householdId}/inventory/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchPayload),
      });

      if (!insertRes.ok) throw new Error('Error al ingresar productos a la despensa');

      // 2. Limpiar comprados
      await handleClearPurchased();

      router.push('/inventory?restocked=true');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('No se pudieron trasladar los productos al inventario.');
      setIsMoving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Item Form */}
      <form
        onSubmit={handleAddItem}
        className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-center gap-3"
      >
        <input
          type="text"
          required
          placeholder="Añadir producto (ej: Huevos, Aceite de oliva)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={qty}
            onChange={(e) => setQty(parseFloat(e.target.value) || 1)}
            className="w-16 px-2.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-white text-center font-bold focus:outline-none"
          />

          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-white font-medium focus:outline-none"
          >
            {VALID_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isAdding || !name.trim()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Añadir</span>
          </button>
        </div>
      </form>

      {/* Reabastecimiento Action Banner (Fase 5 -> Despensa) */}
      {purchasedItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
            <PackageCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Tienes <strong>{purchasedItems.length}</strong> {purchasedItems.length === 1 ? 'producto comprado' : 'productos comprados'}. ¿Deseas ingresarlos a tu despensa?
            </span>
          </div>

          <button
            type="button"
            onClick={handleMovePurchasedToPantry}
            disabled={isMoving}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
          >
            {isMoving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ingresando...</span>
              </>
            ) : (
              <>
                <span>Pasar a Despensa</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
            Por Comprar ({pendingItems.length})
          </div>
          {purchasedItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearPurchased}
              className="text-[11px] text-stone-500 hover:text-red-600 transition-colors"
            >
              Borrar comprados ({purchasedItems.length})
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 text-xs text-stone-500 dark:text-stone-400 space-y-2">
            <ShoppingCart className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700" />
            <p>Tu lista de compras está vacía.</p>
            <p className="text-[11px] text-stone-400">
              Cuando cocines recetas y se agoten ingredientes, aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {items.map((item) => (
              <div
                key={item.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleTogglePurchased(item)}
                    aria-label={item.is_purchased ? 'Marcar como pendiente' : 'Marcar como comprado'}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                      item.is_purchased
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-stone-300 dark:border-stone-700 hover:border-emerald-500'
                    }`}
                  >
                    {item.is_purchased && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0">
                    <div
                      className={`text-xs font-bold ${
                        item.is_purchased
                          ? 'line-through text-stone-400 dark:text-stone-500'
                          : 'text-stone-900 dark:text-white'
                      }`}
                    >
                      {item.name}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                      <span>
                        {item.quantity} {item.unit}
                      </span>
                      {item.is_auto_suggested && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-semibold border border-amber-200/60 dark:border-amber-900/40">
                          <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                          Auto-sugerido
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  aria-label="Eliminar producto"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
