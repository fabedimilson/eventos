'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Users,
  Building2,
  ArrowLeft,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { ProtectedStateCard } from '../../../components/ProtectedStateCard';

interface CampusCourse {
  id: string;
  campusUnitId: string;
  level: string;
  name: string;
  code?: string | null;
  active: boolean;
  classes: {
    id: string;
    name: string;
    shift?: string | null;
    yearSemester?: string | null;
    active: boolean;
  }[];
}

interface Campus {
  id: string;
  name: string;
  code: string;
}

const LEVEL_LABELS: Record<string, string> = {
  GRADUACAO: 'Ensino Superior / Graduação',
  TECNICO_INTEGRADO: 'Técnico Integrado ao Ensino Médio',
  TECNICO_SUBSEQUENTE: 'Técnico Subsequente',
  POS_GRADUACAO: 'Pós-Graduação / Especialização',
  ENSINO_MEDIO: 'Ensino Médio Regular',
  EXTENSAO: 'Cursos de Extensão',
};

export default function AdminCursosTurmasPage() {
  const { user, loading: authLoading } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [courses, setCourses] = useState<CampusCourse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Curso
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CampusCourse | null>(null);
  const [courseName, setCourseName] = useState('');
  const [courseLevel, setCourseLevel] = useState('GRADUACAO');
  const [courseCode, setCourseCode] = useState('');

  // Modal Turma
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [selectedCourseForClass, setSelectedCourseForClass] = useState<CampusCourse | null>(null);
  const [className, setClassName] = useState('');
  const [classShift, setClassShift] = useState('MATUTINO');
  const [classYearSemester, setClassYearSemester] = useState('2026.1');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  // 2. Carregar Cursos do Campus
  const loadCourses = async () => {
    if (!selectedCampusId) return;
    setLoading(true);
    try {
      const res = await fetchApi<{ courses: CampusCourse[] }>(
        `/campus-structure/courses?campusUnitId=${selectedCampusId}`
      );
      setCourses(res.courses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCampusId) {
      loadCourses();
    }
  }, [selectedCampusId]);

  if (!authLoading && !isAdmin) {
    return (
      <ProtectedStateCard
        title="Acesso Restrito"
        description="Apenas administradores de campus ou administradores master possuem acesso à gestão de cursos e turmas."
      />
    );
  }

  // Abertura de Modal de Curso
  const handleOpenCreateCourse = () => {
    setEditingCourse(null);
    setCourseName('');
    setCourseLevel('GRADUACAO');
    setCourseCode('');
    setFeedback(null);
    setCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course: CampusCourse) => {
    setEditingCourse(course);
    setCourseName(course.name);
    setCourseLevel(course.level);
    setCourseCode(course.code || '');
    setFeedback(null);
    setCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      if (editingCourse) {
        await fetchApi(`/campus-structure/courses/${editingCourse.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: courseName, level: courseLevel, code: courseCode }),
        });
        setFeedback({ type: 'success', message: 'Curso atualizado com sucesso!' });
      } else {
        await fetchApi('/campus-structure/courses', {
          method: 'POST',
          body: JSON.stringify({
            campusUnitId: selectedCampusId,
            name: courseName,
            level: courseLevel,
            code: courseCode,
          }),
        });
        setFeedback({ type: 'success', message: 'Curso cadastrado com sucesso!' });
      }
      await loadCourses();
      setTimeout(() => setCourseModalOpen(false), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao salvar curso.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Modal de Turma
  const handleOpenCreateClass = (course: CampusCourse) => {
    setSelectedCourseForClass(course);
    setClassName('');
    setClassShift('MATUTINO');
    setClassYearSemester('2026.1');
    setFeedback(null);
    setClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !selectedCourseForClass) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      await fetchApi('/campus-structure/classes', {
        method: 'POST',
        body: JSON.stringify({
          courseId: selectedCourseForClass.id,
          name: className.toUpperCase().trim(),
          shift: classShift,
          yearSemester: classYearSemester,
        }),
      });
      setFeedback({ type: 'success', message: 'Turma cadastrada com sucesso!' });
      await loadCourses();
      setTimeout(() => setClassModalOpen(false), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao cadastrar turma.' });
    } finally {
      setSubmitting(false);
    }
  };

  const groupedCourses = courses.reduce((acc: Record<string, CampusCourse[]>, course) => {
    if (!acc[course.level]) acc[course.level] = [];
    acc[course.level].push(course);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-unifik-primary flex items-center gap-1.5 font-bold transition mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para a Página Inicial</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-unifik-primary" />
            <span>Estrutura Acadêmica: Cursos & Turmas</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Configure os cursos e turmas ofertados pelo campus. Ao se cadastrar ou editar o perfil, o estudante seleciona seu curso e turma padronizados.
          </p>
        </div>

        <button
          onClick={handleOpenCreateCourse}
          className="px-4 py-2.5 rounded-xl bg-unifik-primary hover:bg-emerald-700 text-white font-black text-xs transition shadow-md flex items-center gap-2 shrink-0 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Cadastrar Curso</span>
        </button>
      </div>

      {/* SELETOR DE CAMPUS ATIVO */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Campus em Gerenciamento:</span>
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

        <span className="text-xs font-bold text-slate-400">
          {courses.length} {courses.length === 1 ? 'curso ativo' : 'cursos ativos'}
        </span>
      </div>

      {/* AGRUPAMENTO DE CURSOS POR NÍVEL */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Carregando matriz de cursos...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-slate-400 space-y-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-xs font-semibold">Nenhum curso cadastrado neste campus ainda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCourses).map(([level, courseList]) => (
            <div
              key={level}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-unifik-primary" />
                  <span>{LEVEL_LABELS[level] || level}</span>
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  {courseList.length} {courseList.length === 1 ? 'curso' : 'cursos'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courseList.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {course.code && (
                          <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 inline-block mb-1">
                            {course.code}
                          </span>
                        )}
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {course.name}
                        </h3>
                      </div>

                      <button
                        onClick={() => handleOpenEditCourse(course)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        title="Editar Curso"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Turmas do Curso */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <Users className="w-3 h-3 text-violet-500" />
                          Turmas ({course.classes.length}):
                        </span>
                        <button
                          onClick={() => handleOpenCreateClass(course)}
                          className="text-[11px] font-bold text-unifik-primary hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Nova Turma</span>
                        </button>
                      </div>

                      {course.classes.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">Nenhuma turma cadastrada.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {course.classes.map((cls) => (
                            <span
                              key={cls.id}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10px] font-extrabold shadow-2xs"
                              title={`${cls.shift || 'Geral'} • ${cls.yearSemester || ''}`}
                            >
                              {cls.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE CADASTRO/EDIÇÃO DE CURSO */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingCourse ? 'Editar Curso' : 'Cadastrar Novo Curso'}
              </h3>
              <button onClick={() => setCourseModalOpen(false)} className="text-slate-400 font-bold">
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

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nível de Ensino <span className="text-red-500">*</span>
                </label>
                <select
                  value={courseLevel}
                  onChange={(e) => setCourseLevel(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                >
                  <option value="GRADUACAO">Ensino Superior / Graduação</option>
                  <option value="TECNICO_INTEGRADO">Técnico Integrado ao Ensino Médio</option>
                  <option value="TECNICO_SUBSEQUENTE">Técnico Subsequente</option>
                  <option value="POS_GRADUACAO">Pós-Graduação / Especialização</option>
                  <option value="ENSINO_MEDIO">Ensino Médio Regular</option>
                  <option value="EXTENSAO">Cursos de Extensão</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome Completo do Curso <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Ex: Engenharia de Software"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Código / Sigla do Curso
                </label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                  placeholder="Ex: BS-ESOFT, TEC-INF"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-unifik-primary hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : editingCourse ? 'Salvar Alterações' : 'Cadastrar Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO DE TURMA */}
      {classModalOpen && selectedCourseForClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Cadastrar Nova Turma</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{selectedCourseForClass.name}</p>
              </div>
              <button onClick={() => setClassModalOpen(false)} className="text-slate-400 font-bold">
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

            <form onSubmit={handleSaveClass} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome / Código da Turma <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value.toUpperCase())}
                  placeholder="Ex: INF21, ESOFT51, QUI2026-1"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Turno
                  </label>
                  <select
                    value={classShift}
                    onChange={(e) => setClassShift(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                  >
                    <option value="MATUTINO">Matutino</option>
                    <option value="VESPERTINO">Vespertino</option>
                    <option value="NOTURNO">Noturno</option>
                    <option value="INTEGRAL">Integral</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Semestre / Ano
                  </label>
                  <input
                    type="text"
                    value={classYearSemester}
                    onChange={(e) => setClassYearSemester(e.target.value)}
                    placeholder="Ex: 2026.1"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-unifik-primary hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Cadastrar Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
