'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction, AuthActionResult } from '../actions';
import { Sparkles, UtensilsCrossed, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    registerAction,
    null
  );

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-b from-emerald-50/50 via-white to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 mb-4">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white flex items-center justify-center gap-2">
            DespensaAI
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium border border-emerald-300 dark:border-emerald-800">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              PWA
            </span>
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">
            Crea tu cuenta y empieza a ahorrar en tus compras
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-stone-200/50 dark:shadow-none">
          <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-6">
            Crear Cuenta Nueva
          </h2>

          {state?.error && (
            <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 text-sm ${
              state.success
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300'
            }`}>
              {state.success ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              )}
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="full_name"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Nombre Completo
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="Ej. Carlos Mendoza"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="Repite la contraseña"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  Registrarme y Configurar Hogar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 text-center">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              ¿Ya tienes una cuenta?{' '}
              <Link
                href="/login"
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
