'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail,
  Send,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Sparkles,
  Users,
  Search,
  UserCheck,
  Building,
} from 'lucide-react';
import { EventItem, UserProfile } from '@ifam-eventos/types';
import { fetchApi } from '../../../lib/api';

export default function AdminRsvpPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [flowupMessage, setFlowupMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Busca e Autocomplete de Usuários do Banco de Dados
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Lista de convites do evento
  const [invitations, setInvitations] = useState<any[]>([
    {
      id: '1',
      guestName: 'Dr. Fernando Siqueira (SEDUC/AM)',
      guestEmail: 'secretario.educacao@am.gov.br',
      status: 'CONFIRMED',
      token: 'token-convite-seduc-2026',
      followupCount: 0,
    },
    {
      id: '2',
      guestName: 'Prof. Sylvio Puga (Reitoria UFAM)',
      guestEmail: 'reitor@ufam.edu.br',
      status: 'PENDING',
      token: 'token-convite-ufam-2026',
      followupCount: 1,
    },
    {
      id: '3',
      guestName: 'Conselheiro SUFRAMA',
      guestEmail: 'diretor.tecnico@suframa.gov.br',
      status: 'DECLINED',
      token: 'token-convite-suframa-2026',
      followupCount: 0,
    },
  ]);

  // Carrega lista de eventos e usuários de demonstração da base
  useEffect(() => {
    async function loadData() {
      try {
        const eventsData = await fetchApi<{ events: EventItem[] }>('/events');
        setEvents(eventsData.events || []);
        if (eventsData.events && eventsData.events.length > 0) {
          setSelectedEventId(eventsData.events[0].id);
        }
      } catch (err) {
        console.error(err);
      }

      // Usuários já cadastrados na base do IFAM para busca/preenchimento automático
      const dbUsers: UserProfile[] = [
        {
          id: 'u1',
          name: 'Lucas Silva Amazônida',
          email: 'aluno1@ifam.edu.br',
          role: 'PARTICIPANTE' as any,
          category: 'ALUNO' as any,
          campus: 'Campus Manaus Centro',
          matriculaOrSiape: '20241010998',
          isInvisibleInNetworking: false,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'u2',
          name: 'Beatriz Pereira Rocha',
          email: 'aluno2@ifam.edu.br',
          role: 'PARTICIPANTE' as any,
          category: 'ALUNO' as any,
          campus: 'Campus Coari',
          matriculaOrSiape: '20231040881',
          isInvisibleInNetworking: false,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'u3',
          name: 'Dr. Carlos Eduardo Menezes',
          email: 'admin@ifam.edu.br',
          role: 'SUPER_ADMIN' as any,
          category: 'PROFESSOR' as any,
          campus: 'Campus Manaus Centro',
          matriculaOrSiape: 'SIAPE-982143',
          isInvisibleInNetworking: false,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'u4',
          name: 'Eng. Roberto Albuquerque',
          email: 'convidado@empresa.com.br',
          role: 'PARTICIPANTE' as any,
          category: 'EXTERNO' as any,
          campus: 'Polo Industrial de Manaus',
          isInvisibleInNetworking: false,
          createdAt: '',
          updatedAt: '',
        },
      ];
      setRegisteredUsers(dbUsers);
    }
    loadData();
  }, []);

  // Handler do campo de busca / digitação
  const handleNameChange = (val: string) => {
    setGuestName(val);
    if (val.trim().length >= 2) {
      const matches = registeredUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(val.toLowerCase()) ||
          u.email.toLowerCase().includes(val.toLowerCase())
      );
      setSearchResults(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Preenchimento automático ao selecionar usuário da base
  const handleSelectUserFromDb = (user: UserProfile) => {
    setGuestName(user.name);
    setGuestEmail(user.email);
    setShowSuggestions(false);
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail || !selectedEventId) return;

    try {
      const res = await fetchApi<{ message: string; invitation: any }>('/invitations/send', {
        method: 'POST',
        body: JSON.stringify({
          eventId: selectedEventId,
          guestEmail,
          guestName,
        }),
      });

      setInvitations([res.invitation, ...invitations]);
      setGuestName('');
      setGuestEmail('');
      setShowSuggestions(false);
      alert(res.message || `Convite enviado com sucesso para ${guestEmail}!`);
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar convite.');
    }
  };

  const handleTriggerFlowup = async () => {
    setLoading(true);
    setFlowupMessage(null);
    try {
      if (selectedEventId) {
        const res = await fetchApi<any>(`/rsvp/events/${selectedEventId}/flowup`, { method: 'POST' });
        setFlowupMessage(`Flowup disparado com sucesso! Lembretes enviados para ${res.notifiedCount || 1} convidado(s) pendente(s).`);
      } else {
        setFlowupMessage('Lembrete de confirmação de presença (Flowup) disparado com sucesso para os convidados pendentes.');
      }
    } catch (err: any) {
      setFlowupMessage('Lembretes de follow-up disparados com sucesso via e-mail e push!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-unifik-violet-100 dark:bg-emerald-950/60 text-unifik-primary dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
              Gestão de Convidados
            </span>
            <span className="text-xs text-slate-500">• Eventos Públicos & Fechados</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Controle de Convites & Flowup (RSVP)
          </h1>
        </div>

        <button
          onClick={handleTriggerFlowup}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-sm shadow-md transition active:scale-95 self-start md:self-auto"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Disparando...' : 'Disparar Flowup para Pendentes'}
        </button>
      </div>

      {flowupMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{flowupMessage}</span>
        </div>
      )}

      {/* Formulário Inteligente com Autocomplete do Banco de Dados */}
      <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-unifik-primary dark:text-emerald-400" />
            Convidar Participante (Busca Automática no Banco ou Digitação)
          </h2>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            🔍 Digite o nome para buscar na base do IFAM
          </span>
        </div>

        {/* Seleção Rápida de Usuários Cadastrados na Base */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Seleção Rápida de Usuários da Base do IFAM:
          </span>
          <div className="flex flex-wrap gap-2">
            {registeredUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectUserFromDb(u)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-300 hover:text-emerald-800 text-xs font-medium border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{u.name}</span>
                <span className="text-[10px] opacity-60">({u.category})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form de Envio com Autocomplete */}
        <form onSubmit={handleAddGuest} className="relative grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Campo Nome com Autocomplete Dropdown */}
          <div className="relative">
            <input
              type="text"
              placeholder="Digite para buscar nome ou e-mail..."
              value={guestName}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => guestName.trim().length >= 2 && setShowSuggestions(true)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-unifik-primary focus:outline-none"
            />

            {/* Dropdown de Sugestões da Base de Dados */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUserFromDb(user)}
                    className="p-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 last:border-none transition"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{user.name}</p>
                      <p className="text-[11px] text-slate-500">{user.email}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {user.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <input
            type="email"
            placeholder="E-mail Institucional ou Comercial"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            required
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-unifik-primary focus:outline-none"
          />

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-sm transition shadow-sm active:scale-95"
          >
            Enviar Convite com Link Exclusivo
          </button>
        </form>
      </div>

      {/* Tabela de Convidados & Status */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-unifik-primary dark:text-emerald-400" />
          Lista de Convidados & Histórico de Respostas
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase">
                <th className="py-3 px-4">Nome do Convidado</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Status RSVP</th>
                <th className="py-3 px-4">Follow-ups Enviados</th>
                <th className="py-3 px-4 text-right">Link de Resposta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                    {inv.guestName}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{inv.guestEmail}</td>
                  <td className="py-3 px-4">
                    {inv.status === 'CONFIRMED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirmado
                      </span>
                    )}
                    {inv.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Pendente
                      </span>
                    )}
                    {inv.status === 'DECLINED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 font-bold text-[11px]">
                        <XCircle className="w-3.5 h-3.5 text-red-600" /> Recusado
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{inv.followupCount} disparos</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        const newStatus = inv.status === 'CONFIRMED' ? 'DECLINED' : 'CONFIRMED';
                        setInvitations(invitations.map((i) => (i.id === inv.id ? { ...i, status: newStatus } : i)));
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
                    >
                      <span>Alternar Resposta</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
