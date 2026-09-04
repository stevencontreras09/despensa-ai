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
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 h-15 sm:h-16 flex items-center justify-between gap-2">
        {/* Logo & Household */}
        <Link href="/dashboard" className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25 shrink-0">
            <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight truncate max-w-[130px] sm:max-w-[200px]">
              {householdName || 'Mi Despensa'}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400">
              <span className="hidden sm:inline truncate max-w-[140px]">{userEmail}</span>
              {userRole === 'admin' && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[9px] sm:text-[10px] shrink-0">
                  <Shield className="w-2.5 h-2.5" />
                  Admin
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Invite Code Badge & Logout */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {inviteCode && (
            <button
              onClick={copyCode}
              title="Haz clic para copiar el código de invitación"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-stone-200 dark:border-stone-700 font-mono transition-colors"
            >
              <span className="hidden md:inline text-[10px] uppercase font-sans tracking-wider text-stone-400">
                Código:
              </span>
              <span className="font-bold text-[11px] sm:text-xs tracking-tight">{inviteCode}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              )}
            </button>
          )}

          <form action={logoutAction} className="shrink-0">
            <button
              type="submit"
              title="Cerrar sesión"
              className="p-1.5 sm:p-2 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
