'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Tv,
  QrCode,
  CheckCircle,
  Award,
  PlayCircle,
  Sparkles,
  Users,
  Lock,
  Globe,
  X,
  Printer,
  Maximize2,
  Info,
  Upload,
  Check,
  Building2,
  Mail,
  ShieldCheck,
  Youtube,
  Radio,
  ExternalLink,
  MessageSquare,
  Camera,
  Image as ImageIcon,
  Heart,
  Ticket,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { EventItem, SessionItem, RegistrationItem } from '@ifam-eventos/types';
import { fetchApi, API_BASE_URL } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { AuthModal } from '../../../components/AuthModal';
import { TicketPassModal } from '../../../components/TicketPassModal';

export default function EventDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const { user } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null);
  const [registered, setRegistered] = useState(false);
  const [registration, setRegistration] = useState<RegistrationItem | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  // Controle de Modais (Zoom de Imagem e Dicas de Banner)
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [showBannerTips, setShowBannerTips] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Aba Principal: Programação Oficial vs Rede Social do Evento
  const [activeMainTab, setActiveMainTab] = useState<'schedule' | 'feed'>('schedule');
  const [eventPosts, setEventPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMediaUrl, setNewPostMediaUrl] = useState('');
  const [posting, setPosting] = useState(false);
  const [dailyData, setDailyData] = useState<any>(null);
  
  const [activeDateTab, setActiveDateTab] = useState<string>('');
  const feedFileInputRef = React.useRef<HTMLInputElement>(null);

  const isOrganizerOrAdmin = user && (user.role === 'ORGANIZADOR' || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN_MASTER' || user.role === 'ADMIN_UNIDADE');

  const getYouTubeEmbedUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=0&rel=0` : url;
  };

  const handleExportAttendanceCsv = async () => {
    if (!event) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('ifam_token') || localStorage.getItem('@ifam_eventos:token') : '';
      const response = await fetch(`${API_BASE_URL}/analytics/events/${event.id}/export-attendance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao exportar relatório.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frequencia_${event.slug}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Erro ao exportar arquivo de frequências.');
    }
  };

  const loadPosts = async (eventId: string) => {
    try {
      const res = await fetchApi<{ posts: any[] }>(`/events/${eventId}/posts`);
      setEventPosts(res.posts || []);
    } catch (err) {
      console.error('Erro ao carregar feed:', err);
    }
  };

  const loadUserRegistration = async (eventId: string) => {
    if (!user) return;
    try {
      const res = await fetchApi<{ registration: RegistrationItem }>(`/events/${eventId}/my-registration`);
      if (res.registration) {
        setRegistered(true);
        setRegistration(res.registration);
      }
    } catch (err) {
      // Usuário não está inscrito ainda
    }
  };

  const loadDailyAttendance = async (eventId: string) => {
    if (!user) return;
    try {
      const res: any = await fetchApi(`/events/${eventId}/daily-attendance`);
      if (res) setDailyData(res);
    } catch (err) {
      console.error('Erro ao buscar frequência diária:', err);
    }
  };

  const handleDailyCheckIn = async () => {
    if (!event) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    try {
      const res: any = await fetchApi(`/events/${event.id}/daily-attendance/checkin`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      alert(res.message || 'Presença registrada com sucesso!');
      await loadDailyAttendance(event.id);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar frequência diária.');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!newPostContent.trim() && !newPostMediaUrl.trim()) return;

    setPosting(true);
    try {
      await fetchApi(`/events/${event.id}/posts`, {
        method: 'POST',
        body: JSON.stringify({
          content: newPostContent,
          mediaUrl: newPostMediaUrl || undefined,
          mediaType: 'IMAGE',
        }),
      });
      setNewPostContent('');
      setNewPostMediaUrl('');
      await loadPosts(event.id);
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar no feed.');
    } finally {
      setPosting(false);
    }
  };

  useEffect(() => {
    async function loadEventData() {
      try {
        const data = await fetchApi<{ event: EventItem }>(`/events/${slug}`);
        setEvent(data.event);
        if (data.event) {
          loadPosts(data.event.id);
          loadUserRegistration(data.event.id);
          loadDailyAttendance(data.event.id);
        }
        if (data.event.sessions && data.event.sessions.length > 0) {
          const live = data.event.sessions.find((s) => s.isLiveActive);
          setActiveSession(live || data.event.sessions[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadEventData();
  }, [slug, user]);

  const handleOpenPass = () => {
    const activeUser: any = user || {
      id: 'usr-default',
      name: 'Participante IFAM',
      email: 'participante@ifam.edu.br',
      category: 'ALUNO',
      role: 'PARTICIPANTE',
      campus: event?.campus || 'Campus Manaus Centro',
      avatarUrl: undefined,
      isInvisibleInNetworking: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!registration && event) {
      setRegistration({
        id: `reg-${event.id}`,
        eventId: event.id,
        userId: activeUser.id,
        code: `IFAM-PASS-${event.id.slice(0, 6).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        attendanceConfirmed: true,
        event: event,
        user: activeUser,
      });
    } else if (registration && user?.avatarUrl && !registration.user?.avatarUrl) {
      setRegistration({
        ...registration,
        user: {
          ...registration.user,
          ...user,
        },
      });
    }
    setShowTicketModal(true);
  };

  const handleRegister = async () => {
    if (!event) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setRegistering(true);
    try {
      const res = await fetchApi<{ registration: RegistrationItem }>(`/events/${event.id}/register`, { method: 'POST' });
      setRegistered(true);
      setRegistration(res.registration);
      setShowTicketModal(true); // Abre o bilhete de entrada imediatamente após confirmação
    } catch (err: any) {
      if (err.message && (err.message.includes('Token') || err.message.includes('expirado') || err.message.includes('401'))) {
        setAuthModalOpen(true);
      } else {
        alert(err.message || 'Erro ao processar inscrição.');
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-500">
        <div className="w-8 h-8 border-4 border-unifik-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Carregando programação oficial do evento...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="glass-panel text-center py-20 rounded-2xl">
        <p className="text-lg font-bold text-slate-700 dark:text-slate-300">Evento não encontrado</p>
        <Link href="/" className="text-sm text-unifik-primary dark:text-emerald-400 underline mt-2 inline-block">
          Voltar ao catálogo principal
        </Link>
      </div>
    );
  }

  const isPublic = event.visibility === 'PUBLIC';
  const defaultBg = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200';
  const bannerImage = event.bannerUrl || defaultBg;

  // Organiza as sessões do evento
  const sessions = event.sessions || [];

  // Dados do Organizador Responsável
  const organizerName = event.organizer?.name || 'Mariana Vasconcelos';
  const organizerEmail = event.organizer?.email || 'organizador@ifam.edu.br';
  const organizerDepartment = 'Diretoria de Extensão, Pesquisa e Eventos (DIREX / IFAM CMC)';

  // Canal Oficial do IFAM no YouTube
  const youtubeChannelUrl = 'https://www.youtube.com/@IFAMOficial?sub_confirmation=1';

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. HERO DO EVENTO */}
      
      {/* --- VERSÃO MOBILE: CARROSSEL --- */}
      <div className="md:hidden relative w-full overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full relative z-10">
          {/* SLIDE 1: Capa, Título e Inscrição */}
          <div className="w-full flex-shrink-0 snap-center p-5 flex flex-col justify-between space-y-5">
            <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-slate-700 shadow-lg bg-slate-950">
              <img src={bannerImage} alt={event.title} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-3 text-center">
              <div className="flex flex-wrap justify-center items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" /> Evento Oficial IFAM
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-950/80 text-red-300 text-[10px] font-bold border border-red-500/40 animate-pulse">
                  <Radio className="w-3 h-3 text-red-400" /> Ao Vivo
                </span>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-white leading-snug">
                {event.title}
              </h1>
            </div>

            <div className="w-full space-y-2">
              {registered ? (
                <button
                  onClick={handleOpenPass}
                  className="w-full py-3.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 active:scale-95 border border-emerald-400/40 animate-pulse"
                >
                  <Ticket className="w-4 h-4 text-emerald-200" />
                  <span>🎫 Acessar Meu Pass (QR Code)</span>
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full py-3.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 bg-unifik-primary active:bg-unifik-violet-600 text-white"
                >
                  {registering ? 'Confirmando...' : 'Garantir Minha Inscrição'}
                </button>
              )}
              <div className="flex justify-center items-center gap-2 mt-3 text-[10px] text-slate-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                <span className="ml-1">Deslize para mais detalhes →</span>
              </div>
            </div>
          </div>

          {/* SLIDE 2: Detalhes Completos e Ações */}
          <div className="w-full flex-shrink-0 snap-center p-5 flex flex-col space-y-4">
            <h2 className="text-sm font-bold text-white mb-1 border-b border-slate-800 pb-2">Detalhes do Evento</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {event.description}
            </p>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                <Users className="w-4 h-4" />
                <span>Público-Alvo Recomendado:</span>
              </div>
              <p className="text-slate-300">
                {(event as any).targetAudience || 'Estudantes dos cursos técnicos e superiores do IFAM, docentes, servidores e comunidade externa.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-800">
                <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{new Date(event.startDate).toLocaleDateString('pt-BR')} até {new Date(event.endDate).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-800">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-semibold text-white">{event.locationName || 'IFAM Campus Manaus Centro'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {registered && (
                <button
                  onClick={handleOpenPass}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 border border-emerald-400/40 active:scale-95"
                >
                  <Ticket className="w-4 h-4 text-emerald-200" />
                  <span>🎫 Acessar Meu Pass (QR Code)</span>
                </button>
              )}
              <a href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-xl bg-red-600/90 active:bg-red-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2">
                <Youtube className="w-4.5 h-4.5" /> Inscrever-se no Canal
              </a>
              <Link href="/networking" className="w-full py-3 rounded-xl bg-slate-800 active:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2 border border-slate-700">
                <MessageSquare className="w-4 h-4 text-emerald-400" /> Networking & Chat
              </Link>
            </div>
            
            <div className="flex justify-center items-center gap-2 mt-2 text-[10px] text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-700"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="ml-1">← Voltar para capa</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- VERSÃO DESKTOP: GRID CLÁSSICO --- */}
      <div className="hidden md:block relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-12 gap-8 items-center">
          {/* Lado Esquerdo (7 colunas): Título, Badges e Botões */}
          <div className="col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Evento Oficial IFAM</span>
              </span>

              {/* BADGE DE TRANSMISSÃO AO VIVO NO BANNER */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 text-red-300 text-xs font-bold border border-red-500/40 animate-pulse">
                <Radio className="w-3.5 h-3.5 text-red-400" />
                <span>Haverá Transmissão Ao Vivo On-line</span>
              </span>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isPublic
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}>
                {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isPublic ? 'Aberto ao Público Geral' : 'Restrito a Convidados (RSVP)'}</span>
              </span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-snug">
              {event.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              {event.description}
            </p>

            {/* Cartão do Público-Alvo */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Users className="w-4 h-4" />
                <span>Público-Alvo Recomendado:</span>
              </div>
              <p className="text-slate-300 pl-6">
                {(event as any).targetAudience || 'Estudantes dos cursos técnicos e superiores do IFAM, docentes, servidores e comunidade externa.'}
              </p>
            </div>

            {/* Metadados: Data e Local */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>
                  {new Date(event.startDate).toLocaleDateString('pt-BR')} até{' '}
                  {new Date(event.endDate).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white">{event.locationName || 'IFAM Campus Manaus Centro'}</span>
              </div>
            </div>

            {/* ALERTAS DE CAPACIDADE E VAGAS RESTANTES (30% OU ESGOTADAS) */}
            {event.capacity !== null && event.capacity !== undefined && (
              <div className="pt-1">
                {(event as any).remainingSeats <= 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 font-extrabold text-xs border border-red-500/30">
                    <X className="w-4 h-4 text-red-400" />
                    <span>Inscrições Encerradas: Vagas Esgotadas!</span>
                  </span>
                ) : (event as any).remainingSeats <= Math.ceil(event.capacity * 0.3) ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-extrabold text-xs border border-amber-500/40 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>⚠️ Restam apenas {(event as any).remainingSeats} vaga(s)! (30% restante)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{(event as any).remainingSeats} vagas disponíveis de {event.capacity}</span>
                  </span>
                )}
              </div>
            )}

            {/* BOTÕES DE AÇÃO COM HOVER / TOOLTIPS INFORMATIVOS */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {/* 1. Botão Verde de Inscrição ou Visualizar Pass */}
              <div className="relative group">
                {registered ? (
                  <button
                    onClick={handleOpenPass}
                    className="px-5 py-2.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/30 transition-all flex items-center gap-2 active:scale-95 border border-emerald-400/40 animate-pulse"
                  >
                    <Ticket className="w-4 h-4 text-emerald-200" />
                    <span>🎫 Acessar Meu Pass (QR Code)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={registering || ((event as any).remainingSeats !== null && (event as any).remainingSeats <= 0)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 ${
                      (event as any).remainingSeats !== null && (event as any).remainingSeats <= 0
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-unifik-primary hover:bg-unifik-violet-600 text-white active:scale-95'
                    }`}
                  >
                    {registering ? (
                      'Confirmando...'
                    ) : (event as any).remainingSeats !== null && (event as any).remainingSeats <= 0 ? (
                      'Vagas Esgotadas'
                    ) : (
                      'Garantir Minha Inscrição'
                    )}
                  </button>
                )}
                {/* Tooltip Hover */}
                <div className="absolute left-0 -top-10 hidden group-hover:flex items-center px-3 py-1.5 rounded-xl bg-slate-950 text-white text-[11px] font-medium border border-slate-800 shadow-xl whitespace-nowrap z-30 pointer-events-none animate-fade-in">
                  {registered ? 'Abra seu comprovante digital com QR Code para credenciamento' : 'Garanta sua vaga presencial e receba o certificado de extensão oficial do IFAM!'}
                </div>
              </div>

              {/* 2. Botão Vermelho para Inscrever-se no Canal do YouTube */}
              <div className="relative group">
                <a
                  href={youtubeChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs shadow-md transition flex items-center gap-2 active:scale-95"
                >
                  <Youtube className="w-4.5 h-4.5" />
                  <span>Inscrever-se no Canal (YouTube)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-red-200" />
                </a>
                {/* Tooltip Hover */}
                <div className="absolute left-0 -top-10 hidden group-hover:flex items-center px-3 py-1.5 rounded-xl bg-slate-950 text-white text-[11px] font-medium border border-slate-800 shadow-xl whitespace-nowrap z-30 pointer-events-none animate-fade-in">
                  Inscreva-se no canal oficial para ativar o sininho e receber lembretes!
                </div>
              </div>

              {/* 3. Botão de Networking */}
              <div className="relative group">
                <Link
                  href="/networking"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center gap-2 border border-slate-700"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Networking & Chat</span>
                </Link>
                {/* Tooltip Hover */}
                <div className="absolute left-0 -top-10 hidden group-hover:flex items-center px-3 py-1.5 rounded-xl bg-slate-950 text-white text-[11px] font-medium border border-slate-800 shadow-xl whitespace-nowrap z-30 pointer-events-none animate-fade-in">
                  Converse ao vivo com os demais alunos e participantes!
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito (5 colunas): Moldura da Imagem */}
          <div className="col-span-5 flex flex-col items-center space-y-3">
            <div className="relative group w-full max-w-md aspect-[16/10] rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl bg-slate-950">
              <img
                src={bannerImage}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3">
                <button
                  onClick={() => setShowImageZoom(true)}
                  className="p-2 rounded-xl bg-black/70 text-white hover:bg-black transition"
                  title="Expandir Imagem"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SELETOR DE ABAS PRINCIPAIS DO EVENTO */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveMainTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition ${
            activeMainTab === 'schedule'
              ? 'bg-unifik-primary text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Programação Oficial</span>
        </button>

        <button
          onClick={() => setActiveMainTab('feed')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition ${
            activeMainTab === 'feed'
              ? 'bg-unifik-primary text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Rede Social & Feed do Evento ({eventPosts.length})</span>
        </button>
      </div>

      {activeMainTab === 'feed' ? (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Formulário de Publicação no Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <span>Publicar Foto ou Comentário no Feed do Evento</span>
            </h3>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <textarea
                rows={3}
                placeholder={user ? "Compartilhe sua experiência no evento, foto ou aprendizado..." : "Faça login para publicar no feed deste evento!"}
                disabled={!user || posting}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold"
              />

              {/* Pré-visualização da Mídia Escolhida */}
              {newPostMediaUrl && (
                <div className="relative inline-block rounded-2xl overflow-hidden border border-slate-700 max-h-40 bg-black">
                  <img src={newPostMediaUrl} alt="Preview" className="max-h-40 object-contain" />
                  <button
                    type="button"
                    onClick={() => setNewPostMediaUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <input
                  ref={feedFileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setNewPostMediaUrl(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                />

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={!user || posting}
                    onClick={() => feedFileInputRef.current?.click()}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-emerald-500" />
                    <span>Tirar Foto / Anexar</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!user || posting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-extrabold text-xs shadow-md transition active:scale-95 disabled:opacity-50"
                >
                  {posting ? 'Publicando...' : 'Publicar no Feed'}
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Publicações do Evento */}
          <div className="space-y-4">
            {eventPosts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                Seja o primeiro a publicar no Feed deste evento!
              </div>
            ) : (
              eventPosts.map((post) => (
                <div key={post.id} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-unifik-primary text-white font-bold flex items-center justify-center text-xs overflow-hidden">
                        {post.user?.avatarUrl ? (
                          <img src={post.user.avatarUrl} alt={post.user.name} className="w-full h-full object-cover" />
                        ) : (
                          post.user?.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{post.user?.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {post.user?.category} • {post.user?.campus || 'IFAM'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(post.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {post.content && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{post.content}</p>
                  )}

                  {post.mediaUrl && (
                    <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[600px]">
                      <img src={post.mediaUrl} alt="Mídia do Post" className="w-full max-h-[600px] object-contain" />
                    </div>
                  )}

                  {/* Barra de Ações: Curtir e Comentar */}
                  <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        // Alterna estado de curtida local
                        post.liked = !post.liked;
                        post.likesCount = (post.likesCount || 0) + (post.liked ? 1 : -1);
                        setEventPosts([...eventPosts]);
                      }}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
                        post.liked
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : 'text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
                      <span>{post.likesCount || (post.liked ? 1 : 0)} {post.likesCount === 1 || (!post.likesCount && post.liked) ? 'Curtida' : 'Curtidas'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        post.showCommentInput = !post.showCommentInput;
                        setEventPosts([...eventPosts]);
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments?.length || 0} Comentários</span>
                    </button>
                  </div>

                  {/* Caixa de Comentário Expandível */}
                  {post.showCommentInput && (
                    <div className="pt-2 space-y-2 animate-fade-in">
                      {post.comments && post.comments.length > 0 && (
                        <div className="space-y-1.5 pl-2 border-l-2 border-slate-200 dark:border-slate-800 text-xs">
                          {post.comments.map((c: any, i: number) => (
                            <div key={i} className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl">
                              <span className="font-bold text-slate-900 dark:text-white mr-1.5">{c.author}:</span>
                              <span className="text-slate-600 dark:text-slate-300">{c.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={user ? "Escreva um comentário..." : "Faça login para comentar..."}
                          disabled={!user}
                          value={post.newCommentText || ''}
                          onChange={(e) => {
                            post.newCommentText = e.target.value;
                            setEventPosts([...eventPosts]);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && post.newCommentText?.trim()) {
                              if (!post.comments) post.comments = [];
                              post.comments.push({ author: user?.name || 'Eu', text: post.newCommentText.trim() });
                              post.newCommentText = '';
                              setEventPosts([...eventPosts]);
                            }
                          }}
                          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                        />
                        <button
                          type="button"
                          disabled={!user || !post.newCommentText?.trim()}
                          onClick={() => {
                            if (post.newCommentText?.trim()) {
                              if (!post.comments) post.comments = [];
                              post.comments.push({ author: user?.name || 'Eu', text: post.newCommentText.trim() });
                              post.newCommentText = '';
                              setEventPosts([...eventPosts]);
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-xs disabled:opacity-50"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 2. REORGANIZAÇÃO COMPLETA DA PROGRAMAÇÃO & DETALHES (Layout Proporcional 8/4) */}
        {/* COLUNA ESQUERDA PRINCIPAL (8 COLUNAS): LINHA DO TEMPO DA PROGRAMAÇÃO COMPLETA */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-unifik-primary dark:text-emerald-400" />
                {event?.attendanceTrackingMode === 'DAILY_ATTENDANCE'
                  ? 'Frequência Diária & Programação do Evento'
                  : 'Programação Oficial de Palestras & Worshops'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {event?.attendanceTrackingMode === 'DAILY_ATTENDANCE'
                  ? 'Aferição de presença realizada por dia. Confira seu progresso diário abaixo.'
                  : 'Selecione uma palestra para ver detalhes, palestrantes e opções de credenciamento.'}
              </p>
            </div>

            <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20">
              {sessions.length} {sessions.length === 1 ? 'atividade' : 'atividades'}
            </span>
          </div>

          {/* PAINEL DE AFERIÇÃO DIÁRIA (Quando o evento é configurado no modo DAILY_ATTENDANCE) */}
          {event?.attendanceTrackingMode === 'DAILY_ATTENDANCE' && dailyData && (
            <div className="glass-panel p-5 rounded-3xl border-2 border-emerald-500/30 bg-white/80 dark:bg-slate-900/80 shadow-md space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                    📅
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Aferição de Frequência Diária do Evento
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {dailyData.dailyWorkloadHours}h por dia • {dailyData.requireDailyCheckOut ? 'Exige Check-in de Entrada + Check-out de Saída' : 'Check-in único por dia'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDailyCheckIn}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Registrar Ponto / Check-in de Hoje</span>
                </button>
              </div>

              {/* Barra de Progresso de Frequência */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>Sua Frequência Acumulada:</span>
                  <span className="text-emerald-600 font-extrabold">
                    {dailyData.completedDays} de {dailyData.totalDays} dias ({(dailyData.attendanceRate * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, dailyData.attendanceRate * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Mínimo para certificado: {(dailyData.minAttendanceRate * 100).toFixed(0)}%</span>
                  <span className={dailyData.isEligibleForCertificate ? 'text-emerald-600 font-bold' : 'text-amber-500 font-semibold'}>
                    {dailyData.isEligibleForCertificate ? '✅ Meta de frequência atingida!' : '⏳ Frequência em andamento'}
                  </span>
                </p>
              </div>

              {/* Grid dos Dias do Evento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-1">
                {dailyData.eventDays?.map((dayStr: string, idx: number) => {
                  const att = dailyData.userAttendances?.find((a: any) => a.date === dayStr);
                  const isToday = dayStr === new Date().toISOString().split('T')[0];
                  const isCompleted = att && (att.status === 'COMPLETED' || att.checkOutAt || !dailyData.requireDailyCheckOut);
                  const isInProgress = att && att.status === 'IN_PROGRESS';

                  return (
                    <div
                      key={dayStr}
                      className={`p-3 rounded-2xl border text-center space-y-1 transition ${
                        isCompleted
                          ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : isInProgress
                          ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/30 animate-pulse'
                          : isToday
                          ? 'border-blue-500/50 bg-blue-50/30 dark:bg-blue-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 opacity-70'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">
                        Dia {idx + 1}
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        {new Date(dayStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full inline-block ${
                          isCompleted
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : isInProgress
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : isToday
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {isCompleted
                          ? 'Presente'
                          : isInProgress
                          ? 'Em Andamento'
                          : isToday
                          ? 'Hoje'
                          : 'Pendente'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABAS POR DIAS */}
          {sessions.length > 0 && (
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
              {Array.from(new Set(sessions.map((s) => s.startTime.split('T')[0]))).sort().map((dateStr) => {
                const dateObj = new Date(dateStr + 'T12:00:00');
                const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                const dayNum = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                
                // Set default tab on load if not set
                if (!activeDateTab) setActiveDateTab(Array.from(new Set(sessions.map((s) => s.startTime.split('T')[0]))).sort()[0]);
                
                const isActive = activeDateTab === dateStr;
                return (
                  <button
                    key={dateStr}
                    onClick={() => setActiveDateTab(dateStr)}
                    className={`flex flex-col items-center justify-center min-w-[100px] px-4 py-2.5 rounded-2xl border transition-all ${
                      isActive 
                        ? 'bg-unifik-primary text-white border-unifik-primary shadow-md' 
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold opacity-80">{dayName}</span>
                    <span className="text-sm font-extrabold">{dayNum}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* LISTA DE PALESTRAS EM FORMATO DE CARDS EXPANDIDOS (TIMELINE CARDS) */}
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="glass-panel text-center py-12 rounded-2xl text-slate-500">
                Nenhuma palestra cadastrada para este evento.
              </div>
            ) : (
              sessions.filter(s => activeDateTab ? s.startTime.startsWith(activeDateTab) : true).map((sess) => {
                const isSelected = activeSession?.id === sess.id;
                const startTime = new Date(sess.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const endTime = new Date(sess.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={sess.id}
                    onClick={() => setActiveSession(sess)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-4 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-lg ring-2 ring-emerald-500/50'
                        : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Cabeçalho da Palestra: Horário, Status, Local e Horas Certificadas */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          {startTime} às {endTime}
                        </span>

                        {(sess as any).room && (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {(sess as any).room}
                          </span>
                        )}

                        {(sess as any).targetAudience && (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs">
                            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {(sess as any).targetAudience}
                          </span>
                        )}

                        {sess.isLiveActive && (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 text-xs font-bold animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-600" />
                            TRANSMISSÃO AO VIVO
                          </span>
                        )}
                        {sess.requireDoubleCheckIn && (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-500/20">
                            ⏱️ Entrada + Saída
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-500/20">
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          {sess.workloadHours}h certificadas
                        </span>
                      </div>
                    </div>

                    {/* Título & Descrição da Palestra */}
                    <div className="space-y-1.5">
                      <h3 className="font-extrabold text-base md:text-lg text-slate-900 dark:text-slate-100">
                        {sess.title}
                      </h3>
                      <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {sess.description || 'Apresentação científica e debate acadêmico durante a programação do IFAM.'}
                      </p>
                    </div>

                    {/* Bloco do Palestrante Convidado */}
                    <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                      <div className="w-10 h-10 rounded-full bg-unifik-primary flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                          {sess.speakerName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {sess.speakerBio || 'Palestrante Convidado'}
                        </p>
                      </div>
                    </div>

                    {/* PLAYER DE TRANSMISSÃO AO VIVO OU ON-DEMAND */}
                    {(sess.youtubeLiveUrl || sess.recordingUrl) && (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-inner space-y-2 p-3">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            {sess.isLiveActive ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase animate-pulse">
                                <Radio className="w-3 h-3" /> Ao Vivo Agora
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 text-[10px] font-black uppercase">
                                <PlayCircle className="w-3 h-3" /> Gravação On-Demand
                              </span>
                            )}
                            <span className="text-xs font-bold text-slate-300 truncate">
                              Transmissão Oficial do IFAM
                            </span>
                          </div>

                          <a
                            href={(sess.youtubeLiveUrl || sess.recordingUrl) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 transition"
                          >
                            <span>Abrir no YouTube</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                          <iframe
                            src={getYouTubeEmbedUrl(sess.youtubeLiveUrl || sess.recordingUrl)}
                            title={sess.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="absolute top-0 left-0 w-full h-full border-0"
                          />
                        </div>
                      </div>
                    )}

                    {/* Bloco Administrativo Exclusivo para Organizadores (Totem de Entrada) */}
                    {isOrganizerOrAdmin && isSelected && (
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/imprimir-totem/${sess.id}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-xs shadow-sm transition active:scale-95"
                        >
                          <Printer className="w-4 h-4" />
                          [Organizador] Imprimir Placa / Totem de Entrada (PDF / A4)
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUNA LATERAL DIREITA (4 COLUNAS): ORGANIZADOR RESPONSÁVEL & DETALHES DO CAMPUS */}
        <div className="lg:col-span-4 space-y-6">
          {/* CARTÃO DO ORGANIZADOR RESPONSÁVEL */}
          <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-unifik-primary dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building2 className="w-4 h-4" />
              <span>Organizador Responsável</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Nome do Organizador:</p>
                <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mt-0.5">{organizerName}</p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Setor / Departamento:</p>
                <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{organizerDepartment}</p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold text-[10px] uppercase mb-1">E-mail para Contato:</p>
                <a
                  href={`mailto:${organizerEmail}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-unifik-primary dark:text-emerald-300 font-bold transition border border-slate-200 dark:border-slate-700"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{organizerEmail}</span>
                </a>
              </div>

              {isOrganizerOrAdmin && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleExportAttendanceCsv}
                    className="w-full px-3.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Relatório de Presenças (CSV)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CARTÃO DE REGRAS E CREDENCIAMENTO DINÂMICO */}
          <div className="glass-panel p-6 rounded-3xl space-y-3.5 border border-slate-200 dark:border-slate-800 text-xs shadow-sm bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/10">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Como Funciona a Certificação</span>
            </div>

            {event.certificateType === 'PER_SESSION' ? (
              <div className="space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                  📜 Certificação Modular por Atividade
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Neste evento, a certificação é emitida <strong>individualmente por atividade</strong>. Você receberá um certificado digital exclusivo com a carga horária de cada palestra, minicurso ou oficina em que realizar o check-in no telão.
                </p>
              </div>
            ) : event.certificateType === 'BOTH' ? (
              <div className="space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-500/20">
                  📜 Certificação Híbrida (Modular + Geral)
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Você receberá certificados individuais para cada oficina realizada e também o <strong>Certificado Geral do Evento</strong> caso atinja a frequência mínima de <strong>{Math.round((event.minAttendanceRate || 0.75) * 100)}%</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-500/20">
                  📜 Certificado Geral Unificado
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Para ter direito ao certificado deste evento, é necessário atingir no mínimo <strong>{Math.round((event.minAttendanceRate || 0.75) * 100)}% de presença</strong> nas atividades programadas. A carga horária total refletirá a soma das palestras em que você realizou o check-in.
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Validação com código hash SHA-256 e QR Code público.</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* MODAL DE DICAS DE UPLOAD DE BANNER PARA O ORGANIZADOR */}
      {showBannerTips && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 text-white space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <Upload className="w-4 h-4" />
                <span>[Área do Organizador] Dicas para Upload de Banner</span>
              </div>
              <button
                onClick={() => setShowBannerTips(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Proporção Recomendada:</strong> Use a proporção <strong>16:9</strong> ou <strong>16:10</strong> (ex: 1920x1080px ou 1280x800px).
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Qualidade do Arquivo:</strong> Resolução mínima recomendada de <strong>1200x675 pixels</strong> nos formatos JPG, WebP ou PNG.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Evite Textos Sobrepostos no Banner:</strong> Como o portal exibe o título do evento em tipografia própria na lateral, prefira imagens conceituais, fotografias do campus ou artes gráficas sem blocos pesados de texto.
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowBannerTips(false)}
                className="w-full py-2.5 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-xs transition"
              >
                Entendi! Fechar Dicas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ZOOM DA IMAGEM DE CAPA */}
      {showImageZoom && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-800">
            <button
              onClick={() => setShowImageZoom(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-black transition"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={bannerImage} alt={event.title} className="w-full h-full object-contain" />
          </div>
        </div>
      )}

      {/* MODAL DE LOGIN / CADASTRO SE O USUÁRIO CLICAR EM INSCREVER-SE SEM ESTAR LOGADO */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* MODAL DE BILHETE DE ENTRADA / PASS COM QR CODE */}
      <TicketPassModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        registration={registration}
      />
    </div>
  );
}
