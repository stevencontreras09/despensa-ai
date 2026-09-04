'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Plus,
  PackageOpen,
  Camera,
  Filter,
  CheckCircle2,
  X,
} from 'lucide-react';
import { TrafficLightHero } from '@/components/dashboard/TrafficLightHero';
import { UrgentAlertBanner } from '@/components/dashboard/UrgentAlertBanner';
import { InventoryItemCard } from '@/components/inventory/InventoryItemCard';
import { calculateTrafficLight } from '@/lib/utils/traffic-light';
import { StorageLocationRow, VALID_UNITS } from '@/types/inventory';

interface InventoryContainerProps {
  householdId: string;
  initialItems: any[];
  storageLocations: StorageLocationRow[];
}

export function InventoryContainer({
  householdId,
  initialItems,
  storageLocations,
}: InventoryContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTrafficParam = searchParams.get('traffic') || 'all';

  const [items, setItems] = useState<any[]>(initialItems);
  const [trafficFilter, setTrafficFilter] = useState<string>(initialTrafficParam);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Formulario de nuevo item manual
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unidad');
  const [newItemLocationId, setNewItemLocationId] = useState(storageLocations[0]?.id || '');
  const [newItemExpDate, setNewItemExpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [newItemCost, setNewItemCost] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Enriquecer items con cálculo de semáforo
  const enrichedItems = useMemo(() => {
    return items.map((it) => {
      const tl = calculateTrafficLight(it.expiration_date);
      return {
        ...it,
        days_remaining: tl.days_remaining,
        traffic_light: tl.status,
      };
    });
  }, [items]);

  // Contadores para el semáforo hero
  const counts = useMemo(() => {
    let red = 0;
    let yellow = 0;
    let green = 0;

    enrichedItems.forEach((it) => {
      if (it.traffic_light === 'red') red++;
      else if (it.traffic_light === 'yellow') yellow++;
      else green++;
    });

    return { red, yellow, green, total: enrichedItems.length };
  }, [enrichedItems]);

  // Filtrar según semáforo, ubicación y texto de búsqueda
  const filteredItems = useMemo(() => {
    return enrichedItems.filter((it) => {
      if (trafficFilter !== 'all' && it.traffic_light !== trafficFilter) {
        return false;
      }
      if (locationFilter !== 'all' && it.storage_location_id !== locationFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          it.name.toLowerCase().includes(query) ||
          it.storage_location?.name?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [enrichedItems, trafficFilter, locationFilter, searchQuery]);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setIsAdding(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        items: [
          {
            name: newItemName.trim(),
            storage_location_id: newItemLocationId,
            category_id: null,
            quantity: Number(newItemQty),
            unit: newItemUnit,
            purchase_date: today,
            expiration_date: newItemExpDate,
            estimated_cost: newItemCost ? parseFloat(newItemCost) : null,
          },
        ],
      };

      const res = await fetch(`/api/v1/households/${householdId}/inventory/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al registrar alimento');

      setShowAddModal(false);
      setNewItemName('');
      setNewItemCost('');
      router.refresh();
      // Refrescar lista local
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('No se pudo añadir el producto manual');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Hero Semáforo Filter */}
      <TrafficLightHero
        counts={counts}
        activeFilter={trafficFilter}
        onFilterChange={(f) => setTrafficFilter(f)}
      />

      {/* 2. Urgent Alert Banner */}
      <UrgentAlertBanner urgentCount={counts.red + counts.yellow} />

      {/* 3. Search & Location Filters */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Link
              href="/scan"
              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Escanear</span>
            </Link>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Manual</span>
            </button>
          </div>
        </div>

        {/* Location Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setLocationFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
              locationFilter === 'all'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Todas las zonas ({items.length})
          </button>
          {storageLocations.map((loc) => {
            const countInLoc = items.filter((i) => i.storage_location_id === loc.id).length;
            const isSelected = locationFilter === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => setLocationFilter(isSelected ? 'all' : loc.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                {loc.name} ({countInLoc})
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Items List */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              onActionComplete={() => {
                setItems((prev) => prev.filter((i) => i.id !== item.id));
                router.refresh();
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
            <PackageOpen className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">
            {items.length === 0
              ? 'Tu despensa está vacía'
              : 'No hay productos con los filtros seleccionados'}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
            {items.length === 0
              ? 'Escanea un ticket de compra o dicta tus alimentos para comenzar a gestionar el inventario.'
              : 'Intenta limpiar los filtros de semáforo o zona de almacenamiento.'}
          </p>
          {items.length === 0 && (
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all mt-2"
            >
              <Camera className="w-4 h-4" />
              Escanear Primera Compra
            </Link>
          )}
        </div>
      )}

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-base text-stone-900 dark:text-white">
                Añadir Alimento Manual
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre del Alimento
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Tomates cherry, Queso curado"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Unidad
                  </label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {VALID_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Ubicación
                  </label>
                  <select
                    value={newItemLocationId}
                    onChange={(e) => setNewItemLocationId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {storageLocations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Caducidad
                  </label>
                  <input
                    type="date"
                    required
                    value={newItemExpDate}
                    onChange={(e) => setNewItemExpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Costo estimado (€, opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 2.50"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 font-semibold text-stone-600 dark:text-stone-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-600/20"
                >
                  {isAdding ? 'Guardando...' : 'Añadir Alimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
