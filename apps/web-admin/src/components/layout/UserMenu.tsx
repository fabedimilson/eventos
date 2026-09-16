'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  User,
  ChevronDown,
  LayoutDashboard,
  PlusCircle,
  ShieldCheck,
  Award,
  Calendar,
  Building2,
  GraduationCap,
  Megaphone,
} from 'lucide-react';

interface UserMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function UserMenu({ isOpen, onToggle, onClose }: UserMenuProps) {
  const { user, logout } = useAuth();

  const isServidorOrAdmin = user && (
    user.category === 'PROFESSOR' ||
    user.category === 'TECNICO' ||
    user.category === 'SERVIDOR' ||
    user.role === 'ADMIN_UNIDADE' ||
    user.role === 'ADMIN_MASTER' ||
    user.role === 'ADMIN' ||
    user.role === 'ORGANIZADOR'
  );

  const isAdmin = user && (
    user.role === 'ADMIN_UNIDADE' ||
    user.role === 'ADMIN_MASTER' ||
    user.role === 'ADMIN' ||
    user.role === 'SUPER_ADMIN' ||
    user.role === 'ORGANIZADOR'
  );

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Botão com Avatar e Nome do Usuário */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-full sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 shadow-xs"
      >
        <div className="w-8 h-8 rounded-full bg-unifik-primary text-white flex items-center justify-center font-extrabold text-xs shadow-xs overflow-hidden ring-2 ring-emerald-500/20">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : user ? (
            user.name.charAt(0)
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>
        <span className="hidden sm:inline-block text-xs font-bold max-w-[130px] truncate text-slate-800 dark:text-slate-100">
          {user ? user.name : 'Visitante'}
        </span>
        <ChevronDown className="hidden sm:inline-block w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Menu Dropdown Conectado */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-fade-in space-y-2 text-xs">
          {/* Card da Conta Ativa */}
          {user && (
            <div className="p-3 bg-gradient-to-br from-slate-50 to-emerald-50/40 dark:from-slate-800/80 dark:to-emerald-950/30 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                  Conta Conectada
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {user.category}
                </span>
              </div>
              <p className="font-black text-slate-900 dark:text-white text-sm truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              <p className="text-[10px] text-slate-400 truncate font-semibold">📍 {user.campus || 'IFAM'}</p>
            </div>
          )}

          {/* Ações e Atalhos Reais */}
          <div className="space-y-1 pt-1">
            <Link
              href="/perfil"
              onClick={onClose}
              className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-2.5 transition text-xs"
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>Meu Perfil e Certificados</span>
            </Link>

            <Link
              href="/calendario-academico"
              onClick={onClose}
              className="w-full p-2.5 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/40 text-violet-800 dark:text-violet-300 font-bold flex items-center gap-2.5 transition text-xs"
            >
              <Calendar className="w-4 h-4 text-violet-600" />
              <span>Calendário Acadêmico</span>
            </Link>

            {isServidorOrAdmin && (
              <>
                <Link
                  href="/admin/eventos/novo"
                  onClick={onClose}
                  className="w-full p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-unifik-violet-600 dark:text-emerald-300 font-bold flex items-center gap-2.5 transition text-xs"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>+ Criar Novo Evento</span>
                </Link>

                <Link
                  href="/admin/avisos/novo"
                  onClick={onClose}
                  className="w-full p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-2.5 transition text-xs"
                >
                  <Megaphone className="w-4 h-4 text-amber-600" />
                  <span>📢 Publicar Alerta / Aviso</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <p className="px-2.5 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Gestão do Campus & Eventos
                </p>
                <Link
                  href="/admin/dashboard"
                  onClick={onClose}
                  className="w-full p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-extrabold flex items-center gap-2.5 transition text-xs shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Painel do Campus ({user?.campus ? user.campus.replace('Campus ', '') : 'Unidade'})</span>
                </Link>

                <Link
                  href="/admin/campuses"
                  onClick={onClose}
                  className="w-full p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-2.5 transition text-xs"
                >
                  <Building2 className="w-4 h-4 text-violet-600" />
                  <span>Campi & Unidades</span>
                </Link>

                <Link
                  href="/admin/cursos-turmas"
                  onClick={onClose}
                  className="w-full p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-2.5 transition text-xs"
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>Cursos & Turmas</span>
                </Link>

                <Link
                  href="/admin/calendario-academico"
                  onClick={onClose}
                  className="w-full p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-2.5 transition text-xs"
                >
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Gerenciar Calendário</span>
                </Link>
              </div>
            )}
          </div>

          {/* Encerrar Sessão */}
          {user && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl text-left flex items-center gap-2.5 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 font-bold transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
