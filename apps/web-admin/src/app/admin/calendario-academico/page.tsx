'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Plus,
  ArrowLeft,
  Trash2,
  Edit,
  Clock,
  Building2,
  Upload,
  Download,
  AlertCircle,
  Search,
} from 'lucide-react';
import { fetchApi, API_BASE_URL } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { ProtectedStateCard } from '../../../components/ProtectedStateCard';

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
}

interface Campus {
  id: string;
  name: string;
  code: string;
}

const CATEGORY_OPTIONS = [
  { value: 'INSTITUCIONAL', label: '🏛️ Evento Institucional / Solenidade' },
  { value: 'EVENTO_ACADEMICO', label: '💡 Semana Acadêmica, Congresso & Jornada' },
  { value: 'SEMESTRE', label: '🗓️ Início/Fim de Semestre e Ano Letivo' },
  { value: 'PROVAS', label: '🔴 Provas, Avaliações & Exames Finais' },
  { value: 'MATRICULA', label: '🟡 Matrículas, Rematrículas & Ajustes' },
  { value: 'TCC', label: '🎓 Entrega de TCC, Monografias & Bancas' },
  { value: 'REUNIAO', label: '📋 Reuniões Pedagógicas & Colegiados' },
  { value: 'FORMATURA', label: '🎉 Colação de Grau & Formaturas' },
  { value: 'EDITAL', label: '📢 Editais, Bolsas & Iniciação Científica' },
  { value: 'SABADO_LETIVO', label: '🔵 Sábado Letivo' },
  { value: 'FERIAS', label: '🟢 Férias & Recessos Escolares' },
  { value: 'FERIADO', label: '🟣 Feriados & Pontos Facultativos' },
];

export default function AdminCalendarioAcademicoPage() {
  const { user, loading: authLoading } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal de Adicionar / Editar Data
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('INSTITUCIONAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isNoClassDay, setIsNoClassDay] = useState(false);
  const [targetAudience, setTargetAudience] = useState('TODOS');
  const [yearSemester, setYearSemester] = useState('2026.1');

  // Modal de Importar CSV
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredEvents = events.filter((ev) => {
    const matchesCategory = categoryFilter === 'ALL' || ev.category === categoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const isAdmin =
    user?.role === 'ADMIN_UNIDADE' || user?.role === 'ADMIN_MASTER' || user?.role === 'SUPER_ADMIN';

  // 1. Carregar Campi
  useEffect(() => {
    async function loadCampuses() {
      try {
        const res = await fetchApi<{ campuses: Campus[] }>('/institutions/ifam/campuses');
        if (res && res.campuses && res.campuses.length > 0) {
          setCampuses(res.campuses);
          if (user?.campus) {
            const match = res.campuses.find((c) =>
              c.name.toLowerCase().includes(user.campus!.toLowerCase())
            );
            setSelectedCampusId(match?.id || res.campuses[0].id);
          } else {
            setSelectedCampusId(res.campuses[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (isAdmin) loadCampuses();
  }, [isAdmin, user]);

  // 2. Carregar Datas do Calendário
  const loadEvents = async () => {
    if (!selectedCampusId) return;
    setLoading(true);
    try {
      const res = await fetchApi<{ events: CalendarEvent[] }>(
        `/academic-calendar?campusUnitId=${selectedCampusId}`
      );
      setEvents(res.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCampusId) loadEvents();
  }, [selectedCampusId]);

  if (!authLoading && !isAdmin) {
    return (
      <ProtectedStateCard
        title="Acesso Restrito"
        description="Apenas administradores de campus ou administradores master possuem acesso à gestão do calendário acadêmico."
      />
    );
  }

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setCategory('INSTITUCIONAL');
    setStartDate('2026-04-13T08:00');
    setEndDate('2026-04-18T18:00');
    setIsNoClassDay(false);
    setTargetAudience('TODOS');
    setYearSemester('2026.1');
    setFeedback(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDescription(ev.description || '');
    setCategory(ev.category);
    setStartDate(ev.startDate.slice(0, 16));
    setEndDate(ev.endDate.slice(0, 16));
    setIsNoClassDay(ev.isNoClassDay);
    setTargetAudience(ev.targetAudience);
    setYearSemester(ev.yearSemester);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      if (editingEvent) {
        await fetchApi(`/academic-calendar/${editingEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title,
            description,
            category,
            startDate,
            endDate,
            isNoClassDay,
            targetAudience,
            yearSemester,
          }),
        });
        setFeedback({ type: 'success', message: 'Data acadêmica atualizada com sucesso!' });
      } else {
        await fetchApi('/academic-calendar', {
          method: 'POST',
          body: JSON.stringify({
            campusUnitId: selectedCampusId,
            title,
            description,
            category,
            startDate,
            endDate,
            isNoClassDay,
            targetAudience,
            yearSemester,
          }),
        });
        setFeedback({ type: 'success', message: 'Data acadêmica cadastrada com sucesso!' });
      }

      await loadEvents();
      setTimeout(() => setModalOpen(false), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao salvar data acadêmica.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover esta data do calendário acadêmico?')) return;
    try {
      await fetchApi(`/academic-calendar/${id}`, { method: 'DELETE' });
      await loadEvents();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover data.');
    }
  };

  const handleImportCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvRawText.trim()) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      // Parse de linhas CSV: Título;Categoria;DataInicio;DataFim;Semestre;SemAula;Audiencia
      const lines = csvRawText.split('\n').filter((l) => l.trim().length > 0);
      const items = [];

      for (const line of lines) {
        const parts = line.split(';').map((p) => p.trim());
        if (parts.length >= 4) {
          items.push({
            title: parts[0],
            category: parts[1] || 'INSTITUCIONAL',
            startDate: parts[2],
            endDate: parts[3],
            yearSemester: parts[4] || '2026.1',
            isNoClassDay: parts[5] === 'true' || parts[5] === '1' || parts[5] === 'sim',
            targetAudience: parts[6] || 'TODOS',
          });
        }
      }

      const res = await fetchApi<{ count: number }>('/academic-calendar/import-csv', {
        method: 'POST',
        body: JSON.stringify({ campusUnitId: selectedCampusId, items }),
      });

      setFeedback({ type: 'success', message: `${res.count} datas importadas com sucesso!` });
      await loadEvents();
      setTimeout(() => setCsvModalOpen(false), 1500);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao importar datas.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <Link
            href="/calendario-academico"
            className="text-xs text-slate-500 hover:text-unifik-primary flex items-center gap-1.5 font-bold transition mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ver Visualização Mensal dos Alunos</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-unifik-primary" />
            <span>Gestão do Calendário Acadêmico Oficial</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Cadastre os períodos de avaliação, matrículas, férias, recessos escolares e sábados letivos do seu campus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setCsvRawText(
                'Período de Provas N1;PROVAS;2026-04-13T08:00:00Z;2026-04-18T18:00:00Z;2026.1;false;TODOS\nFérias Escolares;FERIAS;2026-07-01T00:00:00Z;2026-07-31T23:59:59Z;2026.1;true;TODOS'
              );
              setFeedback(null);
              setCsvModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-unifik-primary hover:bg-emerald-700 text-white font-black text-xs transition shadow-md flex items-center gap-2 shrink-0 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Adicionar Data</span>
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">Campus:</span>
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

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">Categoria:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-extrabold border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-unifik-primary"
            >
              <option value="ALL">Todas as Categorias</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por título ou orientação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-unifik-primary"
            />
          </div>
          <span className="text-xs font-bold text-slate-400 shrink-0">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'data' : 'datas'}
          </span>
        </div>
      </div>

      {/* LISTAGEM DE DATAS */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Carregando cronograma acadêmico...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 text-slate-400 space-y-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <CalendarIcon className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-xs font-semibold">
            {events.length === 0
              ? 'Nenhuma data cadastrada para este campus ainda.'
              : 'Nenhuma data encontrada com os filtros selecionados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((ev) => {
            const catConfig = CATEGORY_OPTIONS.find((c) => c.value === ev.category);
            const startFormatted = new Date(ev.startDate).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            const endFormatted = new Date(ev.endDate).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={ev.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-unifik-primary shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {catConfig ? catConfig.label : ev.category}
                    </span>
                    <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {startFormatted === endFormatted ? startFormatted : `${startFormatted} até ${endFormatted}`}
                    </span>
                    {ev.isNoClassDay && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                        Sem Aula
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{ev.title}</h3>
                  {ev.description && (
                    <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">{ev.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <span className="text-[11px] font-bold text-slate-400 mr-2">Público: {ev.targetAudience}</span>
                  <button
                    onClick={() => handleOpenEdit(ev)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 transition"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingEvent ? 'Editar Data do Calendário' : 'Adicionar Data ao Calendário'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                    : 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-200'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Título da Data / Evento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Período de Avaliações N1, Férias de Meio de Ano"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Público-Alvo
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                  >
                    <option value="TODOS">Geral (Todos os Alunos)</option>
                    <option value="GRADUACAO">Ensino Superior / Graduação</option>
                    <option value="TECNICO">Cursos Técnicos</option>
                    <option value="POS_GRADUACAO">Pós-Graduação</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Data / Hora Inicial <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Data / Hora Final <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição / Orientações aos Alunos
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Orientações, prazos e procedimentos acadêmicos..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isNoClassDay"
                  checked={isNoClassDay}
                  onChange={(e) => setIsNoClassDay(e.target.checked)}
                  className="rounded text-unifik-primary focus:ring-unifik-primary"
                />
                <label htmlFor="isNoClassDay" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Dia sem aula presencial (Feriado ou Recesso Institucional)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-unifik-primary hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : editingEvent ? 'Salvar Alterações' : 'Cadastrar Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE IMPORTAÇÃO CSV */}
      {csvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Importação em Lote via CSV</span>
              </h3>
              <button onClick={() => setCsvModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Cole as linhas no formato: <br />
              <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] font-mono block mt-1">
                Título;Categoria;DataInicio;DataFim;Semestre;SemAula;Audiencia
              </code>
            </p>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                    : 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-200'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleImportCsvSubmit} className="space-y-4">
              <textarea
                rows={8}
                required
                value={csvRawText}
                onChange={(e) => setCsvRawText(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCsvModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-unifik-primary hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Importando...' : 'Importar Todas as Datas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
