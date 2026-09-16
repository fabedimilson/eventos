'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  User,
  Check,
  CheckCheck,
  Play,
  Sparkle,
  ExternalLink,
} from 'lucide-react';
import { UserProfile, ChatMessage, InstitutionalCategory } from '@ifam-eventos/types';
import { fetchApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ProtectedStateCard } from '../../components/ProtectedStateCard';
import { StoryViewerModal } from '../../components/StoryViewerModal';

interface RoomMeta {
  unreadCount: number;
  lastMessage: any;
  updatedAt: string;
}

export default function NetworkingPage() {
  const { user, updatePrivacy, loading: authLoading, refreshUnreadChatCount } = useAuth();
  const searchParams = useSearchParams();
  const openChatWith = searchParams ? searchParams.get('openChatWith') : null;

  const [attendees, setAttendees] = useState<UserProfile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<UserProfile | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [roomsMeta, setRoomsMeta] = useState<Record<string, RoomMeta>>({});
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  // Visualizador de Story compartilhado dentro do chat
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storyPostToView, setStoryPostToView] = useState<any>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Foca automaticamente no input ao abrir ou mudar de conversa
  useEffect(() => {
    if (selectedContact && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedContact, activeRoomId]);

  // Rola suavemente para o fim das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const moveContactToTop = (contactId: string) => {
    setAttendees((prev) => {
      const idx = prev.findIndex((a) => a.id === contactId);
      if (idx <= 0) return prev;
      const target = prev[idx];
      const rest = prev.filter((a) => a.id !== contactId);
      return [target, ...rest];
    });
  };

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

      const [dirRes, chatsRes, onlineRes]: any = await Promise.all([
        fetchApi(`/networking/directory?${query.toString()}`),
        fetchApi('/networking/chats/my').catch(() => null),
        fetchApi('/networking/online-users').catch(() => null),
      ]);

      if (onlineRes && Array.isArray(onlineRes.onlineUserIds)) {
        setOnlineUserIds(onlineRes.onlineUserIds);
      }

      if (dirRes && dirRes.attendees) {
        let loadedAttendees: UserProfile[] = [...dirRes.attendees];

        const metaMap: Record<string, RoomMeta> = {};
        if (chatsRes && chatsRes.rooms) {
          chatsRes.rooms.forEach((r: any) => {
            if (r.otherParticipant?.id) {
              metaMap[r.otherParticipant.id] = {
                unreadCount: r.unreadCount || 0,
                lastMessage: r.lastMessage,
                updatedAt: r.updatedAt,
              };
            }
          });
          setRoomsMeta(metaMap);

          // Reordena para colocar as últimas conversas no topo
          const recentContactIds = chatsRes.rooms
            .map((room: any) => room.otherParticipant?.id)
            .filter(Boolean);

          const recentAttendees: UserProfile[] = [];
          const otherAttendees: UserProfile[] = [];

          loadedAttendees.forEach((att) => {
            if (recentContactIds.includes(att.id)) {
              // Será ordenado abaixo
            } else {
              otherAttendees.push(att);
            }
          });

          recentContactIds.forEach((id: string) => {
            const found = loadedAttendees.find((a) => a.id === id);
            if (found) recentAttendees.push(found);
          });

          loadedAttendees = [...recentAttendees, ...otherAttendees];
        }

        setAttendees(loadedAttendees);
        if (openChatWith) {
          const found = loadedAttendees.find((a) => a.id === openChatWith);
          if (found) {
            handleSelectContact(found);
          } else {
            fetchApi<{ user: any }>(`/users/${openChatWith}/public-profile`)
              .then((res) => {
                if (res?.user) handleSelectContact(res.user);
              })
              .catch(() => null);
          }
        } else if (loadedAttendees.length > 0 && !selectedContact) {
          handleSelectContact(loadedAttendees[0]);
        } else if (loadedAttendees.length === 0) {
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

  // Escuta notificações de chat em tempo real via Socket/DOM event
  useEffect(() => {
    const handleChatNotification = (e: any) => {
      const { message, chatRoomId } = e.detail || {};
      if (message) {
        const senderId = message.senderId;
        if (senderId) {
          moveContactToTop(senderId);

          const isCurrentRoom = activeRoomId === chatRoomId;

          setRoomsMeta((prev) => {
            const current = prev[senderId] || { unreadCount: 0, lastMessage: null, updatedAt: new Date().toISOString() };
            return {
              ...prev,
              [senderId]: {
                ...current,
                unreadCount: isCurrentRoom ? 0 : (current.unreadCount || 0) + 1,
                lastMessage: message,
                updatedAt: message.sentAt || new Date().toISOString(),
              },
            };
          });

          if (isCurrentRoom) {
            // Se já está com essa sala aberta, marca como lido e atualiza o badge global
            fetchApi(`/networking/chats/${chatRoomId}/read`, { method: 'PATCH' }).catch(() => null);
            refreshUnreadChatCount();
          }
        }

        if (activeRoomId && chatRoomId === activeRoomId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });
        }
      }
    };

    const handlePresenceUpdate = (e: any) => {
      if (Array.isArray(e.detail)) {
        setOnlineUserIds(e.detail);
      }
    };

    const handleMessagesRead = (e: any) => {
      const { roomId } = e.detail || {};
      if (activeRoomId && roomId === activeRoomId) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    };

    window.addEventListener('ifam_chat_notification', handleChatNotification);
    window.addEventListener('ifam_presence_update', handlePresenceUpdate);
    window.addEventListener('ifam_messages_read', handleMessagesRead);
    return () => {
      window.removeEventListener('ifam_chat_notification', handleChatNotification);
      window.removeEventListener('ifam_presence_update', handlePresenceUpdate);
      window.removeEventListener('ifam_messages_read', handleMessagesRead);
    };
  }, [activeRoomId]);

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

        // Se houver mensagens não lidas, marca como lida no backend e atualiza localmente
        const hasUnread = (roomsMeta[contact.id]?.unreadCount || 0) > 0;
        if (hasUnread) {
          fetchApi(`/networking/chats/${res.chatRoom.id}/read`, { method: 'PATCH' }).catch(() => null);
          setRoomsMeta((prev) => ({
            ...prev,
            [contact.id]: {
              ...prev[contact.id],
              unreadCount: 0,
            },
          }));
          refreshUnreadChatCount();
        }
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
        moveContactToTop(selectedContact.id);
        setRoomsMeta((prev) => ({
          ...prev,
          [selectedContact.id]: {
            unreadCount: 0,
            lastMessage: res.message,
            updatedAt: res.message.sentAt || new Date().toISOString(),
          },
        }));
      }
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e);
    }
  };

  const handleOpenSharedStory = (storyData: any) => {
    setStoryPostToView({
      id: storyData.id,
      mediaUrl: storyData.mediaUrl,
      content: storyData.title || storyData.content || '',
      createdAt: storyData.createdAt || new Date().toISOString(),
      user: {
        name: storyData.authorName || 'Participante',
        avatarUrl: storyData.authorAvatar,
      },
    });
    setStoryModalOpen(true);
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

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-210px)] min-h-[460px] max-h-[560px]">
        {/* Coluna da Esquerda: Lista de Contatos */}
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

          {/* Lista de Participantes com Prévia e Badges */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredAttendees.map((att) => {
              const isSelected = selectedContact?.id === att.id;
              const meta = roomsMeta[att.id];
              const hasUnread = (meta?.unreadCount || 0) > 0;

              return (
                <div
                  key={att.id}
                  onClick={() => handleSelectContact(att)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs'
                      : hasUnread
                      ? 'border-emerald-400/80 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/40 dark:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Link
                      href={`/perfil/${att.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="relative shrink-0 group/avatar cursor-pointer"
                      title={`Ver perfil acadêmico de ${att.name}`}
                    >
                      <img
                        src={att.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={att.name}
                        className="w-10 h-10 rounded-full object-cover border border-emerald-500/30 group-hover/avatar:border-emerald-500 group-hover/avatar:scale-105 transition"
                      />
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 animate-pulse" />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs truncate ${hasUnread ? 'font-black text-slate-950 dark:text-white' : 'font-bold text-slate-900 dark:text-slate-100'}`}>
                          {att.name}
                        </h4>
                        {meta?.lastMessage && (
                          <span className={`text-[9px] shrink-0 ${hasUnread ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                            {new Date(meta.lastMessage.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {meta?.lastMessage ? (
                        <p className={`text-[10px] truncate mt-0.5 ${hasUnread ? 'font-bold text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                          {meta.lastMessage.senderId === user?.id ? 'Você: ' : ''}
                          {meta.lastMessage.content.startsWith('[STORY_SHARE:')
                            ? '📸 Story compartilhado'
                            : meta.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {att.bio || `${att.category} • ${att.campus}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Indicador de Não Lido / Ícone */}
                  <div className="shrink-0 flex items-center">
                    {hasUnread ? (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
                        {meta.unreadCount > 9 ? '9+' : meta.unreadCount}
                      </span>
                    ) : (
                      <MessageSquare className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna da Direita: Janela de Chat 1-to-1 */}
        <div className="lg:col-span-7 glass-panel p-4 rounded-3xl flex flex-col justify-between h-full overflow-hidden">
          {/* Top Bar da Conversa */}
          {selectedContact ? (
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5 shrink-0">
              <Link
                href={`/perfil/${selectedContact.id}`}
                className="flex items-center gap-2.5 group cursor-pointer"
                title={`Ver perfil completo de ${selectedContact.name}`}
              >
                <img
                  src={selectedContact.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={selectedContact.name}
                  className="w-9 h-9 rounded-full object-cover border border-emerald-500/30 group-hover:scale-105 group-hover:border-emerald-500 transition"
                />
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition flex items-center gap-1.5">
                    <span>{selectedContact.name}</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition text-emerald-500" />
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium">
                    {onlineUserIds.includes(selectedContact.id) ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Online agora</span>
                        <span className="text-slate-400 dark:text-slate-500">• {selectedContact.campus || 'Campus IFAM'}</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Offline</span>
                        <span className="text-slate-400 dark:text-slate-500">• {selectedContact.campus || 'Campus IFAM'}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  href={`/perfil/${selectedContact.id}`}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                  title="Ver perfil completo e histórico acadêmico"
                >
                  <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Ver Perfil</span>
                </Link>

                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                  {selectedContact.category}
                </span>
              </div>
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

                // Detecta se a mensagem é um Story Compartilhado
                let storyData: any = null;
                if (msg.content.startsWith('[STORY_SHARE:') && msg.content.endsWith(']')) {
                  try {
                    const rawJson = msg.content.slice('[STORY_SHARE:'.length, -1);
                    storyData = JSON.parse(rawJson);
                  } catch {
                    storyData = null;
                  }
                }

                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    {storyData ? (
                      /* Card Rico de Story Compartilhado */
                      <div
                        onClick={() => handleOpenSharedStory(storyData)}
                        className={`max-w-xs p-2.5 rounded-2xl shadow-md cursor-pointer transition-transform hover:scale-[1.02] border ${
                          isMine
                            ? 'bg-slate-900 border-emerald-500/50 text-white rounded-br-none'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-bl-none'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider mb-1.5">
                          <span>📸</span> Story Compartilhado
                        </div>

                        {storyData.mediaUrl && (
                          <div className="relative w-full h-40 rounded-xl overflow-hidden mb-2 bg-black/40">
                            <img
                              src={storyData.mediaUrl}
                              alt="Story"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                              <span className="w-8 h-8 rounded-full bg-white/80 text-slate-900 flex items-center justify-center shadow-lg">
                                <Play className="w-4 h-4 ml-0.5 fill-slate-900" />
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="text-xs font-bold truncate">
                          {storyData.title || `Story de ${storyData.authorName || 'Participante'}`}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                          <span>Por {storyData.authorName || 'Participante'}</span>
                          <span className="text-emerald-400 font-bold">Toque para ver</span>
                        </p>
                      </div>
                    ) : (
                      /* Balão Padrão de Texto */
                      <div
                        className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isMine
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}

                    <span className="text-[9px] text-slate-400 mt-0.5 px-1 flex items-center gap-1">
                      {time}
                      {isMine && (
                        msg.isRead ? (
                          <span title="Lida"><CheckCheck className="w-3.5 h-3.5 text-emerald-500" /></span>
                        ) : (
                          <span title="Enviada (Aguardando leitura)"><Check className="w-3.5 h-3.5 text-slate-400" /></span>
                        )
                      )}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulário de Envio Instantâneo Fixado */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <input
              ref={inputRef}
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

      {/* Modal para Visualizar Story Compartilhado */}
      {storyModalOpen && storyPostToView && (
        <StoryViewerModal
          isOpen={storyModalOpen}
          onClose={() => setStoryModalOpen(false)}
          customTitle={`Story de ${storyPostToView.user?.name || 'Participante'}`}
          is24hMode={true}
        />
      )}
    </div>
  );
}
