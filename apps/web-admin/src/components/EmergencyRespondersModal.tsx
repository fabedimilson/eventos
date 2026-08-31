'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Navigation, CheckCircle2, XCircle, Eye, ShieldAlert, PhoneCall, Radio, HeartPulse, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../lib/api';

interface EmergencyRespondersModalProps {
  isOpen: boolean;
  onClose: () => void;
  emergencyId?: string;
}

export function EmergencyRespondersModal({ isOpen, onClose, emergencyId = 'EMG-8921' }: EmergencyRespondersModalProps) {
  const { user } = useAuth();
  const isDemo = emergencyId === 'EMG-8921';

  // Se o usuário logado for o solicitante da emergência (vítima)
  const [isRequester, setIsRequester] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Se o usuário logado for um voluntário/servidor, ele pode responder:
  const isVoluntarioOrServidor = user && (
    user.category === 'PROFESSOR' ||
    user.category === 'TECNICO' ||
    user.category === 'SERVIDOR' ||
    user.role === 'ORGANIZADOR' ||
    user.role === 'ADMIN' ||
    user.role === 'SUPER_ADMIN' ||
    user.role === 'ADMIN_MASTER' ||
    user.role === 'ADMIN_UNIDADE'
  );

  // Minha resposta pessoal de socorrista
  const [myResponse, setMyResponse] = useState<'GOING' | 'CANNOT' | null>(null);

  // Lista de Pessoas Cientes e Resposta dos Socorristas em Tempo Real
  const [responders, setResponders] = useState<any[]>([]);

  // Carrega dados reais da ocorrência ou dados de demonstração
  const loadResponders = async () => {
    if (isDemo) {
      setIsRequester(false);
      setResponders([
        {
          id: 'resp-1',
          name: 'Prof. Marcos Andrade',
          role: 'Professor & Voluntário Habilitado',
          status: 'GOING',
          statusLabel: '🏃 Estou indo atender!',
          statusBadge: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-500/40',
          time: 'há 1 min',
          location: 'Bloco A (a 40m do local)',
        },
        {
          id: 'resp-2',
          name: 'Dra. Helena Tavares',
          role: 'Docente & Socorrista de Saúde',
          status: 'VIEWED',
          statusLabel: '👁️ Ciente do Alerta (Visualizou)',
          statusBadge: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-500/40',
          time: 'há 2 min',
          location: 'Bloco B',
        },
        {
          id: 'resp-3',
          name: 'Enf. Mariana Vasconcelos',
          role: 'Enfermeira do Campus',
          status: 'CANNOT',
          statusLabel: '❌ Não posso atender no momento',
          statusBadge: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-500/40',
          time: 'há 3 min',
          location: 'Em atendimento na enfermaria',
        },
        {
          id: 'resp-4',
          name: 'Lucas Silva Amazônida',
          role: 'Aluno Habilitado em Primeiros Socorros',
          status: 'NOTIFIED',
          statusLabel: '🔔 Notificado (Aguardando resposta)',
          statusBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300',
          time: 'há 4 min',
          location: 'Bloco A - 2º andar',
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const res: any = await fetchApi(`/emergencies/${emergencyId}/responders`);
      if (res) {
        setIsRequester(Boolean(res.isRequester));

        if (res.responders && res.responders.length > 0) {
          const formatted = res.responders
            .filter((r: any) => r.responseType !== 'VIEWED' || r.userName !== user?.name)
            .map((r: any) => ({
              id: r.id,
              name: r.userName,
              role: r.userRole || 'Servidor Habilitado',
              status: r.responseType,
              statusLabel: r.responseType === 'GOING' ? '🏃 Estou indo atender!'
                : r.responseType === 'CANNOT' ? '❌ Não posso atender no momento'
                : '👁️ Ciente do Alerta',
              statusBadge: r.responseType === 'GOING'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
                : r.responseType === 'CANNOT'
                ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-500/40'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-500/40',
              time: new Date(r.respondedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              location: 'No Campus',
            }));

          setResponders(formatted);
        } else {
          setResponders([]);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar socorristas reais:', e);
      setIsRequester(true);
      setResponders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadResponders();
    }
  }, [isOpen, emergencyId]);

  if (!isOpen) return null;

  const handleRespond = async (type: 'GOING' | 'CANNOT') => {
    setMyResponse(type);

    try {
      await fetchApi(`/emergencies/${emergencyId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ responseType: type }),
      });
      loadResponders();
    } catch (e) {
      console.error('Erro ao responder emergência na API:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ifam_emergency_updated'));
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-6 space-y-6 cursor-default"
      >
        
        {/* Topo do Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-md">
              👥
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Pessoas Cientes & Status dos Socorristas
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhamento nominal em tempo real do Alerta #{emergencyId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* CENÁRIO A: O USUÁRIO LOGADO É O SOLICITANTE DA EMERGÊNCIA (VÍTIMA) */}
        {isRequester ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-extrabold uppercase text-[11px] text-amber-600 dark:text-amber-400">
                ℹ️ Você é o Solicitante deste Chamado de Apoio
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                A rede de servidores voluntários habilitados do seu campus foi acionada imediatamente. Assim que um voluntário confirmar o deslocamento para o seu local, o status será atualizado na lista abaixo.
              </p>
            </div>
          </div>
        ) : (
          /* CENÁRIO B: O USUÁRIO LOGADO É UM SERVIDOR/VOLUNTÁRIO QUE RECEBEU O ALERTA */
          isVoluntarioOrServidor && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-amber-950 text-white space-y-3 shadow-lg border border-amber-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                  <p className="font-extrabold text-xs text-amber-300">
                    Sua Manifestação de Socorrista / Voluntário ({user?.name}):
                  </p>
                </div>
                {myResponse && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                    ✓ Resposta Salva
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleRespond('GOING')}
                  className={`p-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ${
                    myResponse === 'GOING'
                      ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400 font-black'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  <span>🏃 ESTOU INDO ATENDER!</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRespond('CANNOT')}
                  className={`p-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ${
                    myResponse === 'CANNOT'
                      ? 'bg-red-600 text-white shadow-md ring-2 ring-red-400 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>❌ NÃO POSSO ATENDER AGORA</span>
                </button>
              </div>
            </div>
          )
        )}

        {/* Lista Nominal de Quem Está Ciente / Socorristas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Manifestações de Atendimento em Tempo Real ({responders.length})
            </h3>
            {isDemo && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Modo Demonstração (DEMO)
              </span>
            )}
          </div>

          {responders.length === 0 ? (
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 mx-auto flex items-center justify-center">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Alerta transmitido para a rede de socorristas do campus!
              </p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Aguardando a primeira confirmação de deslocamento de um voluntário habilitado no bloco.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              {responders.map((item) => (
                <div key={item.id} className={`p-4 flex items-center justify-between gap-3 transition ${
                  item.name?.includes('Você') ? 'bg-emerald-950/20 border-l-4 border-l-emerald-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}>
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{item.name}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.role}</p>
                    <p className="text-[10px] text-slate-400">📍 {item.location} • {item.time}</p>
                  </div>

                  <span className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 shrink-0 ${item.statusBadge}`}>
                    {item.status === 'GOING' && <Navigation className="w-3.5 h-3.5 animate-bounce" />}
                    {item.status === 'CANNOT' && <XCircle className="w-3.5 h-3.5" />}
                    {item.status === 'VIEWED' && <Eye className="w-3.5 h-3.5" />}
                    <span>{item.statusLabel}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            Canal de Emergência Ativo
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition"
          >
            Fechar Janela
          </button>
        </div>

      </div>
    </div>
  );
}
