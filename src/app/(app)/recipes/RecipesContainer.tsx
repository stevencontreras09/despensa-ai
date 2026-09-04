'use client';

import { useState } from 'react';
import { Sparkles, Loader2, ChefHat, AlertCircle, RefreshCw } from 'lucide-react';
import { RescueRecipe } from '@/types/ai';
import { RescueRecipeCard } from '@/components/recipes/RescueRecipeCard';

interface RecipesContainerProps {
  householdId: string;
  inventoryItems: any[];
}

export function RecipesContainer({ householdId, inventoryItems }: RecipesContainerProps) {
  const [recipes, setRecipes] = useState<RescueRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxTime, setMaxTime] = useState<number>(30);
  const [dietaryPrefs, setDietaryPrefs] = useState<string>('');

  const urgentItems = inventoryItems.filter((i) => i.days_remaining <= 5);

  const fetchRecipes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/households/${householdId}/recipes/rescue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiring_within_days: 5,
          max_prep_time_minutes: maxTime,
          dietary_preferences: dietaryPrefs.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar recetas');

      setRecipes(data.recipes || []);
      if (!data.recipes || data.recipes.length === 0) {
        setError('No se encontraron recetas con los ingredientes actuales.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration & Trigger Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Configuración del Menú de Rescate
            </div>
            <div className="text-sm font-semibold text-stone-900 dark:text-white">
              {urgentItems.length > 0 ? (
                <>
                  Priorizando{' '}
                  <span className="text-red-600 font-bold">
                    {urgentItems.length} alimentos
                  </span>{' '}
                  próximos a caducar
                </>
              ) : (
                'Utilizando los alimentos disponibles de tu despensa'
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={fetchRecipes}
            disabled={isLoading || inventoryItems.length === 0}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Formulando recetas...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Generar con Gemini 2.5 Flash</span>
              </>
            )}
          </button>
        </div>

        {/* Filters: Prep Time & Diet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Tiempo máximo: {maxTime} minutos
            </label>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={maxTime}
              onChange={(e) => setMaxTime(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Preferencia dietética (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Vegetariano, Sin gluten, Ligero"
              value={dietaryPrefs}
              onChange={(e) => setDietaryPrefs(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Recipes List */}
      {recipes.length > 0 ? (
        <div className="space-y-5">
          {recipes.map((rec) => (
            <RescueRecipeCard
              key={rec.id}
              recipe={rec}
              householdId={householdId}
              onCookSuccess={() => {
                // Actualizar o refrescar
              }}
            />
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <ChefHat className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              ¿Listo para cocinar y rescatar alimentos?
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              Toca el botón superior para que Gemini 3.7 Flash analice tus alimentos en riesgo y proponga recetas Zero-Waste al instante.
            </p>
          </div>
        )
      )}
    </div>
  );
}
