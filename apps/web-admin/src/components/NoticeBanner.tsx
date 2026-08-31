'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ShieldCheck, BarChart3, X, History, Archive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { fetchApi } from '../lib/api';

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  campus: string;
  publishedAt: string;
  publisherName: string;
  publisherRole: string;
  requiresAcknowledgment: boolean;
  totalTargetAudience: number;
  totalAcknowledged: number;
  totalViewedOnly: number;
}

interface NoticeBannerProps {
  onOpenAuditModal?: (notice: NoticeItem) => void;
}

export function NoticeBanner({ onOpenAuditModal }: NoticeBannerProps) {
  const { user } = useAuth();
  const [acknowledged, setAcknowledged] = useState(false);
  const [acknowledgedTime, setAcknowledgedTime] = useState<string | null>(null);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [notice, setNotice] = useState<NoticeItem | null>(null);

  // Carrega o comunicado ativo real do backend
  const loadActiveNotice = async () => {
    try {
      const res: any = await fetchApi('/notices/active');
      if (res && res.notice) {
        if (res.notice.hasDismissed) {
          setBannerVisible(false);
          return;
        }

        setNotice({
          id: res.notice.id,
          title: res.notice.title,
          content: res.notice.content,
          severity: res.notice.severity,
          campus: res.notice.campus,
          publishedAt: res.notice.createdAt,
          publisherName: res.notice.publisherName,
          publisherRole: res.notice.publisherRole,
          requiresAcknowledgment: res.notice.requiresAcknowledgment,
          totalTargetAudience: 1650,
          totalAcknowledged: res.notice.stats?.totalAcks || 0,
          totalViewedOnly: res.notice.stats?.totalViews || 0,
        });

        if (res.notice.hasAcknowledged) {
          setAcknowledged(true);
          setAcknowledgedTime('Ciência confirmada no sistema');
        }
      } else {
        setNotice(null);
        setBannerVisible(false);
      }
    } catch (e) {
      setNotice(null);
      setBannerVisible(false);
    }
  };

  useEffect(() => {
    loadActiveNotice();
  }, [user]);

  const isServidorOrAdmin = user && (
    user.category === 'PROFESSOR' ||
    user.category === 'TECNICO' ||
    user.category === 'SERVIDOR' ||
    user.role === 'ORGANIZADOR' ||
    user.role === 'ADMIN' ||
    user.role === 'SUPER_ADMIN' ||
    user.role === 'ADMIN_MASTER' ||
    user.role === 'ADMIN_UNIDADE'
  );

  const handleAcknowledge = async () => {
    if (!notice) return;
    const now = new Date();
    const formatted = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;
    setAcknowledged(true);
    setAcknowledgedTime(formatted);
    setNotice((prev) => prev ? ({
      ...prev,
      totalAcknowledged: prev.totalAcknowledged + 1,
    }) : null);

    try {
      await fetchApi(`/notices/${notice.id}/acknowledge`, { method: 'POST' });
    } catch (e) {
      console.error('Erro ao registrar ciência no backend:', e);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(`ifam_notice_ack_${notice.id}`, formatted);
    }
  };

  const handleDismissBanner = async () => {
    if (!notice) return;
    setBannerVisible(false);
    try {
      await fetchApi(`/notices/${notice.id}/dismiss`, { method: 'POST' });
    } catch (e) {
      console.error('Erro ao arquivar comunicado:', e);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ifam_notice_dismissed_${notice.id}`, 'true');
    }
  };

  if (!bannerVisible || !notice) return null;

  const percentAcknowledged = Math.round((notice.totalAcknowledged / notice.totalTargetAudience) * 100);
  const percentViewedOnly = Math.round((notice.totalViewedOnly / notice.totalTargetAudience) * 100);
  const percentNotViewed = 100 - percentAcknowledged - percentViewedOnly;

  return (
    <div className="w-full bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 rounded-3xl p-5 md:p-6 border-2 border-red-500/60 shadow-2xl text-white relative overflow-hidden animate-fade-in space-y-4">
      {/* Luz Neon de Fundo */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Linha 1: Cabeçalho com Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            🚨 ALERTA INSTITUCIONAL DE URGÊNCIA
          </span>
          <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-[11px] font-bold border border-emerald-400/30">
            📍 {notice.campus}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-300 font-medium">
            Publicado pela {notice.publisherName}
          </span>
          <button
            onClick={handleDismissBanner}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition"
            title="Arquivar comunicado da tela inicial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Linha 2: Título e Conteúdo Oficial */}
      <div className="space-y-2 relative z-10">
        <h2 className="text-xl md:text-2xl font-black tracking-tight text-white leading-snug">
          {notice.title}
        </h2>
        <p className="text-xs md:text-sm text-slate-200 leading-relaxed max-w-4xl">
          {notice.content}
        </p>
      </div>

      {/* Linha 3: Ação Principal de Manifestação de Ciência */}
      <div className="pt-3 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        {/* Botão / Status de Ciência do Usuário */}
        {!acknowledged ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAcknowledge}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs md:text-sm shadow-lg hover:shadow-emerald-500/20 transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 stroke-[3]" />
              <span>✅ DECLARO-ME CIENTE DESTE AVISO INSTITUCIONAL</span>
            </button>
            <span className="text-[11px] text-slate-300 italic">
              Sua ciência será registrada formalmente com matrícula/SIAPE para auditoria do campus.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold shadow-inner">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs font-black">🟢 CIÊNCIA REGISTRADA COM SUCESSO!</p>
                <p className="text-[10px] text-emerald-200/80 font-normal">
                  Manifestação auditada em {acknowledgedTime} • Usuário: {user?.name} ({user?.matriculaOrSiape || 'SIAPE'})
                </p>
              </div>
            </div>

            {/* Botão de Arquivar após dar ciência */}
            <button
              onClick={handleDismissBanner}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Ocultar aviso da tela inicial"
            >
              <Archive className="w-4 h-4 text-emerald-300" />
              <span>Arquivar da Home</span>
            </button>
          </div>
        )}

        {/* Métricas e Auditoria do Gestor */}
        {isServidorOrAdmin && (
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-white/10">
            <div className="text-right text-[11px]">
              <p className="font-extrabold text-white">
                📊 {percentAcknowledged}% Cientes ({notice.totalAcknowledged})
              </p>
              <p className="text-[10px] text-slate-400">
                👁️ {percentViewedOnly}% viram ({notice.totalViewedOnly}) • 🔴 {percentNotViewed}% pendentes
              </p>
            </div>
            <button
              onClick={() => onOpenAuditModal && onOpenAuditModal(notice)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Abrir Relatório de Auditoria Nominal"
            >
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Auditoria Nominal</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
