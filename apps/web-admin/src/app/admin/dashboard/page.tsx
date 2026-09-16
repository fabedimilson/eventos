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
  Trash2,
  AlertTriangle,
  Megaphone,
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { EventItem } from '@ifam-eventos/types';
import { fetchApi, API_BASE_URL } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { ALL_IFAM_CAMPI } from '../../../lib/constants';
import { ProtectedStateCard } from '../../../components/ProtectedStateCard';

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  campus: string;
  targetAudience: string;
  requiresAcknowledgment: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  publisherName: string;
  publisherRole: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalAcks: number;
    totalViews: number;
  };
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'pending' | 'users' | 'moderation' | 'notices'>('analytics');
  const [publishedEvents, setPublishedEvents] = useState<EventItem[]>([]);
  const [pendingEvents, setPendingEvents] = useState<EventItem[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [reportedPosts, setReportedPosts] = useState<any[]>([]);
  const [noticesList, setNoticesList] = useState<NoticeItem[]>([]);
  const [noticeSearch, setNoticeSearch] = useState('');
  const [noticeStatusFilter, setNoticeStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [noticeToEdit, setNoticeToEdit] = useState<NoticeItem | null>(null);
  const [noticeToDelete, setNoticeToDelete] = useState<NoticeItem | null>(null);
  const [noticeActionLoading, setNoticeActionLoading] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [featuringId, setFeaturingId] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    try {
      setDeletingId(eventToDelete.id);
      await fetchApi(`/events/${eventToDelete.id}`, { method: 'DELETE' });
      setPublishedEvents((prev) => prev.filter((ev) => ev.id !== eventToDelete.id));
      setPendingEvents((prev) => prev.filter((ev) => ev.id !== eventToDelete.id));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir evento.');
    } finally {
      setDeletingId(null);
      setEventToDelete(null);
    }
  };

  const handleToggleNoticeStatus = async (noticeId: string, currentStatus: string) => {
    try {
      setNoticeActionLoading(noticeId);
      const newStatus = currentStatus === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
      await fetchApi(`/notices/${noticeId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setNoticesList((prev) =>
        prev.map((n) => (n.id === noticeId ? { ...n, status: newStatus as any } : n))
      );
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do comunicado.');
    } finally {
      setNoticeActionLoading(null);
    }
  };

  const handleSaveEditNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeToEdit) return;
    try {
      setNoticeActionLoading(noticeToEdit.id);
      await fetchApi(`/notices/${noticeToEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: noticeToEdit.title,
          content: noticeToEdit.content,
          severity: noticeToEdit.severity,
          campus: noticeToEdit.campus,
          targetAudience: noticeToEdit.targetAudience,
          requiresAcknowledgment: noticeToEdit.requiresAcknowledgment,
          status: noticeToEdit.status,
        }),
      });
      setNoticesList((prev) =>
        prev.map((n) => (n.id === noticeToEdit.id ? { ...n, ...noticeToEdit } : n))
      );
      setNoticeToEdit(null);
      alert('Alerta atualizado com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar comunicado.');
    } finally {
      setNoticeActionLoading(null);
    }
  };

  const handleDeleteNoticeConfirm = async () => {
    if (!noticeToDelete) return;
    try {
      setNoticeActionLoading(noticeToDelete.id);
      await fetchApi(`/notices/${noticeToDelete.id}`, {
        method: 'DELETE',
      });
      setNoticesList((prev) => prev.filter((n) => n.id !== noticeToDelete.id));
      setNoticeToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir comunicado.');
    } finally {
      setNoticeActionLoading(null);
    }
  };

  const isAdminMaster = user?.role === 'ADMIN_MASTER' || user?.role === 'SUPER_ADMIN';
  const isAdminUnidade = user?.role === 'ADMIN_UNIDADE' || user?.role === 'ORGANIZADOR';
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

        const noticesData = await fetchApi<{ notices: NoticeItem[] }>('/notices');
        setNoticesList(noticesData.notices || []);
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

  const handleToggleFeature = async (eventId: string) => {
    setFeaturingId(eventId);
    try {
      const res = await fetchApi<{ message: string; isFeatured: boolean }>(`/events/${eventId}/feature`, {
        method: 'PATCH',
      });
      alert(res.message || 'Destaque do evento alterado com sucesso!');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar destaque do evento.');
    } finally {
      setFeaturingId(null);
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

  const filteredUsers = userList.filter((u) => {
    // Se for ADMIN_UNIDADE (não Master), restringe estritamente aos usuários do seu próprio campus
    if (!isAdminMaster && user?.campus) {
      const matchCampus = u.campus && u.campus.toLowerCase().trim() === user.campus.toLowerCase().trim();
      if (!matchCampus) return false;
    }

    return (
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.campus && u.campus.toLowerCase().includes(userSearch.toLowerCase()))
    );
  });

  const filteredNotices = noticesList.filter((n) => {
    if (noticeStatusFilter !== 'ALL' && n.status !== noticeStatusFilter) {
      return false;
    }
    if (!noticeSearch.trim()) return true;
    const term = noticeSearch.toLowerCase();
    return (
      n.title.toLowerCase().includes(term) ||
      n.content.toLowerCase().includes(term) ||
      n.campus.toLowerCase().includes(term) ||
      n.publisherName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Cabeçalho do Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Painel Institucional • {user?.campus ? `Admin do ${user.campus}` : 'Administração Geral'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Gestão Integrada de Eventos e Usuários
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/avisos/novo"
            className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition"
          >
            <Megaphone className="w-4 h-4" />
            <span>📢 Novo Alerta / Comunicado</span>
          </Link>

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

        {isAdmin && (
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

        {isAdmin && (
          <button
            onClick={() => setActiveTab('notices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${
              activeTab === 'notices'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Alertas & Avisos</span>
            {noticesList.filter((n) => n.status === 'ACTIVE').length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {noticesList.filter((n) => n.status === 'ACTIVE').length}
              </span>
            )}
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
              {publishedEvents.map((ev) => {
                let isFeatured = false;
                try {
                  const cfg = typeof ev.customCssConfig === 'string' ? JSON.parse(ev.customCssConfig) : ev.customCssConfig;
                  isFeatured = Boolean(cfg?.isFeatured);
                } catch {}

                return (
                  <div key={ev.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                          {ev.category || 'EVENTO IFAM'} • {ev.campus || 'Campus Manaus Centro'}
                        </span>
                        {isFeatured && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-100 fill-amber-100" />
                            <span>Destaque no Portal</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{ev.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{ev.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Botão de Destaque Principal do Portal */}
                      <button
                        onClick={() => handleToggleFeature(ev.id)}
                        disabled={featuringId === ev.id}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          isFeatured
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs ring-2 ring-amber-400/40'
                            : 'bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 border border-slate-200 dark:border-slate-700'
                        }`}
                        title={isFeatured ? 'Clique para remover do destaque' : 'Clique para definir como o Evento em Destaque no topo da página inicial'}
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isFeatured ? 'text-white fill-white' : 'text-amber-500'}`} />
                        <span>{isFeatured ? '★ Em Destaque' : '☆ Destacar no Portal'}</span>
                      </button>

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

                      <button
                        onClick={() => setEventToDelete({ id: ev.id, title: ev.title })}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold transition flex items-center justify-center border border-rose-200 dark:border-rose-900/50 cursor-pointer"
                        title="Excluir este evento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        href={`/eventos/${ev.slug}`}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                      >
                        Ver no Portal
                      </Link>
                    </div>
                  </div>
                );
              })}
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

      {/* TAB 3: GESTÃO DE USUÁRIOS */}
      {activeTab === 'users' && isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAdminMaster
                  ? 'Gestão Global Multicampus de Usuários e Permissões'
                  : `Gestão de Usuários • ${user?.campus || 'Sua Unidade'}`}
              </h3>
              <p className="text-xs text-slate-500">
                {isAdminMaster
                  ? 'Visualize usuários de todos os campi, promova administradores e transfira de unidade.'
                  : `Visualize e modere os participantes e servidores do seu campus (${user?.campus || 'sua unidade'}).`}
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
                        <option value="BOLSISTA">BOLSISTA</option>
                        <option value="TERCEIRIZADO">TERCEIRIZADO</option>
                        <option value="ALUNO">ALUNO (Discente)</option>
                        <option value="EGRESSO">EGRESSO</option>
                        <option value="EXTERNO">EXTERNO</option>
                      </select>

                      {isAdminMaster ? (
                        <select
                          value={u.campus || 'Campus Manaus Centro'}
                          onChange={(e) => handleUpdateUserCampus(u.id, e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] text-slate-500 font-semibold"
                          title="Apenas Administrador Master pode transferir o campus"
                        >
                          {ALL_IFAM_CAMPI.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate">
                          📍 {u.campus || 'Sem campus'}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-2">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                      >
                        <option value="USUARIO">USUÁRIO (Participante / Servidor)</option>
                        <option value="ADMIN_UNIDADE">ADMIN_UNIDADE (Admin do Campus)</option>
                        {isAdminMaster && <option value="ADMIN_MASTER">ADMIN_MASTER (Admin Reitoria)</option>}
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

      {/* TAB 5: GESTÃO DE ALERTAS E AVISOS INSTITUCIONAIS */}
      {activeTab === 'notices' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header da Aba */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent border border-amber-300 dark:border-amber-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] uppercase tracking-wider">
                  Contingência & Comunicados Oficiais
                </span>
                <span className="text-xs text-slate-500">• {user?.campus || 'Todos os Campi'}</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-600" />
                Painel de Alertas e Avisos Institucionais
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
                Gerencie comunicados urgentes, greves de transporte, faltas de energia e notas acadêmicas. Avisos com status <strong>Ativo</strong> são exibidos em destaque no feed e topo do portal.
              </p>
            </div>

            <Link
              href="/admin/avisos/novo"
              className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition whitespace-nowrap self-start md:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Alerta / Aviso</span>
            </Link>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título, conteúdo ou autor..."
                value={noticeSearch}
                onChange={(e) => setNoticeSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setNoticeStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  noticeStatusFilter === 'ALL'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Todos ({noticesList.length})
              </button>
              <button
                type="button"
                onClick={() => setNoticeStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  noticeStatusFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Ativos ({noticesList.filter((n) => n.status === 'ACTIVE').length})
              </button>
              <button
                type="button"
                onClick={() => setNoticeStatusFilter('ARCHIVED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  noticeStatusFilter === 'ARCHIVED'
                    ? 'bg-slate-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Arquivados ({noticesList.filter((n) => n.status === 'ARCHIVED').length})
              </button>
            </div>
          </div>

          {/* Lista de Cards de Avisos */}
          {filteredNotices.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto text-xl">
                📢
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Nenhum comunicado encontrado
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {noticeSearch
                  ? 'Nenhum resultado corresponde aos termos da pesquisa.'
                  : 'Nenhum alerta ou comunicado foi publicado ainda para este campus.'}
              </p>
              <Link
                href="/admin/avisos/novo"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Criar Primeiro Alerta</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition shadow-sm hover:shadow-md space-y-3 relative ${
                    notice.status === 'ARCHIVED'
                      ? 'border-slate-200 dark:border-slate-800 opacity-70 bg-slate-50/50 dark:bg-slate-900/50'
                      : notice.severity === 'CRITICAL'
                      ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20'
                      : notice.severity === 'WARNING'
                      ? 'border-amber-300 dark:border-amber-900/60'
                      : 'border-blue-300 dark:border-blue-900/60'
                  }`}
                >
                  {/* Topo do Card */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Severidade */}
                      {notice.severity === 'CRITICAL' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          Crítico / Urgente
                        </span>
                      )}
                      {notice.severity === 'WARNING' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                          Atenção / Alerta
                        </span>
                      )}
                      {notice.severity === 'INFO' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider">
                          Informativo Geral
                        </span>
                      )}

                      {/* Status */}
                      {notice.status === 'ACTIVE' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Eye className="w-3 h-3 text-emerald-600" />
                          Ativo no Feed
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <EyeOff className="w-3 h-3 text-slate-500" />
                          Arquivado (Oculto)
                        </span>
                      )}

                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {notice.campus}
                      </span>

                      <span className="text-[11px] font-medium text-slate-400">•</span>

                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Público: {notice.targetAudience}
                      </span>
                    </div>

                    {/* Data de publicação */}
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(notice.createdAt).toLocaleDateString('pt-BR')} às {new Date(notice.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Título & Conteúdo */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                      {notice.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed whitespace-pre-wrap">
                      {notice.content}
                    </p>
                  </div>

                  {/* Rodapé e Ações */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {notice.requiresAcknowledgment ? (
                        <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {notice.stats?.totalAcks || 0} confirmações de ciência (&quot;Estou Ciente&quot;)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Sem confirmação obrigatória</span>
                      )}
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[11px] text-slate-400">Por: {notice.publisherName} ({notice.publisherRole})</span>
                    </div>

                    {/* BOTÕES DE AÇÃO: EDITAR, ARQUIVAR, EXCLUIR */}
                    <div className="flex items-center gap-2">
                      {/* Botão Editar */}
                      <button
                        type="button"
                        onClick={() => setNoticeToEdit(notice)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        title="Editar comunicado"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Editar</span>
                      </button>

                      {/* Botão Arquivar / Desarquivar */}
                      <button
                        type="button"
                        onClick={() => handleToggleNoticeStatus(notice.id, notice.status)}
                        disabled={noticeActionLoading === notice.id}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                          notice.status === 'ACTIVE'
                            ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        }`}
                        title={notice.status === 'ACTIVE' ? 'Tirar do feed (Arquivar)' : 'Reativar no feed'}
                      >
                        {notice.status === 'ACTIVE' ? (
                          <>
                            <Archive className="w-3.5 h-3.5 text-amber-600" />
                            <span>{noticeActionLoading === notice.id ? 'Alterando...' : 'Arquivar'}</span>
                          </>
                        ) : (
                          <>
                            <ArchiveRestore className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{noticeActionLoading === notice.id ? 'Alterando...' : 'Reativar no Feed'}</span>
                          </>
                        )}
                      </button>

                      {/* Botão Excluir */}
                      <button
                        type="button"
                        onClick={() => setNoticeToDelete(notice)}
                        disabled={noticeActionLoading === notice.id}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        title="Excluir comunicado permanentemente"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* POPUP DE CONFIRMAÇÃO DE EXCLUSÃO DE EVENTO */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Excluir este Evento?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tem certeza de que deseja excluir permanentemente o evento <strong className="text-slate-900 dark:text-slate-100">{eventToDelete.title}</strong>? Esta ação é irreversível e removerá todas as inscrições, programações e dados associados.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingId ? 'Excluindo...' : 'Sim, Excluir'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE ALERTA / COMUNICADO */}
      {noticeToEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Editar Alerta Institucional
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNoticeToEdit(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditNotice} className="space-y-4">
              {/* Nível de Urgência */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nível de Urgência
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNoticeToEdit({ ...noticeToEdit, severity: 'CRITICAL' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      noticeToEdit.severity === 'CRITICAL'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-600 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🔴 Crítico
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoticeToEdit({ ...noticeToEdit, severity: 'WARNING' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      noticeToEdit.severity === 'WARNING'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🟡 Atenção
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoticeToEdit({ ...noticeToEdit, severity: 'INFO' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      noticeToEdit.severity === 'INFO'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🔵 Informativo
                  </button>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título do Comunicado
                </label>
                <input
                  type="text"
                  required
                  value={noticeToEdit.title}
                  onChange={(e) => setNoticeToEdit({ ...noticeToEdit, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Conteúdo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Texto do Comunicado
                </label>
                <textarea
                  required
                  rows={4}
                  value={noticeToEdit.content}
                  onChange={(e) => setNoticeToEdit({ ...noticeToEdit, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {/* Campus e Público */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Campus de Destino
                  </label>
                  <select
                    value={noticeToEdit.campus}
                    onChange={(e) => setNoticeToEdit({ ...noticeToEdit, campus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Todos os Campi do IFAM">Todos os Campi do IFAM</option>
                    {ALL_IFAM_CAMPI.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Público-Alvo
                  </label>
                  <select
                    value={noticeToEdit.targetAudience}
                    onChange={(e) => setNoticeToEdit({ ...noticeToEdit, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="TODOS">Toda a Comunidade Acadêmica</option>
                    <option value="ALUNOS">Apenas Alunos</option>
                    <option value="SERVIDORES">Apenas Servidores (Professores e Técnicos)</option>
                  </select>
                </div>
              </div>

              {/* Status do Alerta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status de Publicação
                  </label>
                  <select
                    value={noticeToEdit.status}
                    onChange={(e) => setNoticeToEdit({ ...noticeToEdit, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="ACTIVE">🟢 Ativo no Feed / Portal</option>
                    <option value="ARCHIVED">⚪ Arquivado (Oculto do Feed)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={noticeToEdit.requiresAcknowledgment}
                      onChange={(e) => setNoticeToEdit({ ...noticeToEdit, requiresAcknowledgment: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Exigir Ciência Digital (&quot;Estou Ciente&quot;)</span>
                  </label>
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNoticeToEdit(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={Boolean(noticeActionLoading)}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  {noticeActionLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP DE CONFIRMAÇÃO DE EXCLUSÃO DE ALERTA */}
      {noticeToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Excluir este Alerta / Aviso?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tem certeza de que deseja excluir permanentemente o comunicado <strong className="text-slate-900 dark:text-slate-100">{noticeToDelete.title}</strong>? Esta ação é definitiva e removerá todos os registros de ciência digital vinculados.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNoticeToDelete(null)}
                disabled={Boolean(noticeActionLoading)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteNoticeConfirm}
                disabled={Boolean(noticeActionLoading)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{noticeActionLoading ? 'Excluindo...' : 'Sim, Excluir'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
