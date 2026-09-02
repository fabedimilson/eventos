'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Building2, GraduationCap, Shield, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { ALL_IFAM_CAMPI } from '../lib/constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Campos do formulário
  const [name, setName] = useState('');
  const [pronoun, setPronoun] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('ALUNO');
  const [campus, setCampus] = useState('Campus Manaus - Centro');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      if (mode === 'login') {
        await login(email, password);
        setSuccessInfo({
          title: 'Login efetuado com sucesso!',
          message: 'Bem-vindo de volta ao IFAM Eventos.',
        });
        setCountdown(3);
      } else {
        await register({
          name,
          email,
          password,
          pronoun: pronoun || undefined,
          category: category as any,
          campus,
        });
        setSuccessInfo({
          title: `Conta criada com sucesso para ${name}!`,
          message: 'Sua conta acadêmica está ativa e pronta para uso no IFAM Eventos.',
        });
        setCountdown(3);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro de autenticação.');
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
              className="w-full py-2.5 rounded-xl bg-ifam-green-700 hover:bg-ifam-green-800 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              Entrar Agora
            </button>
          </div>
        ) : (
          <>
            {/* Cabeçalho */}
            <div className="space-y-1 text-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-ifam-green-700 text-white flex items-center justify-center font-black mx-auto text-lg shadow-md mb-2">
                IF
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">
                {mode === 'login' ? 'Acessar THE IFAM EVENTS' : 'Criar Conta Acadêmica'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'login'
                  ? 'Entre com suas credenciais do IFAM para se inscrever nos eventos'
                  : 'Cadastre-se para participar dos simpósitos e emitir certificados'}
              </p>
            </div>

            {/* Alerta de Erro Visual */}
            {errorMessage && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
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
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-ifam-green-500"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Pronome de Tratamento
                    </label>
                    <select
                      value={pronoun}
                      onChange={(e) => setPronoun(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-ifam-green-500"
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
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-ifam-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-ifam-green-500"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Vínculo / Categoria
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-ifam-green-500"
                    >
                      <option value="ALUNO">Aluno (Discente IFAM)</option>
                      <option value="EGRESSO">Aluno Egresso (Egresso IFAM)</option>
                      <option value="TECNICO">Servidor (Técnico Administrativo IFAM)</option>
                      <option value="PROFESSOR">Servidor (Docente / Professor IFAM)</option>
                      <option value="EXTERNO">Comunidade Externa / Convidado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      {category === 'EXTERNO' ? 'Campus de Referência / Interesse no IFAM' : 'Campus de Origem'}
                    </label>
                    <select
                      value={campus}
                      onChange={(e) => setCampus(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-ifam-green-500"
                    >
                      {ALL_IFAM_CAMPI.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-ifam-green-700 hover:bg-ifam-green-800 text-white font-bold text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <span>{loading ? 'Aguarde...' : mode === 'login' ? 'Entrar no Sistema' : 'Finalizar Cadastro'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Alternar entre Login e Cadastro */}
            <div className="pt-4 text-center border-t border-slate-100 dark:border-slate-800 mt-4 text-xs">
              {mode === 'login' ? (
                <p className="text-slate-500 dark:text-slate-400">
                  Ainda não possui conta?{' '}
                  <button
                    onClick={() => {
                      setMode('register');
                      setErrorMessage(null);
                    }}
                    className="text-ifam-green-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
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
                    className="text-ifam-green-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
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

