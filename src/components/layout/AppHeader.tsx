'use client';

import { useState } from 'react';
import Link from 'next/link';
import { logoutAction } from '@/app/(auth)/actions';
import { UtensilsCrossed, LogOut, Copy, Check, Shield } from 'lucide-react';

interface AppHeaderProps {
  householdName: string;
  inviteCode: string;
  userEmail: string;
  userRole?: string;
}

export function AppHeader({
  householdName,
  inviteCode,
  userEmail,
  userRole = 'member',
}: AppHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-stone-900/85 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Household */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-stone-900 dark:text-white leading-tight">
              {householdName || 'Mi Despensa'}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
              <span className="truncate max-w-[120px] sm:max-w-[160px]">{userEmail}</span>
              {userRole === 'admin' && (
                <span className="inline-flex items-center gap-0.5 px-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">
                  <Shield className="w-2.5 h-2.5" />
                  Admin
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Invite Code Badge & Logout */}
        <div className="flex items-center gap-2">
          {inviteCode && (
            <button
              onClick={copyCode}
              title="Haz clic para copiar el código de invitación de 12 caracteres"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-stone-200 dark:border-stone-700 text-xs font-mono transition-colors"
            >
              <span className="text-[10px] uppercase font-sans tracking-wider text-stone-400">Código:</span>
              <span className="font-bold">{inviteCode}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-stone-400" />
              )}
            </button>
          )}

          <form action={logoutAction}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="p-2 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
