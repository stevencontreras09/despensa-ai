'use client';

import { useState } from 'react';
import {
  ChefHat,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  Check,
} from 'lucide-react';
import { RescueRecipe } from '@/types/ai';
import { formatCurrency } from '@/lib/utils/currency';

interface RescueRecipeCardProps {
  recipe: RescueRecipe;
  householdId: string;
  onCookSuccess: () => void;
}

export function RescueRecipeCard({ recipe, householdId, onCookSuccess }: RescueRecipeCardProps) {
  const [isDeducting, setIsDeducting] = useState(false);
  const [deductionResult, setDeductionResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedMissing, setAddedMissing] = useState<Record<string, boolean>>({});

  const handleCookAndDeduct = async () => {
    setIsDeducting(true);
    setError(null);

    try {
      // Generar idempotency key único
      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        recipe_id: recipe.id,
        recipe_title: recipe.title,
        items: recipe.used_inventory_items.map((it) => ({
          item_id: it.item_id,
          used_quantity: Number(it.used_quantity),
        })),
      };

      const res = await fetch(
        `/api/v1/households/${householdId}/inventory/deduct-recipe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al descontar ingredientes');
      }

      setDeductionResult(data);
      onCookSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al procesar la deducción');
    } finally {
      setIsDeducting(false);
    }
  };

  const addMissingToShoppingList = async (ingredientName: string) => {
    try {
      await fetch(`/api/v1/households/${householdId}/shopping-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ingredientName,
          quantity: 1,
          unit: 'unidad',
        }),
      });

      setAddedMissing((prev) => ({ ...prev, [ingredientName]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-md space-y-5 relative overflow-hidden">
      {/* Recipe Header */}
      <div>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
          <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-900">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            Rescate: {recipe.rescue_score}
          </span>

          <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {recipe.prep_time_minutes} min
            </span>
            <span>•</span>
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              {recipe.difficulty}
            </span>
          </div>
        </div>

        <h3 className="text-xl font-black text-stone-900 dark:text-white leading-snug">
          {recipe.title}
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
          {recipe.description}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Ingredient Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Rescued Pantry Items */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50">
          <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Ingredientes Rescatados de tu Despensa:
          </h4>
          <ul className="space-y-1.5 text-emerald-900 dark:text-emerald-200 font-medium">
            {recipe.used_inventory_items.map((it) => (
              <li key={it.item_id} className="flex items-center justify-between">
                <span>• {it.name}</span>
                <span className="font-bold">
                  {it.used_quantity} {it.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Staples & Missing */}
        <div className="space-y-3">
          {/* Pantry Staples */}
          {recipe.pantry_staples_used.length > 0 && (
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
              <span className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Básicos de cocina asumidos:
              </span>
              <p className="text-stone-600 dark:text-stone-400">
                {recipe.pantry_staples_used.join(', ')}
              </p>
            </div>
          )}

          {/* Missing Ingredients */}
          {recipe.missing_ingredients.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
              <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                Ingredientes faltantes:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recipe.missing_ingredients.map((miss) => (
                  <button
                    key={miss}
                    type="button"
                    onClick={() => addMissingToShoppingList(miss)}
                    disabled={addedMissing[miss]}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950 transition-colors"
                  >
                    {addedMissing[miss] ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        Añadido a compras
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 text-amber-600" />
                        {miss}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        <h4 className="font-bold text-xs text-stone-900 dark:text-white uppercase tracking-wider">
          Pasos de Preparación:
        </h4>
        <ol className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
          {recipe.steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Success Banner if Cooked */}
      {deductionResult && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-1 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ¡Receta cocinada con éxito!
          </div>
          <p>
            Aporte de ahorro estimado:{' '}
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              +{formatCurrency(deductionResult.total_money_saved)}
            </span>
          </p>
          {deductionResult.depleted_items_added_to_shopping_list?.length > 0 && (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Productos agotados enviados a tu Lista de Compras:{' '}
              {deductionResult.depleted_items_added_to_shopping_list.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Action Trigger */}
      {!deductionResult && (
        <button
          type="button"
          onClick={handleCookAndDeduct}
          disabled={isDeducting}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/25 active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isDeducting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Descontando ingredientes atómicamente...</span>
            </>
          ) : (
            <>
              <ChefHat className="w-4 h-4" />
              <span>Marcar como cocinada y descontar ingredientes</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
