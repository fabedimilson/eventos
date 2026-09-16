'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  Send,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Check,
} from 'lucide-react';
import { fetchApi } from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { ALL_IFAM_CAMPI } from '../../../../lib/constants';

const PRESETS = [
  {
    label: '🚍 Greve de Transporte',
    severity: 'CRITICAL' as const,
    title: 'COMUNICADO: Suspensão das Aulas devido à Paralisação do Transporte Público',
    content:
      'Informamos à comunidade acadêmica que, em virtude da paralisação dos serviços de transporte público municipal nesta data, as atividades acadêmicas e administrativas presenciais estão suspensas. As atividades pedagógicas serão compensadas conforme orientação das coordenações de curso.',
  },
  {
    label: '⚡ Falta de Energia',
    severity: 'CRITICAL' as const,
    title: 'COMUNICADO URGENTE: Falta de Energia Elétrica e Suspensão de Atividades',
    content:
      'Devido a uma interrupção inesperada no fornecimento de energia elétrica pela concessionária que afeta os blocos pedagógicos e administrativos do campus, as aulas do turno atual estão suspensas até que o serviço seja restabelecido com segurança.',
  },
  {
    label: '🌧️ Chuvas Fortes / Alerta',
    severity: 'WARNING' as const,
    title: 'ALERTA METEOROLÓGICO: Contingência e Regime Especial por Chuvas Intensas',
    content:
      'Em razão das fortes chuvas que atingiram a região metropolitana e causaram pontos de alagamento nos acessos ao campus, a Direção Geral recomenda cautela nos deslocamentos e flexibiliza a tolerância de horário e faltas no dia de hoje.',
  },
  {
    label: '📢 Rematrícula / Prazo',
    severity: 'INFO' as const,
    title: 'NOTA INSTITUCIONAL: Início do Período de Renovação de Matrícula 2026',
    content:
      'A Diretoria de Ensino informa que o período para solicitação de renovação de matrícula e trancamento para o semestre 2026/2 já está disponível no Portal do Aluno. Fiquem atentos aos prazos e às disciplinas obrigatórias.',
  },
];

export default function NovoAvisoPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<'CRITICAL' | 'WARNING' | 'INFO'>('CRITICAL');
  const [campus, setCampus] = useState(user?.campus || 'Campus Manaus Centro');
  const [targetAudience, setTargetAudience] = useState<'TODOS' | 'ALUNOS' | 'SERVIDORES'>('TODOS');
  const [requiresAck, setRequiresAck] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setTitle(preset.title);
    setContent(preset.content);
    setSeverity(preset.severity);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Por favor, preencha o título e o conteúdo do comunicado.');
      return;
    }

    try {
      setPublishing(true);
      await fetchApi('/notices', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content,
          severity,
          campus,
          targetAudience,
          requiresAcknowledgment: requiresAck,
        }),
      });

      setSuccessMsg(true);
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar comunicado.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* Botão de Retorno e Cabeçalho */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel Administrativo</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-lg text-xl">
          📢
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Publicar Comunicado ou Alerta Institucional
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Emita alertas oficiais sobre suspensão de aulas, contingências, paralisações ou notas com confirmação de leitura.
          </p>
        </div>
      </div>

      {/* MODELOS PRONTOS COM 1 CLIQUE */}
      <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-slate-500 tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-unifik-primary" />
          <span>Modelos Rápidos (Clique para Preencher Automaticamente)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs transition active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FORMULÁRIO PRINCIPAL */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          {/* Nível de Gravidade / Urgência */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Nível de Urgência / Gravidade
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSeverity('CRITICAL')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                  severity === 'CRITICAL'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-400/40'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    🔴 Crítico / Urgente
                  </span>
                  {severity === 'CRITICAL' && <Check className="w-4 h-4 text-rose-600" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Suspensão imediata de aulas, greves, falta de energia ou emergências.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSeverity('WARNING')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                  severity === 'WARNING'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/40'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    🟡 Atenção / Aviso
                  </span>
                  {severity === 'WARNING' && <Check className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Alertas meteorológicos, prazos críticos ou contingências parciais.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSeverity('INFO')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                  severity === 'INFO'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-400/40'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    🔵 Informativo Geral
                  </span>
                  {severity === 'INFO' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Notas oficiais, portarias, expedientes e comunicados da Direção.
                </p>
              </button>
            </div>
          </div>

          {/* Título do Comunicado */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Título Oficial do Comunicado *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Suspensão das Aulas Noturnas devido à Paralisação do Transporte"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-unifik-primary"
            />
          </div>

          {/* Campus e Público-Alvo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Campus / Unidade de Aplicação</span>
              </label>
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-unifik-primary"
              >
                <option value="Todos os Campi do IFAM">🌐 Todos os Campi do IFAM</option>
                {ALL_IFAM_CAMPI.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Público-Alvo</span>
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-unifik-primary"
              >
                <option value="TODOS">Toda a Comunidade Acadêmica</option>
                <option value="ALUNOS">Apenas Alunos (Técnico e Superior)</option>
                <option value="SERVIDORES">Apenas Servidores (Docentes e Técnicos)</option>
              </select>
            </div>
          </div>

          {/* Texto Completo / Orientações */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Conteúdo Detalhado & Orientações *
            </label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva as orientações oficiais para a comunidade acadêmica, canais de suporte, previsão de retorno ou diretrizes de segurança..."
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-unifik-primary resize-y"
            />
          </div>

          {/* Opção de Exigir Ciência */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Exigir Confirmação de Leitura / Ciência Digital
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Gera carimbo com matrícula/SIAPE e horário em que o aluno ou servidor clicou em &quot;Estou Ciente&quot;.
              </p>
            </div>
            <input
              type="checkbox"
              checked={requiresAck}
              onChange={(e) => setRequiresAck(e.target.checked)}
              className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Comunicado Oficial publicado com sucesso! Redirecionando...</span>
          </div>
        )}

        {/* Botão de Publicação */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={publishing}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-600 to-unifik-primary hover:opacity-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl transition active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{publishing ? 'Publicando Comunicado...' : '📢 Publicar Comunicado Oficial no Portal'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
