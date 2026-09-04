'use client';

import { useState, useActionState } from 'react';
import { createHouseholdAction, joinHouseholdAction, HouseholdActionResult } from '../actions';
import { Home, Users, PlusCircle, ArrowRight, Loader2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';

export default function SetupHouseholdPage() {
  const [mode, setMode] = useState<'create' | 'join'>('create');

  const [createState, createAction, isCreating] = useActionState<HouseholdActionResult | null, FormData>(
    createHouseholdAction,
    null
  );

  const [joinState, joinAction, isJoining] = useActionState<HouseholdActionResult | null, FormData>(
    joinHouseholdAction,
    null
  );

  const activeError = mode === 'create' ? createState?.error : joinState?.error;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-b from-emerald-50/50 via-white to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 mb-4">
            <Home className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
            Configuración del Hogar
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">
            DespensaAI sincroniza el inventario en tiempo real con todos los miembros de tu casa
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1.5 bg-stone-100 dark:bg-stone-800/80 rounded-2xl mb-6 border border-stone-200 dark:border-stone-700/60">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              mode === 'create'
                ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Crear Hogar
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              mode === 'join'
                ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Unirme con Código
          </button>
        </div>

        {/* Card Container */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-stone-200/50 dark:shadow-none">
          {activeError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <span>{activeError}</span>
            </div>
          )}

          {mode === 'create' ? (
            <form action={createAction} className="space-y-5">
              <div>
                <label
                  htmlFor="household-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                >
                  Nombre del Hogar / Familia
                </label>
                <input
                  id="household-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Ej. Casa García o Piso Compartido"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              {/* Automatic Default Locations Info */}
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Zonas precargadas automáticamente:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                  <span className="bg-white/80 dark:bg-stone-900/60 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                    🧊 Nevera
                  </span>
                  <span className="bg-white/80 dark:bg-stone-900/60 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                    ❄️ Congelador
                  </span>
                  <span className="bg-white/80 dark:bg-stone-900/60 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                    🌾 Despensa Seca
                  </span>
                  <span className="bg-white/80 dark:bg-stone-900/60 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                    🍎 Frutero
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                Se generará un código único de 12 caracteres para que invites a tu familia.
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando hogar...
                  </>
                ) : (
                  <>
                    Crear Hogar y Empezar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form action={joinAction} className="space-y-5">
              <div>
                <label
                  htmlFor="invite-code"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                >
                  Código de Invitación (12 Caracteres)
                </label>
                <input
                  id="invite-code"
                  name="invite_code"
                  type="text"
                  required
                  maxLength={12}
                  placeholder="Ej. K7M9X2P4Q8W1"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-white placeholder-stone-400 font-mono tracking-widest text-center uppercase text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 text-center">
                  Pídele al creador del hogar el código de 12 caracteres disponible en Ajustes
                </p>
              </div>

              <button
                type="submit"
                disabled={isJoining}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validando código...
                  </>
                ) : (
                  <>
                    Unirme al Hogar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
