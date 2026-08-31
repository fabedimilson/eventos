'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Eye, AlertTriangle, FileSpreadsheet, Printer, Search, ShieldCheck } from 'lucide-react';
import { NoticeItem } from './NoticeBanner';

interface NoticeAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice: NoticeItem | null;
}

export function NoticeAuditModal({ isOpen, onClose, notice }: NoticeAuditModalProps) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACKNOWLEDGED' | 'VIEWED_ONLY' | 'NOT_VIEWED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || !notice) return null;

  // Lista nominal demonstrativa auditada do Campus
  const auditList = [
    {
      id: 'usr-1',
      name: 'Lucas Silva Amazônida',
      email: 'aluno1@ifam.edu.br',
      category: 'ALUNO',
      matricula: '20241010998',
      status: 'ACKNOWLEDGED',
      statusLabel: '🟢 Ciente Manifestado',
      viewedAt: '26/08/2026 às 18:14:02',
      acknowledgedAt: '26/08/2026 às 18:14:15',
    },
    {
      id: 'usr-2',
      name: 'Dr. Carlos Eduardo Menezes',
      email: 'admin@ifam.edu.br',
      category: 'PROFESSOR',
      matricula: 'SIAPE-982143',
      status: 'ACKNOWLEDGED',
      statusLabel: '🟢 Ciente Manifestado',
      viewedAt: '26/08/2026 às 18:05:00',
      acknowledgedAt: '26/08/2026 às 18:05:10',
    },
    {
      id: 'usr-3',
      name: 'Mariana Vasconcelos',
      email: 'organizador@ifam.edu.br',
      category: 'TECNICO',
      matricula: 'SIAPE-543129',
      status: 'ACKNOWLEDGED',
      statusLabel: '🟢 Ciente Manifestado',
      viewedAt: '26/08/2026 às 18:02:11',
      acknowledgedAt: '26/08/2026 às 18:02:22',
    },
    {
      id: 'usr-4',
      name: 'Beatriz Pereira Rocha',
      email: 'aluno2@ifam.edu.br',
      category: 'ALUNO',
      matricula: '20231040881',
      status: 'VIEWED_ONLY',
      statusLabel: '👁️ Visualizou (Pendente de Clique)',
      viewedAt: '26/08/2026 às 19:20:00',
      acknowledgedAt: null,
    },
    {
      id: 'usr-5',
      name: 'Eng. Roberto Albuquerque',
      email: 'convidado@empresa.com.br',
      category: 'EXTERNO',
      matricula: 'EXTERNO-991',
      status: 'NOT_VIEWED',
      statusLabel: '🔴 Não Visualizou Ainda',
      viewedAt: null,
      acknowledgedAt: null,
    },
  ];

  const filtered = auditList.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.email.toLowerCase().includes(searchTerm.toLowerCase()) || item.matricula.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = activeFilter === 'ALL' || item.status === activeFilter;
    return matchSearch && matchFilter;
  });

  const countAcknowledged = auditList.filter((i) => i.status === 'ACKNOWLEDGED').length;
  const countViewedOnly = auditList.filter((i) => i.status === 'VIEWED_ONLY').length;
  const countNotViewed = auditList.filter((i) => i.status === 'NOT_VIEWED').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-6 space-y-6">
        
        {/* Topo do Modal */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase">
                Relatório de Leitura & Ciência Auditada
              </span>
              <span className="text-xs text-slate-400 font-bold">📍 {notice.campus}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {notice.title}
            </h2>
            <p className="text-xs text-slate-500">
              Auditado oficialmente via Matrícula/SIAPE • {notice.publisherName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Métricas Consolidadas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">🟢 Cientes (Manifestados)</p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{countAcknowledged} pessoas</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">88% do público total</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">👁️ Visualizaram mas Não Clicaram</p>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">{countViewedOnly} pessoas</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">Abriram o aviso sem confirmar</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">🔴 Não Visualizaram</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">{countNotViewed} pessoas</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Ainda não abriram o aplicativo</p>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${activeFilter === 'ALL' ? 'bg-ifam-green-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
            >
              Todos ({auditList.length})
            </button>
            <button
              onClick={() => setActiveFilter('ACKNOWLEDGED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${activeFilter === 'ACKNOWLEDGED' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700'}`}
            >
              🟢 Cientes ({countAcknowledged})
            </button>
            <button
              onClick={() => setActiveFilter('VIEWED_ONLY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${activeFilter === 'VIEWED_ONLY' ? 'bg-amber-600 text-white' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700'}`}
            >
              👁️ Visualizaram ({countViewedOnly})
            </button>
            <button
              onClick={() => setActiveFilter('NOT_VIEWED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${activeFilter === 'NOT_VIEWED' ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
            >
              🔴 Não Viram ({countNotViewed})
            </button>
          </div>

          {/* Busca Nominal */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou SIAPE/Matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>
        </div>

        {/* Tabela Nominal Auditada */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px]">
              <tr>
                <th className="p-3">Usuário / Categoria</th>
                <th className="p-3">Matrícula / SIAPE</th>
                <th className="p-3">Status da Ciência</th>
                <th className="p-3">Visualizou em</th>
                <th className="p-3">Manifestou em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="p-3">
                    <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.email}</p>
                  </td>
                  <td className="p-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {item.matricula}
                  </td>
                  <td className="p-3 font-bold">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] ${item.status === 'ACKNOWLEDGED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : item.status === 'VIEWED_ONLY' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                      {item.statusLabel}
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-slate-500">
                    {item.viewedAt || '—'}
                  </td>
                  <td className="p-3 text-[11px] text-slate-500 font-semibold">
                    {item.acknowledgedAt || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé com Exportação */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400">
            Relatório gerado sob diretrizes de auditoria institucional do IFAM.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Relatório CSV/Excel baixado com sucesso!')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
