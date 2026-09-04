'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Trash2,
  Plus,
  Calendar,
  AlertCircle,
  Loader2,
  Sparkles,
  ShoppingBag,
  X,
} from 'lucide-react';
import { VALID_UNITS, StorageLocationRow } from '@/types/inventory';

export interface EditableItem {
  id: string; // temporary client ID
  raw_name: string;
  name: string;
  category: string;
  storage_location_id: string;
  storage_location_name?: string;
  quantity: number;
  unit: string;
  estimated_cost: number | null;
  purchase_date: string;
  expiration_date: string;
  default_shelf_life_days: number;
}

interface ExpressValidationModalProps {
  householdId: string;
  initialItems: any[];
  storeName?: string | null;
  purchaseDate?: string | null;
  storageLocations: StorageLocationRow[];
  onClose: () => void;
}

export function ExpressValidationModal({
  householdId,
  initialItems,
  storeName,
  purchaseDate,
  storageLocations,
  onClose,
}: ExpressValidationModalProps) {
  const router = useRouter();

  // Mapeo inicial
  const [items, setItems] = useState<EditableItem[]>(() => {
    return initialItems.map((item, idx) => ({
      id: `item-${idx}-${Date.now()}`,
      raw_name: item.raw_name || '',
      name: item.normalized_name || item.name || '',
      category: item.category || 'Varios',
      storage_location_id: item.storage_location_id || (storageLocations[0]?.id ?? ''),
      storage_location_name: item.storage_location,
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'unidad',
      estimated_cost: item.estimated_cost != null ? Number(item.estimated_cost) : null,
      purchase_date: item.purchase_date || purchaseDate || new Date().toISOString().split('T')[0],
      expiration_date: item.expiration_date || new Date().toISOString().split('T')[0],
      default_shelf_life_days: item.default_shelf_life_days || 7,
    }));
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateItem = (id: string, field: keyof EditableItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addNewItem = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const newItem: EditableItem = {
      id: `manual-${Date.now()}`,
      raw_name: 'Manual',
      name: 'Nuevo Alimento',
      category: 'Despensa',
      storage_location_id: storageLocations[0]?.id || '',
      quantity: 1,
      unit: 'unidad',
      estimated_cost: null,
      purchase_date: today,
      expiration_date: nextWeek.toISOString().split('T')[0],
      default_shelf_life_days: 7,
    };

    setItems((prev) => [...prev, newItem]);
  };

  const handleBatchSave = async () => {
    if (items.length === 0) {
      setError('No hay productos para guardar en la despensa.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        items: items.map((it) => ({
          name: it.name.trim(),
          storage_location_id: it.storage_location_id,
          category_id: null,
          quantity: Number(it.quantity),
          unit: it.unit,
          purchase_date: it.purchase_date,
          expiration_date: it.expiration_date,
          estimated_cost: it.estimated_cost != null ? Number(it.estimated_cost) : null,
        })),
      };

      const res = await fetch(`/api/v1/households/${householdId}/inventory/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar los alimentos');
      }

      router.push('/inventory?scanSuccess=true');
      router.refresh();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error guardando en el inventario');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-900/80">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              Validación Express con IA
            </div>
            <h2 className="text-lg font-extrabold text-stone-900 dark:text-white">
              {storeName ? `Compra en ${storeName}` : 'Revisión de Productos'} ({items.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-center gap-2.5 text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-stone-100 dark:divide-stone-800">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`pt-3 first:pt-0 group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl transition-all ${
                index % 2 === 0 ? 'bg-stone-50/50 dark:bg-stone-800/30' : 'bg-transparent'
              }`}
            >
              {/* Product Info & Name */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    className="w-full font-bold text-sm bg-transparent border-b border-transparent hover:border-stone-300 dark:hover:border-stone-600 focus:border-emerald-500 text-stone-900 dark:text-white focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    title="Descartar producto"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Subrow: Quantity, Unit, Location, Expiration */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* Quantity */}
                  <div className="flex items-center gap-1 bg-white dark:bg-stone-900 px-2 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
                    <span className="text-stone-400 text-[10px]">Cant:</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                      className="w-12 bg-transparent text-stone-900 dark:text-white font-semibold focus:outline-none"
                    />
                  </div>

                  {/* Unit */}
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                    className="bg-white dark:bg-stone-900 px-2 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-medium focus:outline-none"
                  >
                    {VALID_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>

                  {/* Storage Location */}
                  <select
                    value={item.storage_location_id}
                    onChange={(e) => updateItem(item.id, 'storage_location_id', e.target.value)}
                    className="bg-white dark:bg-stone-900 px-2 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-medium focus:outline-none truncate"
                  >
                    {storageLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>

                  {/* Expiration Date */}
                  <div className="flex items-center gap-1 bg-white dark:bg-stone-900 px-2 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
                    <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                    <input
                      type="date"
                      value={item.expiration_date}
                      onChange={(e) => updateItem(item.id, 'expiration_date', e.target.value)}
                      className="w-full bg-transparent text-stone-900 dark:text-white font-medium focus:outline-none text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={addNewItem}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Añadir Producto Manual
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-400 text-xs font-semibold hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleBatchSave}
              disabled={isSaving || items.length === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar e Ingresar ({items.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
