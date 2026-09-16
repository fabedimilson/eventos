'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, HeartPulse, Users, AlertTriangle, Building2, MapPin, CheckCircle, Radio, Clock, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { fetchApi } from '../lib/api';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmergencyTriggered?: (details: any) => void;
}

export function EmergencyModal({ isOpen, onClose, onEmergencyTriggered }: EmergencyModalProps) {
  const { user } = useAuth();

  // O campus é fixo e predefinido pelo cadastro do usuário logado (ex: Campus Manaus Centro)
  const userCampus = user?.campus || 'Campus Manaus Centro';

  // Estados do formulário de solicitação de socorro
  const [targetActor, setTargetActor] = useState<'SELF' | 'OTHER'>('SELF');
  const [involvedPersonName, setInvolvedPersonName] = useState('');
  const [category, setCategory] = useState<'HARASSMENT' | 'HEALTH' | 'VIOLENCE' | 'ASSET'>('HARASSMENT');
  const [blockLocation, setBlockLocation] = useState(''); // Inicializa 100% em branco como solicitado
  const [triggered, setTriggered] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [activeAlertDetails, setActiveAlertDetails] = useState<any>(null);

  if (!isOpen || !user) return null;

  const handleStartTrigger = async () => {
    if (!blockLocation.trim()) {
      alert('Por favor, informe o Bloco, Sala ou Local exato onde a ajuda é necessária!');
      return;
    }

    setTriggered(true);
    let count = 3;
    const interval = setInterval(async () => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);

        try {
          const res: any = await fetchApi('/emergencies', {
            method: 'POST',
            body: JSON.stringify({
              category,
              blockLocation,
              targetActor,
              involvedPersonName: involvedPersonName || (targetActor === 'SELF' ? user?.name : 'Vítima Não Identificada'),
            }),
          });

          const created = res.emergency || {
            id: `EMG-${Date.now().toString().substring(7)}`,
            targetActor,
            involvedPersonName,
            category,
            campus: userCampus,
            blockLocation,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            status: 'ACTIVE',
          };

          setActiveAlertDetails(created);
          if (onEmergencyTriggered) onEmergencyTriggered(created);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ifam_emergency_updated'));
          }
        } catch (e) {
          console.error('Erro ao salvar emergência na API:', e);
        }
      }
    }, 1000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl border-2 border-red-500/80 text-white flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden my-auto cursor-default"
      >
        {/* Topo Claro e Objetivo de Solicitação de Socorro */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800 shrink-0 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-sm shadow-lg animate-pulse">
              🚨
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>Central de Alerta & Pedido de Apoio</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {!triggered ? (
          <>
            {/* Corpo Rolável */}
            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-3 space-y-3 text-xs">
              {/* 1. Ator / Destinatário da Ocorrência */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 shrink-0">
                <label className="block font-extrabold text-slate-200 uppercase text-[11px] tracking-wider">
                  1. A quem se destina a solicitação de ajuda?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetActor('SELF')}
                    className={`p-2 rounded-xl border text-center font-extrabold transition flex items-center justify-center gap-1.5 text-xs ${
                      targetActor === 'SELF'
                        ? 'bg-red-600 text-white border-red-500 shadow-md'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>👤 É Comigo (Sou a Vítima)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetActor('OTHER')}
                    className={`p-2 rounded-xl border text-center font-extrabold transition flex items-center justify-center gap-1.5 text-xs ${
                      targetActor === 'OTHER'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>👀 Presenciei Outra Pessoa</span>
                  </button>
                </div>

                {/* Campo de Identificação da Vítima / Autor se for o caso */}
                <div className="pt-0.5">
                  <input
                    type="text"
                    placeholder={targetActor === 'SELF' ? 'Seu Nome / Matrícula (Já preenchido automaticamente)' : 'Nome da Vítima ou Descrição do Envolvido (Opcional)...'}
                    value={targetActor === 'SELF' ? (user ? `${user.name} (${user.category})` : '') : involvedPersonName}
                    onChange={(e) => targetActor === 'OTHER' && setInvolvedPersonName(e.target.value)}
                    readOnly={targetActor === 'SELF'}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium placeholder-slate-500"
                  />
                </div>
              </div>

              {/* 2. Escolha de Categoria de Emergência */}
              <div className="space-y-2">
                <label className="block font-extrabold text-slate-200 uppercase text-[11px] tracking-wider shrink-0">
                  2. O que está acontecendo? (Selecione a Categoria):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Opção 1: Assédio / Bullying */}
                  <button
                    type="button"
                    onClick={() => setCategory('HARASSMENT')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      category === 'HARASSMENT'
                        ? 'bg-gradient-to-br from-purple-950 via-slate-900 to-slate-900 border-purple-500 ring-2 ring-purple-500/50 shadow-lg shadow-purple-950/40'
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-extrabold text-white text-xs leading-tight">🛡️ Assédio ou Bullying</p>
                      <p className="text-[10px] text-slate-300 leading-snug font-normal">
                        Perseguição, humilhações, cantadas abusivas, assédio moral ou intimidação.
                      </p>
                    </div>
                  </button>

                  {/* Opção 2: Saúde / Socorro */}
                  <button
                    type="button"
                    onClick={() => setCategory('HEALTH')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      category === 'HEALTH'
                        ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950/40'
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    <HeartPulse className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-extrabold text-white text-xs leading-tight">🚑 Emergência de Saúde</p>
                      <p className="text-[10px] text-slate-300 leading-snug font-normal">
                        Desmaios, crises de ansiedade, acidentes corporais ou mal-estar no campus.
                      </p>
                    </div>
                  </button>

                  {/* Opção 3: Violência / Armas */}
                  <button
                    type="button"
                    onClick={() => setCategory('VIOLENCE')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      category === 'VIOLENCE'
                        ? 'bg-gradient-to-br from-red-950 via-slate-900 to-slate-900 border-red-500 ring-2 ring-red-500/50 shadow-lg shadow-red-950/40'
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-extrabold text-white text-xs leading-tight">🚨 Violência e Ameaças</p>
                      <p className="text-[10px] text-slate-300 leading-snug font-normal">
                        Brigas, agressões físicas, ameaças graves, porte de armas ou drogas.
                      </p>
                    </div>
                  </button>

                  {/* Opção 4: Incêndios, Riscos e Patrimônio */}
                  <button
                    type="button"
                    onClick={() => setCategory('ASSET')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      category === 'ASSET'
                        ? 'bg-gradient-to-br from-amber-950 via-slate-900 to-slate-900 border-amber-500 ring-2 ring-amber-500/50 shadow-lg shadow-amber-950/40'
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-extrabold text-white text-xs leading-tight">🏢 Incêndios, Riscos e Patrimônio</p>
                      <p className="text-[10px] text-slate-300 leading-snug font-normal">
                        Incêndios, vazamentos, furtos, roubos, depredação ou avarias no campus.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Localização em Branco Obrigatória */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-800 shrink-0">
                <label className="block font-extrabold text-white uppercase text-[11px] tracking-wider">
                  3. Digite o Bloco, Sala ou Ponto de Referência Exato:
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Bloco A, Sala 14, Laboratório de Química..."
                    value={blockLocation}
                    onChange={(e) => setBlockLocation(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border-2 border-red-500/60 text-white font-bold placeholder-slate-500 focus:outline-none focus:border-red-500 text-xs shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Rodapé Fixo com Botão Principal de Disparo */}
            <div className="shrink-0 px-5 py-3 border-t border-slate-800 bg-slate-900">
              <button
                type="button"
                onClick={handleStartTrigger}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs sm:text-sm shadow-xl hover:shadow-red-600/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>DISPARAR ALERTA / SOLICITAR APOIO</span>
              </button>
            </div>
          </>
        ) : countdown > 0 ? (
          /* Contagem Regressiva de Segurança */
          <div className="p-6 sm:p-10 text-center space-y-4 my-auto overflow-y-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-600/20 border-4 border-red-500 text-red-500 flex items-center justify-center text-3xl sm:text-4xl font-black mx-auto animate-ping">
              {countdown}
            </div>
            <p className="text-base sm:text-lg font-black text-white">DISPARANDO ALERTA DE SOCORRO...</p>
            <p className="text-xs text-slate-400">Notificando testemunhas e pessoas habilitadas no {blockLocation}</p>
          </div>
        ) : (
          /* Estado de Acionamento Ativo */
          <div className="p-5 sm:p-6 text-center space-y-4 overflow-y-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase">
                🟢 PEDIDO DE SOCORRO ENVIADO COM SUCESSO!
              </span>
              <h3 className="text-base sm:text-lg font-black text-white pt-1">
                Testemunhas e Pessoas Habilitadas Notificadas
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                4 voluntários e servidores habilitados no {blockLocation} receberam o aviso emergencial para acompanhar o caso no local.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1 font-mono">
              <p className="text-emerald-400 font-bold">📍 Registro Oficial #EMG-8921</p>
              <p className="text-slate-300">Unidade: {userCampus}</p>
              <p className="text-slate-300">Local Exato: {blockLocation}</p>
              <p className="text-slate-300">Envolvidos: {targetActor === 'SELF' ? `Vítima: ${user?.name}` : `Reportado por: ${user?.name}`}</p>
              <p className="text-slate-400">Horário do Acionamento: {activeAlertDetails?.timestamp}</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-lg transition active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              FECHAR E ACOMPANHAR OCORRÊNCIA
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
