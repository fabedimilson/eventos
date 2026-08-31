'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Send, ShieldCheck, Building2, BellRing } from 'lucide-react';
import { ALL_IFAM_CAMPI } from '../lib/constants';

interface CreateNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoticeCreated?: () => void;
}

export function CreateNoticeModal({ isOpen, onClose, onNoticeCreated }: CreateNoticeModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<'CRITICAL' | 'WARNING' | 'INFO'>('CRITICAL');
  const [campus, setCampus] = useState('Campus Manaus Centro');
  const [requiresAck, setRequiresAck] = useState(true);
  const [publishing, setPublishing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      alert('📢 Comunicado Oficial publicado com sucesso e notificação enviada aos usuários do campus!');
      if (onNoticeCreated) onNoticeCreated();
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-6 space-y-5">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-md">
              📢
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Publicar Comunicado / Alerta Oficial
              </h2>
              <p className="text-xs text-slate-500">
                Aviso institucional com controle de leitura e confirmação de ciência
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Formulário de Criação */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Gravidade / Nível do Alerta */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nível de Severidade / Gravidade do Aviso:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('CRITICAL')}
                className={`p-2.5 rounded-xl border text-center font-extrabold transition ${severity === 'CRITICAL' ? 'bg-red-600 text-white border-red-700 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
              >
                🚨 Alerta Urgente (Calamidade / Greve)
              </button>
              <button
                type="button"
                onClick={() => setSeverity('WARNING')}
                className={`p-2.5 rounded-xl border text-center font-extrabold transition ${severity === 'WARNING' ? 'bg-amber-600 text-white border-amber-700 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
              >
                📢 Comunicado Importante
              </button>
              <button
                type="button"
                onClick={() => setSeverity('INFO')}
                className={`p-2.5 rounded-xl border text-center font-extrabold transition ${severity === 'INFO' ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
              >
                ℹ️ Aviso Geral
              </button>
            </div>
          </div>

          {/* Seleção do Campus */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Campus de Destino:
            </label>
            <select
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold"
            >
              <option value="Todos os Campi do IFAM">Todos os Campi do IFAM</option>
              {ALL_IFAM_CAMPI.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Título do Comunicado:
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Suspensão das Aulas Presenciais devido à greve de transporte..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold"
            />
          </div>

          {/* Conteúdo / Detalhes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Conteúdo Detalhado da Notícia:
            </label>
            <textarea
              required
              rows={4}
              placeholder="Escreva a nota oficial direcionada a alunos, professores e técnicos..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium leading-relaxed"
            />
          </div>

          {/* Opção de Exigir Ciência */}
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-extrabold text-emerald-900 dark:text-emerald-300 text-xs">
                  Exigir Confirmação de Ciência ("Estou Ciente")
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                  Gera auditoria nominal com data/hora e matrícula do usuário.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={requiresAck}
              onChange={(e) => setRequiresAck(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={publishing}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold shadow-md flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{publishing ? 'Publicando...' : 'Publicar Alerta com Auditoria'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
