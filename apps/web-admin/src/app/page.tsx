'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  Search,
  ArrowRight,
  Tv,
  CheckCircle2,
  Building2,
  Filter,
  User,
  Sparkles,
  Award,
  PlayCircle,
  Clock,
  Flame,
  Radio,
  History,
} from 'lucide-react';
import { EventItem } from '@ifam-eventos/types';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ALL_IFAM_CAMPI } from '../lib/constants';
import { StoriesBar } from '../components/StoriesBar';
import { NoticeBanner, NoticeItem } from '../components/NoticeBanner';
import { NoticeAuditModal } from '../components/NoticeAuditModal';
import { CreateNoticeModal } from '../components/CreateNoticeModal';
import { ActiveEmergencyWidget } from '../components/ActiveEmergencyWidget';
import { EmergencyRespondersModal } from '../components/EmergencyRespondersModal';
import { TicketPassModal } from '../components/TicketPassModal';
import { Send, ShieldAlert, CheckCircle, Navigation, QrCode, Ticket, FileCheck } from 'lucide-react';

const IFAM_CAMPI = [
  { id: 'ALL', label: 'Todos os Campi do IFAM' },
  ...ALL_IFAM_CAMPI.map((c) => ({ id: c, label: c })),
];

const CATEGORIES = [
  'Todos',
  'Educação',
  'Tecnologia',
  'Pesquisa',
  'Extensão',
  'Cultura',
  'Esporte',
  'Defesas',
  'Institucional',
  'Sustentabilidade',
];

export default function HomePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [selectedCampus, setSelectedCampus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'REAL' | 'DEMO'>('REAL');

  // Modais de Demonstração Interativa
  const [selectedNoticeForAudit, setSelectedNoticeForAudit] = useState<NoticeItem | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [demoRespondersOpen, setDemoRespondersOpen] = useState(false);
  const [demoPassOpen, setDemoPassOpen] = useState(false);
  const [demoNoticeAcknowledged, setDemoNoticeAcknowledged] = useState(false);

  // Define automaticamente o campus do usuário logado na inicialização
  useEffect(() => {
    if (user && user.campus) {
      if (user.campus.toLowerCase().includes('centro')) {
        setSelectedCampus('Manaus Centro');
      } else if (user.campus.toLowerCase().includes('zona leste')) {
        setSelectedCampus('Manaus Zona Leste');
      } else {
        setSelectedCampus('Manaus Centro');
      }
    }
  }, [user]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const query = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
        const data = await fetchApi<{ events: EventItem[] }>(`/events${query}`);
        setEvents(data.events || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [filterStatus]);

  const currentDate = new Date('2026-08-21');

  // Filtro inteligente por status temporal (Próximos vs Encerrados), campus, categoria e busca por texto
  const filteredEvents = events.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase());

    const matchCampus =
      selectedCampus === 'ALL' ||
      (e.locationName && e.locationName.toLowerCase().includes(selectedCampus.toLowerCase()));

    const matchCategory =
      selectedCategory === 'Todos' ||
      e.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      e.description.toLowerCase().includes(selectedCategory.toLowerCase());

    const eventEndDate = new Date(e.endDate);
    const isPast = eventEndDate < currentDate;

    let matchStatus = true;
    if (filterStatus === 'upcoming') {
      matchStatus = !isPast;
    } else if (filterStatus === 'past') {
      matchStatus = isPast;
    }

    return matchSearch && matchCampus && matchCategory && matchStatus;
  });

  const featuredEvent = events.find((e) => e.slug === 'snct-ifam-2026-ciencia-delas') || events[0];
  const selectedCampusObj = IFAM_CAMPI.find((c) => c.id === selectedCampus);

  return (
    <div className="space-y-8 animate-fade-in pt-2 pb-12">
      {/* SELETOR DE MODO: DADOS REAIS vs SHOWROOM DEMO */}
      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
            Ambiente da Plataforma:
          </span>
          <div className="flex items-center bg-white dark:bg-slate-950 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('REAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                viewMode === 'REAL'
                  ? 'bg-ifam-green-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>🏛️ Dados Reais (Produção)</span>
            </button>
            <button
              onClick={() => setViewMode('DEMO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                viewMode === 'DEMO'
                  ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-md animate-pulse'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Guia / Modo DEMO</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {viewMode === 'REAL'
            ? 'Conectado diretamente ao banco de dados SQLite/Prisma (Sem mocks na Home).'
            : '🌟 Showroom Interativo Ativo: Mostrando cenários completos para apresentações.'}
        </p>
      </div>

      {/* 1. TOPO UNIFICADO UX: SAUDAÇÃO À ESQUERDA & STORIES À DIREITA NA MESMA LINHA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        {/* Esquerda: Saudação do Usuário */}
        <div className="shrink-0 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Olá, {user ? user.name.split(' ')[0] : 'Visitante'}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
              <User className="w-3 h-3" />
              {user ? `${user.category}` : 'Público Geral'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {user
              ? `Eventos da sua unidade: ${selectedCampusObj?.label || user.campus}`
              : 'Confira os eventos disponíveis ou faça login'}
          </p>
        </div>

        {/* Direita: Stories dos Eventos Alinhados na Mesma Linha */}
        <div className="flex-1 max-w-full md:max-w-xl overflow-hidden">
          <StoriesBar events={events} />
        </div>
      </div>

      {/* CENÁRIO 1: MODO REAL (BANCO DE DADOS) */}
      {viewMode === 'REAL' && (
        <>
          {/* BANNER DE COMUNICADOS REAIS */}
          <NoticeBanner
            onOpenAuditModal={(noticeItem) => {
              setSelectedNoticeForAudit(noticeItem);
              setAuditModalOpen(true);
            }}
          />

          {/* CARD DE STATUS DA EMERGÊNCIA REAL ATIVA */}
          <ActiveEmergencyWidget
            onOpenHistory={() => {
              const btn = document.querySelector('button[title="Histórico de Ocorrências do Campus"]') as HTMLButtonElement;
              if (btn) btn.click();
            }}
          />
        </>
      )}

      {/* CENÁRIO 2: MODO DEMONSTRAÇÃO COMPLETA (SHOWROOM INTERATIVO) */}
      {viewMode === 'DEMO' && (
        <div className="space-y-4 animate-fade-in p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900/40 to-slate-900/90 border-2 border-amber-500/40 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                🧪 Showroom de Demonstração
              </span>
              <h2 className="text-sm font-extrabold text-amber-400">
                Apresentação dos Recursos de Segurança, Comunicação e Networking
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Clique nos botões interativos para simular os fluxos
            </span>
          </div>

          {/* 1. DEMO DO COMUNICADO INSTITUCIONAL DIREX */}
          <div className="w-full bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 rounded-3xl p-5 border-2 border-red-500/80 shadow-2xl text-white space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-red-600 text-white font-black text-[10px] uppercase">
                  🚨 ALERTA INSTITUCIONAL DE URGÊNCIA (DEMO)
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 font-bold text-[10px]">
                  📍 Campus Manaus Centro
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Publicado pela Direção Geral (DIREX/IFAM)</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-white">
                Suspensão das Aulas Presenciais no Campus Manaus Centro (27/08)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Devido à paralisação do transporte público coletivo e greve de ônibus em Manaus, as atividades acadêmicas presenciais nos turnos vespertino e noturno estão suspensas no Campus Manaus Centro.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDemoNoticeAcknowledged(!demoNoticeAcknowledged)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                    demoNoticeAcknowledged
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{demoNoticeAcknowledged ? '🟢 CIÊNCIA AUDITADA (Você)' : '✍️ Registrar Ciência Formal'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-white/10 text-[11px] font-bold text-slate-200">
                  📊 <strong>86% Cientes</strong> (1.420 auditados)
                </div>
                <button
                  onClick={() => {
                    setSelectedNoticeForAudit({
                      id: 'notice-demo',
                      title: 'Suspensão das Aulas Presenciais no Campus Manaus Centro (27/08)',
                      content: 'Comunicado de urgência para demonstração institucional.',
                      severity: 'CRITICAL',
                      campus: 'Campus Manaus Centro',
                      publishedAt: '2026-08-27T12:00:00Z',
                      publisherName: 'DIREX / IFAM',
                      publisherRole: 'Direção Geral',
                      requiresAcknowledgment: true,
                      totalTargetAudience: 1650,
                      totalAcknowledged: 1420,
                      totalViewedOnly: 150,
                    });
                    setAuditModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>📊 Auditoria Nominal Completa</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. DEMO DO PEDIDO DE SOCORRO IFAM GUARD */}
          <div className="w-full bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 rounded-3xl p-5 border-2 border-red-500 shadow-2xl text-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  🔴 SEU PEDIDO DE SOCORRO ESTÁ ATIVO (DEMO)
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-[10px] font-bold">
                  Registro #EMG-8921
                </span>
              </div>
              <div className="text-xs text-slate-300 font-mono">
                Tempo decorrido: <strong className="text-white">2m 45s</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <Navigation className="w-5 h-5 animate-bounce" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    🟡 SOCORRISTA / TESTEMUNHA A CAMINHO DO LOCAL
                  </p>
                  <h4 className="text-sm font-extrabold text-white">
                    Prof. Marcos Andrade
                  </h4>
                  <p className="text-xs text-slate-300">
                    Professor & Voluntário Habilitado • <span className="text-emerald-300 font-bold">Aproximadamente 40 metros (Chega em 1 min)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDemoRespondersOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Ver Quem Está Ciente (4)</span>
                </button>
                <button
                  onClick={() => {
                    const btn = document.querySelector('button[title="Histórico de Ocorrências do Campus"]') as HTMLButtonElement;
                    if (btn) btn.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>Finalizar com Parecer</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-white/10">
              <span>Local Informado: <strong className="text-white">Bloco A - Laboratório de Informática 03</strong></span>
              <span className="text-[10px] text-slate-400 italic">O socorrista está se deslocando.</span>
            </div>
          </div>

          {/* 3. ATALHOS RÁPIDOS PARA OUTROS MÓDULOS DEMO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <Link
              href="/networking"
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 transition flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Send className="w-5 h-5 -rotate-12 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">Chat & Networking Direct</h4>
                <p className="text-[10px] text-slate-400">Matchmaking entre campi e mensagens</p>
              </div>
            </Link>

            <button
              onClick={() => setDemoPassOpen(true)}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 transition flex items-center gap-3 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Ticket className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">Crachá Digital (Ticket Pass)</h4>
                <p className="text-[10px] text-slate-400">QR Code com credenciamento duplo</p>
              </div>
            </button>

            <Link
              href="/certificados"
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 transition flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Award className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">Carteira de Certificados</h4>
                <p className="text-[10px] text-slate-400">Validação instantânea por QR Code</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* MODAIS DO MODO DEMO */}
      <EmergencyRespondersModal
        isOpen={demoRespondersOpen}
        onClose={() => setDemoRespondersOpen(false)}
        emergencyId="EMG-8921"
      />

      <TicketPassModal
        isOpen={demoPassOpen}
        onClose={() => setDemoPassOpen(false)}
        registration={{
          id: 'reg-demo-pass',
          eventId: 'evt-snct-2026',
          userId: user?.id || 'usr-demo',
          code: 'IFAM-PASS-DEMO-2026',
          createdAt: new Date().toISOString(),
          attendanceConfirmed: true,
          event: featuredEvent || {
            id: 'evt-snct-2026',
            title: 'Semana Nacional de Ciência e Tecnologia IFAM 2026',
            startDate: '2026-10-15T08:00:00Z',
            endDate: '2026-10-18T18:00:00Z',
            locationName: 'Campus Manaus Centro - Auditório Central',
            bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
          } as any,
          user: user || {
            id: 'usr-demo',
            name: 'Prof. Edimilson Cavalcante da Fonseca',
            email: 'edimilson.fonseca@ifam.edu.br',
            category: 'PROFESSOR',
            campus: 'Campus Manaus Centro',
          } as any,
        }}
      />

      {/* 2. CARD DO EVENTO EM DESTAQUE PRINCIPAL */}
      {featuredEvent && (
        <div className="relative w-full h-[320px] md:h-[380px] rounded-3xl overflow-hidden shadow-2xl group border border-slate-800 bg-slate-900">
          <img
            src={featuredEvent.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600'}
            alt={featuredEvent.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full md:w-3/4 space-y-3 z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-ifam-green-700 text-white text-[11px] font-extrabold rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                Evento em Destaque
              </span>
              <span className="px-3 py-1 bg-emerald-950/80 text-emerald-300 text-[11px] font-semibold rounded-full border border-emerald-500/30">
                {featuredEvent.locationName || 'IFAM Campus Manaus Centro'}
              </span>
            </div>

            <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-md">
              {featuredEvent.title}
            </h2>

            <p className="text-xs md:text-sm text-slate-300 line-clamp-2 leading-relaxed max-w-2xl">
              {featuredEvent.description}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <Link
                href={`/eventos/${featuredEvent.slug}`}
                className="px-6 py-2.5 rounded-xl bg-ifam-green-700 hover:bg-ifam-green-800 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 active:scale-95"
              >
                <span>Inscreva-se Agora</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. PAINEL DE BUSCA + SELETOR DE STATUS (PRÓXIMOS VS ENCERRADOS) + CAMPI + CHIPS */}
      <div className="space-y-4">
        {/* Linha 1 de Filtros: ABAS DE STATUS TEMPORAL (Todos, Próximos, Encerrados) + BUSCA + CAMPI */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          {/* ABAS DE STATUS: PRÓXIMOS VS ENCERRADOS (REQUISITADO) */}
          <div className="flex p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs w-full lg:w-auto">
            <button
              onClick={() => setFilterStatus('upcoming')}
              className={`flex-1 lg:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                filterStatus === 'upcoming'
                  ? 'bg-ifam-green-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Próximos / Ativos</span>
            </button>
            <button
              onClick={() => setFilterStatus('past')}
              className={`flex-1 lg:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                filterStatus === 'past'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Encerrados (Realizados)</span>
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 lg:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                filterStatus === 'all'
                  ? 'bg-ifam-green-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos os Eventos
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Busca por Texto */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-ifam-green-500"
              />
            </div>

            {/* Seletor por Campus do IFAM */}
            <div className="relative w-full sm:w-64">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ifam-green-700 dark:text-emerald-400 pointer-events-none" />
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-ifam-green-500 appearance-none shadow-xs"
              >
                {IFAM_CAMPI.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Chips de Categoria (Roll-over) */}
        <div className="flex items-center md:justify-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-ifam-green-700 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. LAYOUT EM GRID: EVENTOS DO CATÁLOGO + COLUNA LATERAL "ACONTECENDO AGORA" */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna Principal (8 colunas): Catálogo de Eventos do IFAM */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">
              Explorar Programação
            </h2>
            <span className="text-xs font-semibold text-slate-400">{filteredEvents.length} eventos encontrados</span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-500">
              <div className="w-8 h-8 border-4 border-ifam-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Carregando eventos do IFAM...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-panel text-center py-16 rounded-2xl text-slate-500 space-y-2">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhum evento encontrado para este filtro</p>
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setSelectedCampus('ALL');
                  setSelectedCategory('Todos');
                  setSearch('');
                }}
                className="mt-2 px-4 py-1.5 rounded-xl bg-ifam-green-700 text-white font-bold text-xs"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredEvents.map((event) => {
                const startDateFormatted = new Date(event.startDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                });
                const isPast = new Date(event.endDate) < currentDate;

                return (
                  <div
                    key={event.id}
                    className="group flex flex-col rounded-2xl glass-panel overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-200"
                  >
                    <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                      <img
                        src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{startDateFormatted}</span>
                      </div>

                      {/* Badge de Status: Próximo/Ativo vs Encerrado */}
                      <div className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isPast
                          ? 'bg-amber-500 text-white'
                          : 'bg-ifam-green-700 text-white'
                      }`}>
                        {isPast ? 'ENCERRADO' : 'INSCRIÇÕES ABERTAS'}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-ifam-green-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{event.locationName || 'IFAM Campus Manaus Centro'}</span>
                        </div>
                      </div>

                      <Link
                        href={`/eventos/${event.slug}`}
                        className="w-full py-2 px-4 rounded-xl text-center font-bold text-xs text-white transition-all shadow-sm flex items-center justify-center gap-2"
                        style={{ backgroundColor: event.primaryColor || '#1B5E20' }}
                      >
                        <span>{isPast ? 'Ver Programação Realizada' : 'Ver Inscrição'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Coluna Lateral (4 colunas): Acontecendo Agora (Live Streams) & Card de Certificados */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card "Acontecendo Agora" (Desabilitado temporariamente até implementação real) */}
          {false && (
            <div className="glass-panel p-5 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-red-600 font-extrabold text-sm uppercase">
                  <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                  <span>Acontecendo Agora</span>
                </div>
                <span className="text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
                  AO VIVO
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-slate-800 group cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800"
                  alt="Transmissão ao vivo"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/70 backdrop-blur-md rounded-xl text-white text-xs">
                  <p className="font-bold truncate">Keynote de Abertura: O Futuro da IA na Amazônia</p>
                  <p className="text-[10px] text-emerald-400">Dra. Helena Tavares • 142 assistindo</p>
                </div>
              </div>
            </div>
          )}

          {/* Card "Meus Certificados Digitas" */}
          {user && (
            <div className="p-6 rounded-3xl bg-emerald-900 text-white space-y-4 shadow-xl border border-emerald-700">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-emerald-300" />
                <h3 className="font-extrabold text-base">Meus Certificados</h3>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Consulte suas horas de extensão acumuladas e faça o download dos certificados emitidos com validação por Hash SHA-256.
              </p>
              <Link
                href="/certificados"
                className="w-full py-2.5 px-4 rounded-xl bg-white text-emerald-900 font-bold text-xs text-center block hover:bg-emerald-50 transition shadow-md"
              >
                Acessar Meus Certificados
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE AUDITORIA NOMINAL DE LEITURA E CIÊNCIA DO GESTOR */}
      <NoticeAuditModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        notice={selectedNoticeForAudit}
      />
    </div>
  );
}
