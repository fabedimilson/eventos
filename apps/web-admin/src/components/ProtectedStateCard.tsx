'use client';

import React, { useState } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { AuthModal } from './AuthModal';

interface ProtectedStateCardProps {
  title?: string;
  description?: string;
}

export function ProtectedStateCard({
  title = 'Acesso Restrito',
  description = 'Você precisa estar conectado à sua conta do IFAM Eventos para acessar esta área, seus certificados e o chat de networking.',
}: ProtectedStateCardProps) {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-5 shadow-xl animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
        <Lock className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
      <button
        onClick={() => setAuthModalOpen(true)}
        className="w-full py-3 rounded-2xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
      >
        <LogIn className="w-4 h-4" />
        <span>Fazer Login / Criar Conta</span>
      </button>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
