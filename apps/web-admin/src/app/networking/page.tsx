'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Search,
  Eye,
  EyeOff,
  Send,
  Sparkles,
  Shield,
  UserCheck,
  CheckCheck,
} from 'lucide-react';
import { UserProfile, ChatMessage, InstitutionalCategory } from '@ifam-eventos/types';
import { fetchApi, WS_BASE_URL } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ProtectedStateCard } from '../../components/ProtectedStateCard';
import io, { Socket } from 'socket.io-client';

export default function NetworkingPage() {
  const { user, updatePrivacy, loading: authLoading } = useAuth();

  const [attendees, setAttendees] = useState<UserProfile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<UserProfile | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Carrega participantes reais do banco de dados
  const loadDirectory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedCategory !== 'ALL') query.append('category', selectedCategory);
      if (search.trim()) query.append('search', search.trim());

      const res: any = await fetchApi(`/networking/directory?${query.toString()}`);
      if (res && res.attendees) {
        setAttendees(res.attendees);
        if (res.attendees.length > 0 && !selectedContact) {
          handleSelectContact(res.attendees[0]);
        } else if (res.attendees.length === 0) {
          setSelectedContact(null);
          setMessages([]);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar diretório:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory();
  }, [user, selectedCategory, search]);

  if (!authLoading && !user) {
    return (
      <ProtectedStateCard
        title="Networking & Chat Direct"
        description="Faça login com sua conta do IFAM para conversar com participantes dos eventos, trocar mensagens diretas e interagir no diretório de participantes."
      />
    );
  }

  const handleSelectContact = async (contact: UserProfile) => {
    setSelectedContact(contact);
    setMessages([]);

    try {
      const res: any = await fetchApi('/networking/chats/direct', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: contact.id }),
      });

      if (res && res.chatRoom) {
        setActiveRoomId(res.chatRoom.id);
        setMessages(res.chatRoom.messages || []);
      }
    } catch (e) {
      console.error('Erro ao abrir conversa:', e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedContact || !activeRoomId) return;

    const content = inputText.trim();
    setInputText('');

    try {
      const res: any = await fetchApi(`/networking/chats/${activeRoomId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });

      if (res && res.message) {
        setMessages((prev) => [...prev, res.message]);
      }
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e);
    }
  };

  const filteredAttendees = attendees;

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* Cabeçalho de Networking Compacto */}
      <div className="glass-panel p-4 px-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-unifik-violet-100 dark:bg-emerald-950/60 text-unifik-primary dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
              Matchmaking & Conexões
            </span>
            <span className="text-[11px] text-slate-500">• Chat em Tempo Real</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
            Diretório de Participantes & Mensagens
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Alternador de Modo Invisível (Privacidade) */}
          <div className="flex items-center gap-3 p-1.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Modo Invisível
              </p>
              <p className="text-[9px] text-slate-400">
                {user?.isInvisibleInNetworking ? 'Oculto' : 'Visível'}
              </p>
            </div>

            <button
              onClick={() => updatePrivacy(!user?.isInvisibleInNetworking)}
              className={`p-1.5 rounded-xl transition ${
                user?.isInvisibleInNetworking
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
              }`}
              title="Alternar Visibilidade"
            >
              {user?.isInvisibleInNetworking ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Grid Principal: Altura Fixa e Otimizada para Caber na Tela sem Rolagem */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-210px)] min-h-[460px] max-h-[560px]">
        {/* Coluna da Esquerda: Diretório de Participantes (5 colunas) */}
        <div className="lg:col-span-5 glass-panel p-4 rounded-3xl flex flex-col space-y-3 h-full overflow-hidden">
          <div className="space-y-2">
            {/* Input de Busca */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar participante por nome, campus ou bio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-unifik-primary"
              />
            </div>

            {/* Filtro de Categorias */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {['ALL', 'ALUNO', 'PROFESSOR', 'TECNICO', 'EXTERNO'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-unifik-primary text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'ALL' ? 'Todos' : cat === 'ALUNO' ? 'Alunos' : cat === 'PROFESSOR' ? 'Professores' : cat === 'TECNICO' ? 'Técnicos' : 'Externos'}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Participantes com Rolagem Interna */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredAttendees.map((att) => {
              const isSelected = selectedContact?.id === att.id;
              return (
                <div
                  key={att.id}
                  onClick={() => handleSelectContact(att)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/40 dark:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={att.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={att.name}
                      className="w-9 h-9 rounded-full object-cover border border-emerald-500/30"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{att.name}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{att.bio}</p>
                      <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {att.category} • {att.campus}
                      </span>
                    </div>
                  </div>

                  <MessageSquare className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna da Direita: Janela de Chat 1-to-1 com Input Sempre Visível */}
        <div className="lg:col-span-7 glass-panel p-4 rounded-3xl flex flex-col justify-between h-full overflow-hidden">
          {/* Top Bar da Conversa */}
          {selectedContact ? (
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5 shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedContact.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={selectedContact.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{selectedContact.name}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Conectado ao Evento</span>
                  </div>
                </div>
              </div>

              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                {selectedContact.category}
              </span>
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-slate-500 shrink-0">Selecione um participante para conversar</div>
          )}

          {/* Área de Mensagens com Rolagem Automática */}
          <div className="flex-1 overflow-y-auto space-y-2.5 p-2 pr-2 my-2">
            {messages.length === 0 && selectedContact ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-1.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base font-black shadow-xs">
                  💬
                </div>
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                  Inicie uma conversa com {selectedContact.name.split(' ')[0]}
                </h4>
                <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                  Envie uma mensagem abaixo para conectar e trocar ideias!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === (user?.id || 'me');
                const time = new Date(msg.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isMine
                          ? 'bg-unifik-primary text-white rounded-br-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 px-1 flex items-center gap-1">
                      {time} {isMine && <CheckCheck className="w-3 h-3 text-emerald-500" />}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Formulário de Envio Instantâneo Fixado na Janela */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <input
              type="text"
              placeholder="Digite sua mensagem direta em tempo real..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-unifik-primary"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white shadow-md transition active:scale-95 cursor-pointer"
              title="Enviar Mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
