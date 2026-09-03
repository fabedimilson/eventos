'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  BarChart3,
  Users,
  Award,
  ShieldCheck,
  Mail,
  LogOut,
  UserCheck,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const { user, login, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navItems = [
    { label: 'Eventos', href: '/', icon: Calendar },
    { label: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    { label: 'RSVP & Flowup', href: '/admin/rsvp', icon: Mail },
    { label: 'Networking & Chat', href: '/networking', icon: Users },
    { label: 'Meus Certificados', href: '/certificados', icon: Award },
    { label: 'Validar Autenticidade', href: '/validar', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-emerald-900/10 dark:border-emerald-500/10 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo IFAM Institucional */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-unifik-primary to-unifik-primary flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform">
              <span className="text-lg tracking-tighter">IF</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-base text-unifik-primary dark:text-emerald-400 tracking-tight">
                  IFAM
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-ifam-red-700 text-white font-semibold uppercase">
                  Eventos
                </span>
              </div>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                Instituto Federal do Amazonas
              </p>
            </div>
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-unifik-violet-50 dark:bg-emerald-950/40 text-unifik-primary dark:text-emerald-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Ações / Perfil / Tema e Menu Mobile */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Alternar Tema"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full self-end font-semibold uppercase bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                    {user.category}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-ifam-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => login('aluno1@ifam.edu.br')}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-unifik-primary text-white hover:bg-unifik-violet-600 shadow-sm transition"
              >
                Entrar
              </button>
            )}

            {/* Botão do Menu Hambúrguer para Telas Pequenas (Mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Hambúrguer Desdobrável no Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 space-y-1 shadow-lg animate-fade-in">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-unifik-violet-50 dark:bg-emerald-950/50 text-unifik-primary dark:text-emerald-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 text-emerald-600" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
