'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
      <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/50 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shadow-lg">
        <AlertTriangle className="w-9 h-9" />
      </div>

      <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
        Algo Não Saiu Como Esperado (500)
      </h1>

      <p className="text-xs md:text-sm text-slate-500 max-w-md">
        Ocorreu um erro temporário no servidor da plataforma. Tente recarregar a página ou voltar ao início.
      </p>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs shadow-md hover:bg-slate-900 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Tentar Novamente</span>
        </button>

        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Início</span>
        </Link>
      </div>
    </div>
  );
}
