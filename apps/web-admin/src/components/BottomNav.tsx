'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Award, User, LogIn, LayoutDashboard, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  const isServidorOrAdmin = user && (
    user.category === 'PROFESSOR' ||
    user.category === 'TECNICO' ||
    user.category === 'SERVIDOR' ||
    user.role === 'ORGANIZADOR' ||
    user.role === 'ADMIN' ||
    user.role === 'SUPER_ADMIN' ||
    user.role === 'ADMIN_MASTER' ||
    user.role === 'ADMIN_UNIDADE'
  );

  const isAdmin = user && (user.role === 'ADMIN_MASTER' || user.role === 'ADMIN_UNIDADE' || user.role === 'SUPER_ADMIN' || user.role === 'ORGANIZADOR');

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
        
        {/* Tab 1: Início */}
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center px-4 py-1 transition-all rounded-xl ${pathname === '/' ? 'bg-unifik-violet-100 dark:bg-emerald-950/40 text-unifik-primary dark:text-emerald-400 scale-95' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Home className={`w-5 h-5 ${pathname === '/' ? 'fill-unifik-primary dark:fill-emerald-400' : ''}`} />
          <span className="text-[10px] font-semibold mt-1">Início</span>
        </Link>

        {/* Tab 2: Eventos (Inscritos) */}
        <Link 
          href="/perfil#eventos" 
          className={`flex flex-col items-center justify-center px-4 py-1 transition-all rounded-xl ${pathname === '/meus-eventos' ? 'bg-unifik-violet-100 dark:bg-emerald-950/40 text-unifik-primary dark:text-emerald-400 scale-95' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Calendar className={`w-5 h-5 ${pathname === '/meus-eventos' ? 'fill-unifik-primary dark:fill-emerald-400' : ''}`} />
          <span className="text-[10px] font-semibold mt-1">Eventos</span>
        </Link>

        {/* Tab 3: Chat / Direct (Aviãozinho do Instagram) */}
        <Link 
          href="/networking" 
          className={`flex flex-col items-center justify-center px-4 py-1 transition-all rounded-xl ${pathname === '/networking' ? 'bg-unifik-violet-100 dark:bg-emerald-950/40 text-unifik-primary dark:text-emerald-400 scale-95' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Send className={`w-5 h-5 -rotate-12 ${pathname === '/networking' ? 'fill-unifik-primary dark:fill-emerald-400 text-unifik-primary dark:text-emerald-400' : ''}`} />
          <span className="text-[10px] font-semibold mt-1">Chat</span>
        </Link>

        {/* Tab 4: Perfil / Entrar */}
        {user ? (
          <Link 
            href="/perfil" 
            className={`flex flex-col items-center justify-center px-4 py-1 transition-all rounded-xl ${pathname === '/perfil' ? 'bg-unifik-violet-100 dark:bg-emerald-950/40 text-unifik-primary dark:text-emerald-400 scale-95' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <User className={`w-5 h-5 ${pathname === '/perfil' ? 'fill-unifik-primary dark:fill-emerald-400' : ''}`} />
            <span className="text-[10px] font-semibold mt-1">Perfil</span>
          </Link>
        ) : (
          <button 
            onClick={() => setAuthModalOpen(true)}
            className="flex flex-col items-center justify-center px-4 py-1 transition-all rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <LogIn className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Entrar</span>
          </button>
        )}
      </nav>

      {/* Modal de Autenticação */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
