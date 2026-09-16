'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Building2, GraduationCap, Shield, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Send, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { ALL_IFAM_CAMPI } from '../lib/constants';
import { fetchApi } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { login, register, requestPasswordReset, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  
  // Campos do formulário
  const [name, setName] = useState('');
  const [pronoun, setPronoun] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('ALUNO');
  const [campus, setCampus] = useState('Campus Manaus Centro');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estrutura acadêmica em cascata (Campus -> Nível -> Curso -> Turma)
  const [campusList, setCampusList] = useState<any[]>([]);
  const [selectedCampusUnitId, setSelectedCampusUnitId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('GRADUACAO');
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [matricula, setMatricula] = useState('');

  // Campos de Recuperação de Senha
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devCodeMessage, setDevCodeMessage] = useState<string | null>(null);

  // Estado de Sucesso com Contagem Regressiva
  const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
  const [countdown, setCountdown] = useState<number>(3);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (successInfo && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (successInfo && countdown === 0) {
      onClose();
      setSuccessInfo(null);
    }
    return () => clearTimeout(timer);
  }, [successInfo, countdown, onClose]);

  useEffect(() => {
    if (isOpen && mode === 'register') {
      fetchApi<{ campuses: any[] }>('/institutions/campuses/all')
        .then((res) => {
          if (res && Array.isArray(res.campuses) && res.campuses.length > 0) {
            setCampusList(res.campuses);
            if (!selectedCampusUnitId) {
              setSelectedCampusUnitId(res.campuses[0].id);
              setCampus(res.campuses[0].name);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (mode === 'register' && selectedCampusUnitId) {
      const url = selectedLevel
        ? `/campus-structure/courses?campusUnitId=${selectedCampusUnitId}&level=${selectedLevel}`
        : `/campus-structure/courses?campusUnitId=${selectedCampusUnitId}`;
      fetchApi<{ courses: any[] }>(url)
        .then((res) => {
          if (res && Array.isArray(res.courses)) {
            setCoursesList(res.courses);
            if (res.courses.length > 0) {
              setSelectedCourseId(res.courses[0].id);
              if (res.courses[0].classes && res.courses[0].classes.length > 0) {
                setSelectedClassId(res.courses[0].classes[0].id);
              } else {
                setSelectedClassId('');
              }
            } else {
              setSelectedCourseId('');
              setSelectedClassId('');
            }
          }
        })
        .catch(() => {
          setCoursesList([]);
          setSelectedCourseId('');
          setSelectedClassId('');
        });
    }
  }, [mode, selectedCampusUnitId, selectedLevel]);

  const handleCourseChange = (newCourseId: string) => {
    setSelectedCourseId(newCourseId);
    const found = coursesList.find((c) => c.id === newCourseId);
    if (found && found.classes && found.classes.length > 0) {
      setSelectedClassId(found.classes[0].id);
    } else {
      setSelectedClassId('');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setDevCodeMessage(null);

    try {
      if (mode === 'login') {
        await login(email, password);
        setSuccessInfo({
          title: 'Login efetuado com sucesso!',
          message: 'Bem-vindo de volta ao IFAM Eventos.',
        });
        setCountdown(3);
      } else if (mode === 'register') {
        await register({
          name,
          email,
          password,
          pronoun: pronoun || undefined,
          category: category as any,
          campus,
          campusUnitId: selectedCampusUnitId || undefined,
          courseId: (category === 'ALUNO' || category === 'EGRESSO') ? selectedCourseId || undefined : undefined,
          classId: (category === 'ALUNO' || category === 'EGRESSO') ? selectedClassId || undefined : undefined,
          matriculaOrSiape: matricula || undefined,
        });
        setSuccessInfo({
          title: `Conta criada com sucesso para ${name}!`,
          message: 'Sua conta acadêmica está ativa e pronta para uso no IFAM Eventos.',
        });
        setCountdown(3);
      } else if (mode === 'forgot') {
        if (forgotStep === 1) {
          // Etapa 1: Enviar Código de Recuperação
          const res = await requestPasswordReset(email);
          setForgotStep(2);
          if (res.code) {
            setDevCodeMessage(`🔑 [CÓDIGO DE TESTE GERADO]: ${res.code}`);
          }
        } else {
          // Etapa 2: Validar Código e Redefinir Senha
          if (newPassword !== confirmPassword) {
            throw new Error('As senhas digitadas não coincidem.');
          }
          if (newPassword.length < 6) {
            throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
          }
          await resetPassword(email, resetCode, newPassword);

          setSuccessInfo({
            title: 'Senha redefinida com sucesso!',
            message: 'Sua nova senha já está ativa. Você pode acessar sua conta agora.',
          });
          setPassword(newPassword);
          setMode('login');
          setCountdown(3);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro no processamento da solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex justify-center items-start pt-12 sm:pt-16 pb-12"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white animate-fade-in my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {successInfo ? (
          /* CARD DE SUCESSO VERDE COM CONTAGEM REGRESSIVA */
          <div className="space-y-6 text-center py-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg ring-8 ring-emerald-500/10">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                {successInfo.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                {successInfo.message}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center gap-1.5 shadow-inner">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Conectando sua conta em</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-mono text-sm shadow-xs">
                  {countdown}s
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Você será redirecionado automaticamente...</p>
            </div>

            <button
              onClick={() => {
                onClose();
                setSuccessInfo(null);
              }}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              Entrar Agora
            </button>
          </div>
        ) : (
          <>
            {/* Cabeçalho */}
            <div className="space-y-1 text-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-center mb-2">
                <img
                  src="/unifik-logo-transparent.png"
                  alt="Unifik"
                  className="h-12 w-auto object-contain drop-shadow-xs"
                />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">
                {mode === 'login'
                  ? 'Acessar o Unifik'
                  : mode === 'register'
                  ? 'Criar Conta no Unifik'
                  : 'Recuperação de Senha'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'login'
                  ? 'Entre com suas credenciais acadêmicas para se conectar ao ecossistema'
                  : mode === 'register'
                  ? 'Cadastre-se para participar de eventos, rede social e certificados'
                  : forgotStep === 1
                  ? 'Informe seu e-mail cadastrado para receber o código de verificação'
                  : 'Informe o código recebido e defina sua nova senha de acesso'}
              </p>
            </div>

            {/* Alerta de Erro Visual */}
            {errorMessage && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Mensagem de Código de Teste Dev */}
            {devCodeMessage && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-fade-in">
                <KeyRound className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{devCodeMessage}</span>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-3.5 pt-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Edimilson Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-unifik-primary"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Pronome de Tratamento
                    </label>
                    <select
                      value={pronoun}
                      onChange={(e) => setPronoun(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-unifik-primary"
                    >
                      <option value="">Não informar (Opcional)</option>
                      <option value="Ele/Dele">Ele/Dele</option>
                      <option value="Ela/Dela">Ela/Dela</option>
                      <option value="Sr.">Sr.</option>
                      <option value="Sra.">Sra.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Profa.">Profa.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Dra.">Dra.</option>
                      <option value="Me.">Me. (Mestre)</option>
                      <option value="Ma.">Ma. (Mestra)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Campo de E-mail (Exibido em Login, Registro e Forgot Step 1) */}
              {(mode !== 'forgot' || forgotStep === 1) && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    E-mail Institucional ou Pessoal
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="edimilson@ifam.edu.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-unifik-primary"
                    />
                  </div>
                </div>
              )}

              {/* Campo de Senha em Login/Register */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Senha
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setForgotStep(1);
                          setErrorMessage(null);
                        }}
                        className="text-[11px] font-bold text-unifik-primary dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-unifik-primary"
                    />
                  </div>
                </div>
              )}

              {/* Fluxo Forgot Password Step 2: Código + Nova Senha */}
              {mode === 'forgot' && forgotStep === 2 && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Código de Verificação (6 dígitos)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="Ex: 482910"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold tracking-widest rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-unifik-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-unifik-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Repita a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-unifik-primary"
                      />
                    </div>
                  </div>
                </>
              )}

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Vínculo / Categoria
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-unifik-primary"
                    >
                      <option value="ALUNO">Aluno (Discente)</option>
                      <option value="EGRESSO">Aluno Egresso (Ex-aluno)</option>
                      <option value="TECNICO">Servidor (Técnico Administrativo)</option>
                      <option value="PROFESSOR">Servidor (Docente / Professor)</option>
                      <option value="EXTERNO">Comunidade Externa / Visitante</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      {category === 'EXTERNO' ? 'Campus de Referência / Interesse' : 'Campus / Unidade de Origem'}
                    </label>
                    <select
                      value={selectedCampusUnitId || campus}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCampusUnitId(val);
                        const found = campusList.find((c) => c.id === val);
                        if (found) setCampus(found.name);
                        else setCampus(val);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-unifik-primary"
                    >
                      {campusList.length > 0 ? (
                        campusList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.code})
                          </option>
                        ))
                      ) : (
                        ALL_IFAM_CAMPI.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* ESTRUTURA ACADÊMICA CASCATEADA (ALUNO / EGRESSO) */}
                  {(category === 'ALUNO' || category === 'EGRESSO') && (
                    <div className="p-3.5 rounded-2xl bg-violet-50/60 dark:bg-slate-800/60 border border-violet-200/60 dark:border-violet-900/40 space-y-3 animate-fade-in">
                      <div className="flex items-center gap-1.5 text-violet-800 dark:text-violet-300 font-black text-xs">
                        <GraduationCap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        <span>Dados Acadêmicos do Aluno</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                            Nível de Ensino *
                          </label>
                          <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-unifik-primary"
                          >
                            <option value="GRADUACAO">Superior / Graduação</option>
                            <option value="TECNICO_INTEGRADO">Técnico Integrado</option>
                            <option value="TECNICO_SUBSEQUENTE">Técnico Subsequente</option>
                            <option value="POS_GRADUACAO">Pós-Graduação</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                            Matrícula (Opcional)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 2026101004"
                            value={matricula}
                            onChange={(e) => setMatricula(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Seleção do Curso cadastrado no Campus */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                          Curso Cadastrado na Unidade *
                        </label>
                        {coursesList.length > 0 ? (
                          <select
                            value={selectedCourseId}
                            onChange={(e) => handleCourseChange(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-unifik-primary"
                          >
                            {coursesList.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.name} {course.code ? `(${course.code})` : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                            Nenhum curso cadastrado para este nível neste campus. O coordenador pode cadastrá-lo no painel.
                          </div>
                        )}
                      </div>

                      {/* Turma Relacionada ao Curso */}
                      {selectedCourseId && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                            Turma / Período
                          </label>
                          {coursesList.find((c) => c.id === selectedCourseId)?.classes?.length > 0 ? (
                            <select
                              value={selectedClassId}
                              onChange={(e) => setSelectedClassId(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-unifik-primary"
                            >
                              <option value="">Sem turma vinculada / Ingressante</option>
                              {coursesList
                                .find((c) => c.id === selectedCourseId)
                                ?.classes?.map((cls: any) => (
                                  <option key={cls.id} value={cls.id}>
                                    Turma {cls.name} {cls.yearSemester ? `• ${cls.yearSemester}` : ''} {cls.shift ? `(${cls.shift})` : ''}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic">Nenhuma turma cadastrada no momento para este curso.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Matrícula/SIAPE para Servidores */}
                  {(category === 'PROFESSOR' || category === 'TECNICO') && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Matrícula SIAPE (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 1982734"
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <span>
                  {loading
                    ? 'Aguarde...'
                    : mode === 'login'
                    ? 'Entrar no Sistema'
                    : mode === 'register'
                    ? 'Finalizar Cadastro'
                    : forgotStep === 1
                    ? 'Enviar Código de Verificação'
                    : 'Redefinir e Salvar Senha'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Alternar entre Login, Cadastro e Voltar */}
            <div className="pt-4 text-center border-t border-slate-100 dark:border-slate-800 mt-4 text-xs">
              {mode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setForgotStep(1);
                    setErrorMessage(null);
                    setDevCodeMessage(null);
                  }}
                  className="text-slate-500 dark:text-slate-400 font-bold hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o Login</span>
                </button>
              ) : mode === 'login' ? (
                <p className="text-slate-500 dark:text-slate-400">
                  Ainda não possui conta?{' '}
                  <button
                    onClick={() => {
                      setMode('register');
                      setErrorMessage(null);
                    }}
                    className="text-unifik-primary dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Cadastre-se grátis
                  </button>
                </p>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">
                  Já possui cadastro no IFAM?{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                    }}
                    className="text-unifik-primary dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Fazer Login
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

