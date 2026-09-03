'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  Award,
  CheckCircle2,
  Clock,
  Mail,
  QrCode,
  Printer,
  Sparkles,
  TrendingUp,
  Download,
  AlertCircle,
  ShieldCheck,
  Building2,
  Calendar,
  Check,
  PlusCircle,
  Edit3,
  UserCheck,
  UserX,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { EventItem } from '@ifam-eventos/types';
import { fetchApi, API_BASE_URL } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { ALL_IFAM_CAMPI } from '../../../lib/constants';
import { ProtectedStateCard } from '../../../components/ProtectedStateCard';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'pending' | 'users' | 'moderation'>('analytics');
  const [publishedEvents, setPublishedEvents] = useState<EventItem[]>([]);
  const [pendingEvents, setPendingEvents] = useState<EventItem[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [reportedPosts, setReportedPosts] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const isAdminMaster = user?.role === 'ADMIN_MASTER' || user?.role === 'SUPER_ADMIN';
  const isAdminUnidade = user?.role === 'ADMIN_UNIDADE';
  const isAdmin = isAdminMaster || isAdminUnidade;

  const [selectedCampusFilter, setSelectedCampusFilter] = useState<string>('ALL');

  const loadData = async () => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const pubData = await fetchApi<{ events: EventItem[] }>('/events');
      setPublishedEvents(pubData.events || []);

      if (isAdmin) {
        const pendData = await fetchApi<{ events: EventItem[] }>('/events/admin/pending');
        setPendingEvents(pendData.events || []);

        const usersData = await fetchApi<{ users: any[] }>('/users');
        setUserList(usersData.users || []);

        const reportsData = await fetchApi<{ reports: any[] }>('/events/admin/reports');
        setReportedPosts(reportsData.reports || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAttendanceCsv = async (eventId: string, eventTitle: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('ifam_token') || localStorage.getItem('@ifam_eventos:token') : '';
      const response = await fetch(`${API_BASE_URL}/analytics/events/${eventId}/export-attendance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao exportar planilha de frequências.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_frequencia_${eventTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Erro ao exportar arquivo CSV.');
    }
  };

  const handleResolveReport = async (reportId: string, action: 'BAN_POST' | 'DISMISS') => {
    try {
      await fetchApi(`/events/admin/reports/${reportId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      alert(action === 'BAN_POST' ? 'Publicação removida com sucesso!' : 'Denúncia descartada e publicação mantida.');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao resolver denúncia.');
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (!authLoading && (!user || !isAdmin)) {
    return (
      <ProtectedStateCard
        title="Painel de Administração Restrito"
        description="Esta área é reservada para Administradores de Campus e Coordenadores de Eventos do IFAM. Faça login com um perfil autorizado."
      />
    );
  }

  const handleApproveEvent = async (eventId: string) => {
    setApprovingId(eventId);
    try {
      const res = await fetchApi<{ message: string }>(`/events/${eventId}/approve`, {
        method: 'PATCH',
      });
      alert(res.message || 'Evento aprovado e publicado com sucesso!');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao aprovar evento.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await fetchApi(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      alert(`Função do usuário atualizada para ${newRole}!`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar função.');
    }
  };

  const handleUpdateUserCategory = async (userId: string, newCategory: string) => {
    try {
      await fetchApi(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ category: newCategory }),
      });
      alert(`Categoria/Vínculo do usuário atualizado para ${newCategory}!`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar categoria.');
    }
  };

  const handleUpdateUserCampus = async (userId: string, newCampus: string) => {
    try {
      await fetchApi(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ campus: newCampus }),
      });
      alert(`Campus do usuário atualizado para ${newCampus}!`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar campus.');
    }
  };

  const handleToggleUserSuspension = async (userId: string, currentStatus: boolean) => {
    try {
      await fetchApi(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isSuspended: !currentStatus }),
      });
      alert(`Conta do usuário ${!currentStatus ? 'suspensa' : 'reativada'} com sucesso!`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status da conta.');
    }
  };

  const filteredUsers = userList.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.campus && u.campus.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Cabeçalho do Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Painel Institucional IFAM • {user?.campus ? `Admin do ${user.campus}` : 'Admin Geral (Reitoria)'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Gestão Integrada de Eventos e Usuários
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/eventos/novo"
            className="px-4 py-2.5 rounded-2xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Novo Evento</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Métricas e Eventos Ativos ({publishedEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Aprovações Pendentes</span>
          {pendingEvents.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
              {pendingEvents.length}
            </span>
          )}
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${
              activeTab === 'moderation'
                ? 'bg-rose-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Moderação do Feed</span>
            {reportedPosts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
                {reportedPosts.length}
              </span>
            )}
          </button>
        )}

        {isAdminMaster && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestão de Usuários ({userList.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: MÉTRICAS E EVENTOS PUBLICADOS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Eventos Publicados</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{publishedEvents.length}</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Aprovações Pendentes</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{pendingEvents.length}</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Total de Inscritos</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {publishedEvents.reduce((acc, ev) => acc + (ev.currentRegistrations || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Eventos Ativos no Catálogo Público
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {publishedEvents.map((ev) => (
                <div key={ev.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                      {ev.category || 'EVENTO IFAM'} • {ev.campus || 'Campus Manaus Centro'}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{ev.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{ev.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Publicado
                    </span>

                    <button
                      onClick={() => handleExportAttendanceCsv(ev.id, ev.title)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition"
                      title="Exportar Planilha de Frequências (CSV/Excel)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar Presenças</span>
                    </button>

                    <Link
                      href={`/admin/eventos/${ev.id}/editar`}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Evento</span>
                    </Link>

                    <Link
                      href={`/eventos/${ev.slug}`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                    >
                      Ver no Portal
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APROVAÇÕES PENDENTES */}
      {activeTab === 'pending' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Fila de Aprovação do Super Admin
              </h3>
              <p className="text-xs text-slate-500">
                Novos eventos cadastrados por organizadores aguardam revisão antes de serem publicados na página inicial pública.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-xs">
              {pendingEvents.length} Pendentes
            </span>
          </div>

          {pendingEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Não há eventos aguardando aprovação no momento!
              </p>
              <p className="text-xs">Todos os eventos submetidos já foram revisados e publicados.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white">
                        Aguardando Aprovação
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Submetido por: <strong>{ev.organizer?.name || 'Organizador'}</strong> ({ev.campus || 'IFAM'})
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{ev.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                      {ev.description}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      href={`/admin/eventos/${ev.id}/editar`}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-300 transition"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Editar</span>
                    </Link>

                    {isAdmin ? (
                      <button
                        onClick={() => handleApproveEvent(ev.id)}
                        disabled={approvingId === ev.id}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition duration-200 active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>{approvingId === ev.id ? 'Aprovando...' : 'Aprovar e Publicar Evento'}</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-3 py-2 rounded-xl">
                        Aguardando Aprovação do Admin
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GESTÃO DE USUÁRIOS (ADMIN MASTER) */}
      {activeTab === 'users' && isAdminMaster && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Gestão Institucional de Usuários e Permissões
              </h3>
              <p className="text-xs text-slate-500">
                Visualize os usuários cadastrados no banco de dados, altere funções (Roles) e suspenda ou reative contas.
              </p>
            </div>

            {/* Campo de Busca de Usuário */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou campus..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black">
                  <th className="py-3 px-2">Usuário</th>
                  <th className="py-3 px-2">Categoria / Campus</th>
                  <th className="py-3 px-2">Função (Role)</th>
                  <th className="py-3 px-2">Status da Conta</th>
                  <th className="py-3 px-2 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-unifik-primary text-white font-bold flex items-center justify-center text-xs overflow-hidden">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-2 space-y-1">
                      <select
                        value={u.category || 'ALUNO'}
                        onChange={(e) => handleUpdateUserCategory(u.id, e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                      >
                        <option value="PROFESSOR">PROFESSOR (Docente)</option>
                        <option value="TECNICO">TÉCNICO (TAE)</option>
                        <option value="PESQUISADOR">PESQUISADOR</option>
                        <option value="ALUNO">ALUNO (Discente)</option>
                        <option value="EXTERNO">EXTERNO</option>
                      </select>

                      <select
                        value={u.campus || 'Campus Manaus Centro'}
                        onChange={(e) => handleUpdateUserCampus(u.id, e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] text-slate-500 font-semibold"
                      >
                        {ALL_IFAM_CAMPI.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-2">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                      >
                        <option value="USUARIO">USUÁRIO (Participante / Servidor)</option>
                        <option value="ADMIN_UNIDADE">ADMIN_UNIDADE (Admin do Campus)</option>
                        <option value="ADMIN_MASTER">ADMIN_MASTER (Admin Reitoria)</option>
                      </select>
                    </td>

                    <td className="py-3 px-2">
                      {u.isSuspended ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 flex items-center gap-1 w-fit">
                          <ShieldAlert className="w-3 h-3" /> Suspensa
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Ativa
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleToggleUserSuspension(u.id, u.isSuspended)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center gap-1.5 ml-auto ${
                          u.isSuspended
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        {u.isSuspended ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Reativar Conta</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Suspender</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MODERAÇÃO DO FEED SOCIAL (DENÚNCIAS) */}
      {activeTab === 'moderation' && isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Central de Moderação do Feed & Denúncias</span>
              </h3>
              <p className="text-xs text-slate-500">
                Revise publicações reportadas por participantes do IFAM e tome decisões de moderação.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold text-xs">
              {reportedPosts.length} Denúncias Ativas
            </span>
          </div>

          {reportedPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Nenhuma publicação denunciada no momento!
              </p>
              <p className="text-xs">A comunidade do IFAM Eventos está interagindo em perfeita conformidade.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {reportedPosts.map((rep) => (
                <div
                  key={rep.id}
                  className="p-5 rounded-2xl bg-rose-50/30 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white">
                        Motivo: {rep.reason}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(rep.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {rep.details && (
                      <p className="text-xs text-rose-800 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-900/40 p-2 rounded-xl italic">
                        "{rep.details}"
                      </p>
                    )}

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                          {rep.post?.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {rep.post?.user?.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {rep.post?.user?.category} • {rep.post?.user?.campus || 'IFAM'}
                          </p>
                        </div>
                      </div>

                      {rep.post?.content && (
                        <p className="text-xs text-slate-700 dark:text-slate-200">
                          {rep.post.content}
                        </p>
                      )}

                      {rep.post?.mediaUrl && (
                        <div className="rounded-lg overflow-hidden max-h-48 border border-slate-200 dark:border-slate-700">
                          <img
                            src={rep.post.mediaUrl}
                            alt="Mídia denunciada"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <p className="text-[10px] text-slate-400 font-semibold pt-1">
                        Evento: <strong>{rep.post?.event?.title}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleResolveReport(rep.id, 'DISMISS')}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition text-center"
                    >
                      Manter Post (Descartar Denúncia)
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.id, 'BAN_POST')}
                      className="flex-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition text-center"
                    >
                      Banir Publicação
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
