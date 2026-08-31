'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, Clock, MapPin, Users, HeartPulse, AlertTriangle, FileText, Settings, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../lib/api';

export interface EmergencyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmergencyHistoryModal({ isOpen, onClose }: EmergencyHistoryModalProps) {
  const { user } = useAuth();

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

  // Ocorrências do Campus (Ativas e Finalizadas)
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado da caixa de finalização de ocorrência
  const [finalizerRole, setFinalizerRole] = useState<'SOLICITANTE' | 'SOCORRISTA'>('SOLICITANTE');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [selectedResolution, setSelectedResolution] = useState('');
  const [notes, setNotes] = useState('');

  const loadOccurrences = async () => {
    setLoading(true);
    try {
      const res: any = await fetchApi('/emergencies');
      if (res && res.occurrences && res.occurrences.length > 0) {
        setOccurrences(
          res.occurrences.map((item: any) => ({
            id: item.id,
            title: `Chamada de Ajuda: ${item.category === 'HARASSMENT' ? 'Assédio / Constrangimento' : item.category === 'HEALTH' ? 'Socorro de Saúde' : item.category === 'VIOLENCE' ? 'Segurança & Drogas' : 'Infraestrutura'} (${item.blockLocation})`,
            category: item.category,
            categoryLabel: item.category === 'HARASSMENT' ? '🛡️ Assédio / Constrangimento'
              : item.category === 'HEALTH' ? '🚑 Emergência de Saúde'
              : item.category === 'VIOLENCE' ? '🚨 Segurança & Drogas'
              : '🏢 Incêndios & Riscos',
            categoryColor: item.category === 'HARASSMENT' ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-500/30'
              : item.category === 'HEALTH' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
              : item.category === 'VIOLENCE' ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-500/30'
              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-500/30',
            campus: item.campus,
            location: item.blockLocation,
            involvedPersonName: item.involvedPersonName || '',
            targetActor: item.targetActor || 'SELF',
            triggeredAt: new Date(item.triggeredAt).toLocaleString('pt-BR'),
            resolvedAt: item.resolvedAt ? new Date(item.resolvedAt).toLocaleString('pt-BR') : null,
            witnessesResponded: item.responders?.length || 0,
            status: item.status,
            statusLabel: item.status === 'RESOLVED' ? '🟢 CONCLUÍDA NO LOCAL' : item.status === 'EN_ROUTE' ? '🟡 SOCORRISTA A CAMINHO' : '🔴 EM ANDAMENTO (Aguardando Resposta)',
            resolutionNotes: item.resolutionNotes || '',
            resolverName: item.resolverName || '',
          }))
        );
      } else {
        setOccurrences([]);
      }
    } catch (e) {
      console.error('Erro ao buscar ocorrências da API:', e);
      setOccurrences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOccurrences();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleResolveOccurrence = async (id: string) => {
    if (!selectedResolution) {
      alert('Por favor, selecione a resolução/parecer no dropdown antes de concluir!');
      return;
    }

    const fullResolutionText = `${selectedResolution}. ${notes ? `Obs: ${notes}` : ''}`;

    try {
      await fetchApi(`/emergencies/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          resolutionNotes: fullResolutionText,
          resolutionCategory: selectedResolution,
        }),
      });

      alert('✅ Ocorrência finalizada com sucesso no sistema e salva no histórico!');
      setResolvingId(null);
      setSelectedResolution('');
      setNotes('');
      loadOccurrences();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ifam_emergency_updated'));
      }
      onClose();
    } catch (e) {
      console.error('Erro ao finalizar ocorrência:', e);
      alert('Erro ao salvar finalização no banco.');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-6 space-y-6 cursor-default"
      >
        
        {/* Topo do Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md">
              📜
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Central de Ocorrências & Auditoria de Resolução
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhamento em tempo real, intervenção de testemunhas e pareceres de servidores
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

        {/* Lista de Ocorrências (Ativas e Finalizadas) */}
        <div className="space-y-4">
          {occurrences.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border space-y-3 shadow-sm transition ${
                item.status === 'ACTIVE'
                  ? 'bg-red-50/60 dark:bg-red-950/30 border-red-500/60 ring-2 ring-red-500/30 animate-pulse-subtle'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${item.categoryColor}`}>
                  {item.categoryLabel}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Registro #{item.id}</span>
              </div>

              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{item.title}</span>
                  {item.status === 'ACTIVE' && (
                    <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-black uppercase animate-pulse">
                      🔴 EM ANDAMENTO
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{item.location} ({item.campus})</span>
                </p>
              </div>

              {/* Se o evento estiver resolvido, mostra os detalhes de quem finalizou */}
              {item.status === 'RESOLVED' && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 space-y-1 text-xs">
                  <p className="font-black text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{item.statusLabel}</span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {item.resolutionNotes}
                  </p>
                  {item.resolverName && (
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold pt-1">
                      Auditado por: {item.resolverName}
                    </p>
                  )}
                </div>
              )}

              {/* Se for uma ocorrência ATIVA: Encerramento Automático baseado em quem está acessando */}
              {(item.status === 'ACTIVE' || item.status === 'EN_ROUTE') && (() => {
                const isThisUserRequester = Boolean(
                  item.targetActor === 'SELF' ||
                  (user && item.involvedPersonName && (
                    item.involvedPersonName.toLowerCase().includes(user.name.toLowerCase().split(' ')[0]) ||
                    user.name.toLowerCase().includes(item.involvedPersonName.toLowerCase().split(' ')[0])
                  ))
                );

                return (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-md space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Settings className="w-4 h-4 text-emerald-600" />
                        <span>
                          {isThisUserRequester
                            ? '🟢 Encerramento do Chamado de Socorro (Você)'
                            : '⚙️ Parecer Técnico de Atendimento (Servidor / Socorrista)'}
                        </span>
                      </p>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30">
                        {isThisUserRequester ? 'Autor do Pedido' : 'Equipe de Resposta'}
                      </span>
                    </div>

                    {/* Dropdown de Resolução: 100% Automático */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        {isThisUserRequester
                          ? 'Selecione o motivo da finalização do seu pedido:'
                          : 'Selecione o Parecer Oficial de Atendimento:'}
                      </label>
                      <select
                        value={selectedResolution}
                        onChange={(e) => setSelectedResolution(e.target.value)}
                        className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">-- Selecione o Motivo / Parecer de Finalização --</option>
                        
                        {/* Opções exclusivas para o Solicitante */}
                        {isThisUserRequester ? (
                          <>
                            <option value="🟢 Recebi atendimento no local e a situação está segura / resolvida">
                              🟢 Recebi atendimento no local e a situação está segura / resolvida
                            </option>
                            <option value="🟡 Não necessito mais de atendimento (Situação normalizou no local)">
                              🟡 Não necessito mais de atendimento (Situação normalizou no local)
                            </option>
                            <option value="🛑 Acionei por engano / Teste do sistema">
                              🛑 Acionei por engano / Teste do sistema
                            </option>
                          </>
                        ) : (
                          /* Opções técnicas exclusivas para Servidor / Socorrista */
                          <>
                            {item.category === 'HARASSMENT' && (
                              <>
                                <option value="🛡️ Dissipada com Sucesso no Local por Testemunhas (Cessação Imediata do Ato)">
                                  🛡️ Dissipada no Local por Testemunhas (Cessação Imediata do Ato)
                                </option>
                                <option value="⚖️ Encaminhada à Comissão de Ética e Ouvidoria Geral (Com Registro das Partes)">
                                  ⚖️ Encaminhada à Comissão de Ética e Ouvidoria Geral
                                </option>
                                <option value="💬 Mediação Conciliatória Realizada no Local pelo Servidor Responsável">
                                  💬 Mediação Conciliatória Realizada no Local pelo Servidor
                                </option>
                              </>
                            )}
                            {item.category === 'HEALTH' && (
                              <>
                                <option value="🏥 Atendimento de Primeiros Socorros Concluído no Local (Estabilizado)">
                                  🏥 Primeiros Socorros Concluídos no Local (Estabilizado)
                                </option>
                                <option value="🚑 Encaminhado ao Pronto-Socorro / SAMU Acionado (Com Acompanhamento)">
                                  🚑 Encaminhado ao Pronto-Socorro / SAMU Acionado
                                </option>
                                <option value="💊 Atendido pelo Setor de Enfermagem do Campus">
                                  💊 Atendido pelo Setor de Enfermagem do Campus
                                </option>
                              </>
                            )}
                            {item.category === 'VIOLENCE' && (
                              <>
                                <option value="👮 Intervenção da Segurança Patrimonial (Conflito Contido no Local)">
                                  👮 Intervenção da Segurança Patrimonial (Conflito Contido)
                                </option>
                                <option value="🚨 Acionamento da Polícia Militar / Forças de Segurança Pública">
                                  🚨 Acionamento da Polícia Militar / Forças de Segurança
                                </option>
                                <option value="⚠️ Medida Cautelar de Isolamento e Notificação à Direção Geral">
                                  ⚠️ Medida Cautelar de Isolamento e Notificação à Direção
                                </option>
                              </>
                            )}
                            {item.category === 'ASSET' && (
                              <>
                                <option value="🔧 Manutenção Emergencial Acionada e Área Isolada por Segurança">
                                  🔧 Manutenção Emergencial Acionada e Área Isolada
                                </option>
                                <option value="📦 Equipamento Recolhido e Registro de Furto/Vandalismo Gerado">
                                  📦 Equipamento Recolhido e Registro de Furto Gerado
                                </option>
                                <option value="🔥 Contenção Realizada pela Brigada de Incêndio / Segurança">
                                  🔥 Contenção Realizada pela Brigada de Incêndio
                                </option>
                              </>
                            )}
                            <option value="🟢 Ocorrência Atendida e Encerrada com Sucesso no Campus">
                              🟢 Ocorrência Atendida e Encerrada com Sucesso no Campus
                            </option>
                          </>
                        )}
                      </select>
                    </div>

                  {/* Campo Opcional de Observações */}
                  <div>
                    <input
                      type="text"
                      placeholder="Observações complementares sobre o encerramento (opcional)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    >
                    </input>
                  </div>

                  {/* Botão Concluir Ocorrência */}
                  <button
                    onClick={() => handleResolveOccurrence(item.id)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    <span>FINALIZAR E GRAVAR NO BANCO DE DADOS</span>
                  </button>
                </div>
              );
            })()}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>Acionado às: {item.triggeredAt}</span>
                <span>{item.resolvedAt ? `Finalizado às: ${item.resolvedAt}` : '🔴 Em Atendimento'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition"
          >
            Fechar Central de Ocorrências
          </button>
        </div>

      </div>
    </div>
  );
}
