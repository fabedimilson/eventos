'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  GraduationCap,
  Info,
  Clock,
  MapPin,
  Sparkles,
  Settings,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { fetchApi, API_BASE_URL } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface CalendarEvent {
  id: string;
  campusUnitId: string;
  yearSemester: string;
  title: string;
  description?: string;
  category: string;
  startDate: string;
  endDate: string;
  isNoClassDay: boolean;
  targetAudience: string;
  courseId?: string | null;
  campusUnit?: {
    id: string;
    name: string;
    code: string;
  };
  course?: {
    id: string;
    name: string;
    code: string;
    level: string;
  } | null;
}

interface Campus {
  id: string;
  name: string;
  code: string;
}

const CATEGORY_STYLES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  INSTITUCIONAL: {
    label: 'Eventos Institucionais',
    bg: 'bg-slate-100 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700',
    text: 'text-slate-800 dark:text-slate-200',
    dot: 'bg-slate-600 dark:bg-slate-400',
  },
  EVENTO_ACADEMICO: {
    label: 'Semanas & Jornadas',
    bg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800',
    text: 'text-teal-700 dark:text-teal-300',
    dot: 'bg-teal-500',
  },
  SEMESTRE: {
    label: 'Período Letivo',
    bg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800',
    text: 'text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
  },
  PROVAS: {
    label: 'Provas & Avaliações',
    bg: 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
  MATRICULA: {
    label: 'Matrículas & Ajustes',
    bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  TCC: {
    label: 'TCC & Monografias',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  REUNIAO: {
    label: 'Reuniões & Colegiados',
    bg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  FORMATURA: {
    label: 'Colação de Grau',
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/60 border-fuchsia-200 dark:border-fuchsia-800',
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
    dot: 'bg-fuchsia-500',
  },
  EDITAL: {
    label: 'Editais & Bolsas',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  SABADO_LETIVO: {
    label: 'Sábado Letivo',
    bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  FERIAS: {
    label: 'Férias & Recessos',
    bg: 'bg-lime-50 dark:bg-lime-950/60 border-lime-200 dark:border-lime-800',
    text: 'text-lime-700 dark:text-lime-300',
    dot: 'bg-lime-500',
  },
  FERIADO: {
    label: 'Feriados',
    bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarioAcademicoPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 1, 1)); // Default Feb 2026 (Início do semestre)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAudience, setSelectedAudience] = useState<string>('ALL');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    user?.role === 'ADMIN_UNIDADE' || user?.role === 'ADMIN_MASTER' || user?.role === 'SUPER_ADMIN';

  // 1. Carrega lista de campi disponíveis
  useEffect(() => {
    async function loadCampuses() {
      try {
        const res = await fetchApi<{ campuses: Campus[] }>('/institutions/ifam/campuses');
        if (res && res.campuses) {
          setCampuses(res.campuses);
          // Se o usuário tem campus cadastrado, seleciona ele
          if (user?.campus) {
            const userCampus = res.campuses.find((c) =>
              c.name.toLowerCase().includes(user.campus!.toLowerCase())
            );
            if (userCampus) setSelectedCampusId(userCampus.id);
            else setSelectedCampusId(res.campuses[0]?.id || '');
          } else if (res.campuses.length > 0) {
            setSelectedCampusId(res.campuses[0].id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar campi:', err);
      }
    }
    loadCampuses();
  }, [user]);

  // 2. Carrega eventos acadêmicos do mês selecionado
  const loadEvents = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      let url = `/academic-calendar?year=${year}&month=${month}`;
      if (selectedCampusId) url += `&campusUnitId=${selectedCampusId}`;
      if (selectedCategory !== 'ALL') url += `&category=${selectedCategory}`;
      if (selectedAudience !== 'ALL') url += `&targetAudience=${selectedAudience}`;

      const res = await fetchApi<{ events: CalendarEvent[] }>(url);
      setEvents(res.events || []);
    } catch (err) {
      console.error('Erro ao carregar datas do calendário:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [currentDate, selectedCampusId, selectedCategory, selectedAudience]);

  // Navegação de Meses
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date(2026, 1, 1));
    setSelectedDay(null);
  };

  // Cálculo da grade de dias do mês
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Dias do mês anterior para preencher a primeira semana
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, totalDaysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Dias do mês atual
    for (let day = 1; day <= totalDaysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Dias do próximo mês para completar a grade de 35 ou 42 células
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Função para verificar se um evento ocorre em uma determinada data
  const getEventsForDay = (date: Date) => {
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return events.filter((ev) => {
      const start = new Date(ev.startDate);
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
      const end = new Date(ev.endDate);
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
      return target >= startDay && target <= endDay;
    });
  };

  // Eventos filtrados para o dia selecionado (ou lista do mês inteiro se nenhum dia específico foi clicado)
  const displayedEvents = useMemo(() => {
    if (selectedDay) {
      return getEventsForDay(selectedDay);
    }
    return events;
  }, [selectedDay, events]);

  const handleExportICS = () => {
    const url = `${API_BASE_URL}/academic-calendar/export.ics${
      selectedCampusId ? `?campusUnitId=${selectedCampusId}` : ''
    }`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* 1. CABEÇALHO DO CALENDÁRIO ACADÊMICO */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Ano Letivo 2026 • Cronograma Oficial</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Calendário Acadêmico Institucional
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Consulte as datas de avaliações regimentais (N1/N2/Finais), matrículas, férias, recessos escolares e sábados letivos com filtros por nível e curso.
          </p>
        </div>

        {/* Ações Rápidas: Exportar Agenda & Gestão Admin */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={handleExportICS}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition shadow-xs flex items-center gap-2"
            title="Sincronizar com Google Calendar, Apple iCal ou Outlook"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar Calendário (.ics)</span>
          </button>

          {isAdmin && (
            <Link
              href="/admin/calendario-academico"
              className="px-4 py-2.5 rounded-xl bg-unifik-primary hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition flex items-center gap-2 hover:scale-[1.02]"
            >
              <Settings className="w-4 h-4" />
              <span>Gerenciar Datas</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. BARRA DE FILTROS (CAMPUS, NÍVEL E CATEGORIAS) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Seletor de Campus da Instituição */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-500">Campus:</span>
            <select
              value={selectedCampusId}
              onChange={(e) => setSelectedCampusId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-extrabold border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-unifik-primary"
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Nível de Ensino */}
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="text-xs font-bold text-slate-500">Público-Alvo:</span>
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-unifik-primary"
            >
              <option value="ALL">Geral (Todos os Alunos)</option>
              <option value="GRADUACAO">Ensino Superior / Graduação</option>
              <option value="TECNICO">Cursos Técnicos (Integrado/Subsequente)</option>
              <option value="POS_GRADUACAO">Pós-Graduação</option>
            </select>
          </div>
        </div>

        {/* Chips de Categoria com Cores */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 dark:border-slate-800 pt-3">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Todas as Categorias
          </button>
          {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                selectedCategory === key
                  ? 'bg-unifik-primary text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${style.dot}`} />
              <span>{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. CORPO PRINCIPAL: GRADE MENSAL + PAINEL LATERAL DE DATAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUNA ESQUERDA (8 colunas): CALENDÁRIO MENSAL EM GRADE */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {/* Navegação de Mês */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={handleCurrentMonth}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[11px] font-extrabold transition"
              >
                Mês Inicial
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                title="Próximo Mês"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-xs text-slate-400 py-1">
            {WEEKDAYS.map((day, idx) => (
              <div key={day} className={idx === 0 || idx === 6 ? 'text-red-500' : ''}>
                {day}
              </div>
            ))}
          </div>

          {/* Grade de 35 ou 42 Dias */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((item, idx) => {
              const dayEvents = getEventsForDay(item.date);
              const isSelected =
                selectedDay &&
                selectedDay.getDate() === item.date.getDate() &&
                selectedDay.getMonth() === item.date.getMonth() &&
                selectedDay.getFullYear() === item.date.getFullYear();

              const hasNoClass = dayEvents.some((e) => e.isNoClassDay);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(item.date)}
                  className={`min-h-[85px] p-2 rounded-2xl border text-left transition flex flex-col justify-between relative group ${
                    !item.isCurrentMonth
                      ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60 opacity-40'
                      : isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-unifik-primary shadow-sm'
                      : hasNoClass
                      ? 'bg-red-50/30 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/40'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-unifik-primary'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black ${
                        isSelected
                          ? 'text-unifik-primary'
                          : item.date.getDay() === 0
                          ? 'text-red-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.date.getDate()}
                    </span>
                    {hasNoClass && (
                      <span className="text-[9px] px-1 rounded bg-red-100 dark:bg-red-950 text-red-700 font-extrabold">
                        Sem Aula
                      </span>
                    )}
                  </div>

                  {/* Marcadores de Eventos no Dia */}
                  <div className="space-y-1 w-full mt-1">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.INSTITUCIONAL;
                      return (
                        <div
                          key={ev.id}
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded truncate ${style.bg} ${style.text}`}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-bold block text-right">
                        +{dayEvents.length - 2} mais
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* COLUNA DIREITA (4 colunas): DETALHES DAS DATAS MARCANTES */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-unifik-primary" />
                <span>
                  {selectedDay
                    ? `Datas em ${selectedDay.toLocaleDateString('pt-BR')}`
                    : `Destaques de ${MONTH_NAMES[currentDate.getMonth()]}`}
                </span>
              </h3>
              {selectedDay && (
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-xs text-unifik-primary font-bold hover:underline"
                >
                  Ver Mês Todo
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Carregando datas do cronograma...
              </div>
            ) : displayedEvents.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <CalendarIcon className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs font-semibold">Nenhuma data acadêmica registrada para este período.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                {displayedEvents.map((ev) => {
                  const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.INSTITUCIONAL;
                  const startFormatted = new Date(ev.startDate).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  });
                  const endFormatted = new Date(ev.endDate).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  });

                  return (
                    <div
                      key={ev.id}
                      className={`p-3.5 rounded-2xl border transition space-y-2 ${style.bg}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 ${style.text}`}>
                          {style.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                          {startFormatted === endFormatted ? startFormatted : `${startFormatted} a ${endFormatted}`}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                        {ev.title}
                      </h4>

                      {ev.description && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {ev.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[10px] font-bold text-slate-400 border-t border-slate-200/50 dark:border-slate-800/60">
                        <span>Público: {ev.targetAudience}</span>
                        {ev.isNoClassDay && (
                          <span className="text-red-600 dark:text-red-400 font-extrabold">Sem Aula Presencial</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
