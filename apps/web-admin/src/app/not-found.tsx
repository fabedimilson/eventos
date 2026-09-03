'use client';

import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
      <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/20 flex items-center justify-center text-unifik-primary dark:text-emerald-400 shadow-lg">
        <FileQuestion className="w-9 h-9" />
      </div>

      <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
        Página Não Encontrada (404)
      </h1>

      <p className="text-xs md:text-sm text-slate-500 max-w-md">
        O endereço que você tentou acessar não existe ou foi movido na plataforma IFAM Eventos.
      </p>

      <Link
        href="/"
        className="px-6 py-3 rounded-2xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-xs shadow-lg transition flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao Portal de Eventos</span>
      </Link>
    </div>
  );
}
