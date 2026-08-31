'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, MapPin, Clock, CheckCircle2, Navigation, AlertCircle, PhoneCall } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EmergencyRespondersModal } from './EmergencyRespondersModal';

import { fetchApi } from '../lib/api';

interface ActiveEmergencyWidgetProps {
  onOpenHistory?: () => void;
}

export function ActiveEmergencyWidget({ onOpenHistory }: ActiveEmergencyWidgetProps) {
  const { user } = useAuth();
  const [respondersModalOpen, setRespondersModalOpen] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);

  // Busca a emergência real ativa do backend
  const loadActiveEmergency = async () => {
    try {
      const res: any = await fetchApi('/emergencies/active');
      if (res && res.emergency) {
        const em = res.emergency;
        setActiveEmergency({
          id: em.id,
          category: em.category,
          categoryLabel: em.category === 'HARASSMENT' ? '🛡️ Assédio / Constrangimento'
            : em.category === 'HEALTH' ? '🚑 Emergência de Saúde'
            : em.category === 'VIOLENCE' ? '🚨 Segurança & Drogas'
            : '🏢 Incêndios & Riscos',
          campus: em.campus,
          location: em.blockLocation,
          timestamp: new Date(em.triggeredAt).toLocaleTimeString('pt-BR'),
          elapsedSeconds: Math.floor((Date.now() - new Date(em.triggeredAt).getTime()) / 1000),
          status: em.status,
          statusLabel: em.status === 'EN_ROUTE' 
            ? '🟡 SOCORRISTA / TESTEMUNHA A CAMINHO DO LOCAL'
            : '🔴 AGUARDANDO SOCORRISTA / VOLUNTÁRIO MAIS PRÓXIMO',
          responder: em.responder || {
            name: 'Rede de Voluntários Notificada',
            role: 'Aguardando confirmação de deslocamento',
            distance: 'No Campus',
            eta: 'Notificação enviada',
          },
          totalNotified: em.totalNotified || 4,
        });
        setElapsed(Math.max(0, Math.floor((Date.now() - new Date(em.triggeredAt).getTime()) / 1000)));
      } else {
        setActiveEmergency(null);
      }
    } catch (e) {
      // Se não autenticado ou erro na API
      setActiveEmergency(null);
    }
  };

  useEffect(() => {
    loadActiveEmergency();
    const handleUpdate = () => loadActiveEmergency();
    window.addEventListener('ifam_emergency_updated', handleUpdate);
    return () => window.removeEventListener('ifam_emergency_updated', handleUpdate);
  }, [user]);

  useEffect(() => {
    if (!activeEmergency) return;
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeEmergency]);

  const handleResolveEmergency = async () => {
    if (!activeEmergency) return;
    try {
      await fetchApi(`/emergencies/${activeEmergency.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          resolutionNotes: 'Ocorrência atendida e finalizada diretamente pelo painel do campus.',
        }),
      });
      setActiveEmergency(null);
      window.dispatchEvent(new CustomEvent('ifam_emergency_updated'));
    } catch (e) {
      console.error('Erro ao finalizar emergência:', e);
      setActiveEmergency(null);
    }
  };

  if (!activeEmergency) return null;

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <>
      <div className="w-full bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 rounded-3xl p-4 md:p-5 border-2 border-red-500 shadow-2xl text-white relative overflow-hidden animate-fade-in space-y-3">
        {/* Glow Neon de Fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Linha 1: Status de Ativação e Cronômetro */}
        <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              🔴 SEU PEDIDO DE SOCORRO ESTÁ ATIVO
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-[10px] font-bold border border-amber-400/30">
              Registro #{activeEmergency.id}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Tempo decorrido: <strong className="text-white font-extrabold">{formatElapsed(elapsed)}</strong></span>
          </div>
        </div>

        {/* Linha 2: Resposta de Quem Está a Caminho (Quem Atendeu ao Chamado) */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Navigation className="w-5 h-5 animate-bounce" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                {activeEmergency.statusLabel}
              </p>
              <h4 className="text-sm font-extrabold text-white">
                {activeEmergency.responder.name}
              </h4>
              <p className="text-xs text-slate-300">
                {activeEmergency.responder.role} • <span className="text-emerald-300 font-bold">{activeEmergency.responder.distance} ({activeEmergency.responder.eta})</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setRespondersModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Ver Quem Está Ciente ({activeEmergency.totalNotified})</span>
            </button>

            {/* Botão de Finalização da Ocorrência para Servidores Habilitados */}
            <button
              onClick={() => {
                if (onOpenHistory) {
                  onOpenHistory();
                } else {
                  handleResolveEmergency();
                }
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Registrar Parecer Técnico e Concluir Ocorrência no Local"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>Finalizar Ocorrência</span>
            </button>
          </div>
        </div>

        {/* Linha 3: Localização Confirmada */}
        <div className="flex items-center justify-between text-xs text-slate-300 relative z-10 pt-1 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span>Local Informado: <strong className="text-white">{activeEmergency.location}</strong></span>
          </div>
          <span className="text-[10px] text-slate-400 italic">
            O aplicativo atualizará automaticamente quando o socorrista chegar ao local.
          </span>
        </div>
      </div>

      {/* Modal Dedicado de Pessoas Cientes e Resposta de Socorristas */}
      <EmergencyRespondersModal
        isOpen={respondersModalOpen}
        onClose={() => setRespondersModalOpen(false)}
        emergencyId={activeEmergency.id}
      />
    </>
  );
}
