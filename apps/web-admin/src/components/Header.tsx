'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { TheIfamEventsLogo } from './TheIfamEventsLogo';
import { AuthModal } from './AuthModal';
import { UserMenu } from './layout/UserMenu';
import { NotificationDrawer } from './NotificationDrawer';
import {
  Calendar,
  BarChart3,
  Users,
  Award,
  ShieldCheck,
  PlusCircle,
  LogIn,
  Moon,
  Sun,
  Menu,
  X,
  LayoutDashboard,
  User,
  Send,
  ShieldAlert,
  History,
  Search,
} from 'lucide-react';
import { EmergencyModal } from './EmergencyModal';
import { EmergencyHistoryModal } from './EmergencyHistoryModal';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, unreadChatCount, clearUnreadChatCount } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyHistoryOpen, setEmergencyHistoryOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN_MASTER' || user.role === 'ADMIN_UNIDADE' || user.role === 'ORGANIZADOR');

  const publicNavItems = [
    { label: 'Eventos', href: '/', icon: Calendar, requiresAuth: false },
    { label: 'Calendário Acadêmico', href: '/calendario-academico', icon: Calendar, requiresAuth: false },
    { label: 'Networking & Chat', href: '/networking', icon: Send, requiresAuth: true },
    { label: 'Meus Certificados', href: '/certificados', icon: Award, requiresAuth: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Oficial IFAM EVENTOS (Link para a Home / Catálogo) */}
            <Link href="/" className="group flex items-center hover:opacity-90 transition-opacity" title="Voltar para a Página Inicial">
              <TheIfamEventsLogo size="md" />
            </Link>

            {/* Barra de Busca Global & Navegação Desktop (Preenche o centro do Header) */}
            <div className="hidden md:flex items-center gap-3 flex-1 max-w-lg mx-4 lg:mx-8">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && headerSearch.trim()) {
                      router.push(`/?search=${encodeURIComponent(headerSearch.trim())}`);
                    }
                  }}
                  placeholder="Buscar eventos, palestras..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-violet-500/40 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition"
                />
              </div>

              <nav className="flex items-center gap-1 shrink-0">
                <Link
                  href="/"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/'
                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Eventos
                </Link>
                <Link
                  href="/calendario-academico"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    pathname === '/calendario-academico'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendário</span>
                </Link>
                <Link
                  href="/networking"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/networking'
                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Networking
                </Link>
              </nav>
            </div>

            {/* Ações Diretas: Calendário Rápido, Chat Aviãozinho, SOS, Notificações, Perfil */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Botão de Atalho Rápido ao Calendário (Sempre visível mesmo no mobile) */}
              <Link
                href="/calendario-academico"
                className={`md:hidden p-2 rounded-xl transition flex items-center gap-1 text-xs font-bold ${
                  pathname === '/calendario-academico'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                }`}
                title="Calendário Acadêmico Institucional"
              >
                <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-300" />
              </Link>
              {/* Ícone Estilo Aviãozinho do Instagram (Networking & Chat Direct) - Oculto no mobile pois já tem na BottomNav */}
              <Link
                href="/networking"
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault();
                    setAuthModalOpen(true);
                  }
                }}
                className={`hidden md:flex p-2 rounded-xl transition relative ${
                  pathname === '/networking'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Networking & Chat Direct"
              >
                <Send className="w-4 h-4 -rotate-12" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce shadow-xs">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
              </Link>

              {/* Botão de Emergência SOS IFAM Guard */}
              <button
                onClick={() => {
                  if (!user) {
                    setAuthModalOpen(true);
                  } else {
                    setEmergencyModalOpen(true);
                  }
                }}
                className="flex px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] sm:text-xs shadow-md transition active:scale-95 items-center gap-1 cursor-pointer"
                title="Botão de Emergência & Chamada de Testemunhas"
              >
                <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 animate-pulse" />
                <span className="inline">SOS</span>
              </button>

              {/* Botão de Histórico de Ocorrências do Campus */}
              <button
                onClick={() => {
                  if (!user) {
                    setAuthModalOpen(true);
                  } else {
                    setEmergencyHistoryOpen(true);
                  }
                }}
                className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Histórico de Ocorrências do Campus"
              >
                <History className="w-4 h-4" />
              </button>

              {/* Central de Notificações - Fica visível no mobile */}
              {user && <NotificationDrawer />}

              {/* Botão de Tema (Dark / Light) - Oculto no mobile */}
              <button
                onClick={toggleTheme}
                className="hidden md:flex p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Alternar Tema"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              {/* Autenticação / Menu do Usuário */}
              {!user ? (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Entrar</span>
                </button>
              ) : (
                <UserMenu
                  isOpen={profileDropdownOpen}
                  onToggle={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  onClose={() => setProfileDropdownOpen(false)}
                />
              )}

              {/* Botão do Menu Mobile - Oculto agora que temos BottomNav */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile Dropped */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2 text-xs">
            {publicNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    if (item.requiresAuth && !user) {
                      e.preventDefault();
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    } else {
                      setMobileMenuOpen(false);
                    }
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  <Icon className="w-4 h-4 text-unifik-primary" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {isServidorOrAdmin && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gestão do Evento</p>
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                  >
                    <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                    <span>Dashboard Organizador</span>
                  </Link>
                )}
                <Link
                  href="/admin/eventos/novo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-unifik-primary text-white font-bold"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Criar Novo Evento</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Modal de Autenticação */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* MODAIS DO SISTEMA IFAM GUARD (EMERGÊNCIA E HISTÓRICO DE OCORRÊNCIAS) */}
      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />

      <EmergencyHistoryModal
        isOpen={emergencyHistoryOpen}
        onClose={() => setEmergencyHistoryOpen(false)}
      />
    </>
  );
}
