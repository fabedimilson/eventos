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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { EventItem } from '@ifam-eventos/types';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ALL_IFAM_CAMPI, matchCampusName } from '../lib/constants';
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
  // Estados do Carrossel Hero de Eventos em Destaque
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  // Modais de Demonstração Interativa
  const [selectedNoticeForAudit, setSelectedNoticeForAudit] = useState<NoticeItem | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [demoRespondersOpen, setDemoRespondersOpen] = useState(false);
  const [demoPassOpen, setDemoPassOpen] = useState(false);
  const [demoNoticeAcknowledged, setDemoNoticeAcknowledged] = useState(false);

  // Define automaticamente o campus do usuário logado na inicialização
  useEffect(() => {
    if (user && user.campus) {
      const found = ALL_IFAM_CAMPI.find((c) => matchCampusName(user.campus || '', c));
      if (found) {
        setSelectedCampus(found);
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

    const matchCampus = matchCampusName(e.locationName || e.locationAddress || '', selectedCampus);

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

  // Seleciona todos os eventos com status de Destaque para exibição em Carrossel
  const featuredEvents = events.filter((e) => {
    try {
      if (!e.customCssConfig) return false;
      const parsed = typeof e.customCssConfig === 'string' ? JSON.parse(e.customCssConfig) : e.customCssConfig;
      return Boolean(parsed?.isFeatured);
    } catch {
      return false;
    }
  });

  const heroEvents = featuredEvents.length > 0
    ? featuredEvents
    : (events.find((e) => e.slug === 'snct-ifam-2026-ciencia-delas')
        ? [events.find((e) => e.slug === 'snct-ifam-2026-ciencia-delas')!]
        : (events.length > 0 ? [events[0]] : []));

  // Rotação automática do carrossel caso existam múltiplos eventos em destaque
  useEffect(() => {
    if (heroEvents.length <= 1 || isHeroPaused) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroEvents.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroEvents.length, isHeroPaused]);

  // Garante índice válido
  const safeIndex = currentHeroIndex >= heroEvents.length ? 0 : currentHeroIndex;
  const currentHeroEvent = heroEvents[safeIndex];
  const selectedCampusObj = IFAM_CAMPI.find((c) => c.id === selectedCampus);

  return (
    <div className="space-y-8 animate-fade-in pt-2 pb-12">
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
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <Link
              href="/calendario-academico"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-violet-200" />
              <span>📅 Acessar Calendário Acadêmico 2026</span>
            </Link>
          </div>
        </div>

        {/* Direita: Stories dos Eventos Alinhados na Mesma Linha */}
        <div className="flex-1 max-w-full md:max-w-xl overflow-hidden">
          <StoriesBar events={events} />
        </div>
      </div>

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
          event: featuredEvents[0] || {
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

      {/* 2. CARD DO EVENTO EM DESTAQUE / CARROSSEL HERO DINÂMICO */}
      {currentHeroEvent && (
        <div 
          className="relative w-full h-[320px] md:h-[400px] rounded-3xl overflow-hidden shadow-2xl group border border-slate-800 bg-slate-900 select-none"
          onMouseEnter={() => setIsHeroPaused(true)}
          onMouseLeave={() => setIsHeroPaused(false)}
        >
          {/* Banner do Evento Ativo com Transição Suave */}
          <img
            key={currentHeroEvent.id}
            src={currentHeroEvent.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600'}
            alt={currentHeroEvent.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-70 animate-fade-in"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          {/* Botões de Navegação Anterior / Próximo (quando houver múltiplos destaques) */}
          {heroEvents.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentHeroIndex((prev) => (prev - 1 + heroEvents.length) % heroEvents.length);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition active:scale-90 backdrop-blur-md opacity-80 hover:opacity-100 cursor-pointer shadow-lg"
                title="Destaque Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentHeroIndex((prev) => (prev + 1) % heroEvents.length);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition active:scale-90 backdrop-blur-md opacity-80 hover:opacity-100 cursor-pointer shadow-lg"
                title="Próximo Destaque"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Conteúdo Textual do Evento */}
          <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full md:w-3/4 space-y-3 z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-unifik-primary text-white text-[11px] font-extrabold rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-300 fill-emerald-300" />
                {heroEvents.length > 1 ? `Destaque (${safeIndex + 1}/${heroEvents.length})` : 'Evento em Destaque'}
              </span>
              <span className="px-3 py-1 bg-emerald-950/80 text-emerald-300 text-[11px] font-semibold rounded-full border border-emerald-500/30">
                {currentHeroEvent.locationName || 'IFAM Campus Manaus Centro'}
              </span>
              {currentHeroEvent.category && (
                <span className="px-2.5 py-0.5 bg-black/40 text-slate-300 text-[10px] font-bold rounded-md border border-slate-700">
                  {currentHeroEvent.category}
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-md">
              {currentHeroEvent.title}
            </h2>

            <p className="text-xs md:text-sm text-slate-300 line-clamp-2 leading-relaxed max-w-2xl">
              {currentHeroEvent.description}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <Link
                href={`/eventos/${currentHeroEvent.slug}`}
                className="px-6 py-2.5 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 active:scale-95"
              >
                <span>Inscreva-se Agora</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Indicadores de Paginação / Bolinhas Interativas */}
          {heroEvents.length > 1 && (
            <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              {heroEvents.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentHeroIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === safeIndex
                      ? 'w-6 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`Ir para destaque ${idx + 1}`}
                />
              ))}
            </div>
          )}
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
                  ? 'bg-unifik-primary text-white shadow-xs'
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
                  ? 'bg-unifik-primary text-white shadow-xs'
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
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-unifik-primary"
              />
            </div>

            {/* Seletor por Campus do IFAM */}
            <div className="relative w-full sm:w-64">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-unifik-primary dark:text-emerald-400 pointer-events-none" />
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-unifik-primary appearance-none shadow-xs"
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
                    ? 'bg-unifik-primary text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. CATÁLOGO DE EVENTOS DO IFAM (GRADE TOTAL DE 3 COLUNAS NO DESKTOP) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">
            Explorar Programação
          </h2>
          <span className="text-xs font-semibold text-slate-400">{filteredEvents.length} eventos encontrados</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500">
            <div className="w-8 h-8 border-4 border-unifik-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
              className="mt-2 px-4 py-1.5 rounded-xl bg-unifik-primary text-white font-bold text-xs"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        : 'bg-unifik-primary text-white'
                    }`}>
                      {isPast ? 'ENCERRADO' : 'INSCRIÇÕES ABERTAS'}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-unifik-primary dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
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

      {/* MODAL DE AUDITORIA NOMINAL DE LEITURA E CIÊNCIA DO GESTOR */}
      <NoticeAuditModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        notice={selectedNoticeForAudit}
      />
    </div>
  );
}
