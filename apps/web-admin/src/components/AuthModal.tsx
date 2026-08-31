'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, Building2, GraduationCap, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const [campus, setCampus] = useState('Campus Manaus Centro');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        alert('Login efetuado com sucesso!');
      } else {
        await register({
          name,
          email,
          password,
          pronoun: pronoun || undefined,
          category: category as any,
          campus,
        });
        alert(`Conta criada com sucesso para ${name}! Bem-vindo ao IFAM Eventos.`);
      }
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro de autenticação.');
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
                  <option value="ALUNO">Aluno (Estudante IFAM)</option>
                  <option value="SERVIDOR">Servidor (Docente / Técnico IFAM)</option>
                  <option value="EXTERNO">Comunidade Externa / Convidado</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Campus de Origem
                </label>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-ifam-green-500"
                >
                  <option value="Campus Manaus Centro (CMC)">Campus Manaus Centro (CMC)</option>
                  <option value="Campus Manaus Zona Leste (CMZL)">Campus Manaus Zona Leste (CMZL)</option>
                  <option value="Campus Manaus Distrito Industrial (CMDI)">Campus Manaus Distrito Industrial (CMDI)</option>
                  <option value="Campus Coari">Campus Coari</option>
                  <option value="Campus Parintins">Campus Parintins</option>
                  <option value="Campus Tefé">Campus Tefé</option>
                  <option value="Campus Itacoatiara">Campus Itacoatiara</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-ifam-green-700 hover:bg-ifam-green-800 text-white font-bold text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-2 mt-2"
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
                onClick={() => setMode('register')}
                className="text-ifam-green-700 dark:text-emerald-400 font-bold hover:underline"
              >
                Cadastre-se grátis
              </button>
            </p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              Já possui cadastro no IFAM?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-ifam-green-700 dark:text-emerald-400 font-bold hover:underline"
              >
                Fazer Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
