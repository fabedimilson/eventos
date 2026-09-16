'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  Award,
  Calendar,
  Download,
  ShieldCheck,
  Mic,
  GraduationCap,
  FileCheck,
  Scale,
  Building2,
  Briefcase,
  CheckCircle,
  ExternalLink,
  QrCode,
  Ticket,
  Send,
  ArrowLeft,
  Copy,
  Check,
  MapPin,
  Sparkles,
  Search,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { fetchApi } from '../../../lib/api';
import { ProtectedStateCard } from '../../../components/ProtectedStateCard';

export default function OtherUserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;
  const { user: currentUser, loading: authLoading } = useAuth();

  const [targetUser, setTargetUser] = useState<any>(null);
  const [speakingSessions, setSpeakingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ouvinte' | 'palestrante' | 'organizador'>('ouvinte');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'COMPLETED'>('ALL');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [eventSearch, setEventSearch] = useState('');

  // Rastreia status online em tempo real
  useEffect(() => {
    if (!userId) return;
    fetchApi<{ onlineUserIds: string[] }>('/networking/online-users')
      .then((res) => {
        if (res && Array.isArray(res.onlineUserIds)) {
          setIsOnline(res.onlineUserIds.includes(userId));
        }
      })
      .catch(() => null);

    const handlePresence = (e: any) => {
      const userIds = e.detail;
      if (Array.isArray(userIds)) {
        setIsOnline(userIds.includes(userId));
      }
    };
    window.addEventListener('ifam_presence_update', handlePresence);
    return () => window.removeEventListener('ifam_presence_update', handlePresence);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Se o usuário estiver acessando o próprio ID, redireciona para a página de perfil próprio
    if (currentUser && currentUser.id === userId) {
      router.replace('/perfil');
      return;
    }

    setLoading(true);
    fetchApi<{ user: any; speakingSessions: any[] }>(`/users/${userId}/public-profile`)
      .then((res) => {
        if (res && res.user) {
          setTargetUser(res.user);
          setSpeakingSessions(res.speakingSessions || []);
        } else {
          setError('Perfil não encontrado.');
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar perfil:', err);
        setError('Não foi possível carregar o perfil deste usuário.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId, currentUser]);

  const handleCopyProfileLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (!authLoading && !currentUser) {
    return (
      <ProtectedStateCard
        title="Perfil de Participante"
        description="Faça login com sua conta do IFAM para visualizar o perfil acadêmico completo, histórico de eventos e conectar-se com outros participantes."
      />
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-unifik-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Carregando perfil acadêmico...</p>
      </div>
    );
  }

  if (error || !targetUser) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-2xl font-black">
          👤
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {error || 'Participante não encontrado'}
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          O perfil solicitado não está disponível ou foi desativado no diretório acadêmico.
        </p>
        <Link
          href="/networking"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-unifik-primary text-white text-xs font-bold hover:bg-unifik-violet-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Chat e Diretório</span>
        </Link>
      </div>
    );
  }

  const registrations = targetUser.registrations || [];
  const organizedEvents = targetUser.organizedEvents || [];
  const certificates = targetUser.certificates || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Botão de Voltar */}
      <div className="flex items-center justify-between">
        <Link
          href="/networking"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Chat & Networking</span>
        </Link>
      </div>

      {/* 1. CARD PRINCIPAL DE PERFIL (IDÊNTICO À TELA /perfil) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Foto Avatar com Indicador de Presença Online */}
          <div className="relative w-28 h-28 shrink-0">
            <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-unifik-primary shadow-xl bg-slate-100 dark:bg-slate-800">
              {targetUser.avatarUrl ? (
                <img
                  src={targetUser.avatarUrl}
                  alt={targetUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-unifik-primary/10 text-unifik-primary text-4xl font-black">
                  {targetUser.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Badge de Status Online / Offline */}
            <div
              className={`absolute bottom-0.5 right-0.5 px-2 py-0.5 rounded-full text-[10px] font-black border-2 border-white dark:border-slate-900 shadow-md flex items-center gap-1.5 transition ${
                isOnline
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-400 text-white dark:bg-slate-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-white ${isOnline ? 'animate-pulse' : ''}`} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          {/* Dados Pessoais & Institucionais */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {targetUser.category === 'PROFESSOR'
                  ? '👨‍🏫 DOCENTE / PROFESSOR'
                  : targetUser.category === 'TECNICO'
                  ? '💼 TÉCNICO ADMINISTRATIVO'
                  : targetUser.category === 'PESQUISADOR'
                  ? '🔬 PESQUISADOR'
                  : targetUser.category === 'BOLSISTA'
                  ? '💡 BOLSISTA'
                  : targetUser.category === 'TERCEIRIZADO'
                  ? '🛠️ TERCEIRIZADO'
                  : targetUser.category === 'EGRESSO' || targetUser.isEgresso
                  ? '🎓 ALUNO EGRESSO'
                  : targetUser.category === 'ALUNO'
                  ? '🎓 DISCENTE / ALUNO'
                  : targetUser.category || 'EXTERNO'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                📍 {targetUser.campus || 'Campus Manaus Centro'}
              </span>
              {(targetUser.isEgresso || targetUser.category === 'EGRESSO') && (
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-500/30 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>EGRESSO IFAM</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              {targetUser.name}
            </h1>
            <p className="text-xs text-slate-500 font-semibold">{targetUser.email}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed pt-1">
              {targetUser.bio || 'Nenhuma biografia informada por este participante.'}
            </p>

            {/* Micro-Estatísticas Acadêmicas Competitivas */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{organizedEvents.length} {organizedEvents.length === 1 ? 'Evento Organizado' : 'Eventos Organizados'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                <Award className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span>{certificates.length || 1} Certificados Conferidos</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>4.0h Participações</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                <span>Guardião</span>
              </div>
            </div>

            {/* Redes Sociais e Perfil Acadêmico */}
            {(targetUser.linkedinUrl || targetUser.instagramUrl || targetUser.lattesUrl) && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                {targetUser.linkedinUrl && (
                  <a
                    href={targetUser.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-bold hover:underline"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {targetUser.instagramUrl && (
                  <a
                    href={targetUser.instagramUrl.startsWith('http') ? targetUser.instagramUrl : `https://instagram.com/${targetUser.instagramUrl.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 text-xs font-bold hover:underline"
                  >
                    <span>Instagram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {targetUser.lattesUrl && (
                  <a
                    href={targetUser.lattesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold hover:underline"
                  >
                    <span>Currículo Lattes</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Linhas de Pesquisa / Áreas de Interesse */}
            {targetUser.interests && (
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                {targetUser.interests.split(',').map((tag: string) => (
                  <span
                    key={tag.trim()}
                    className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* BOTÕES DE AÇÃO: CONVERSAR NO CHAT & COMPARTILHAR PERFIL */}
            <div className="pt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Link
                href={`/networking?openChatWith=${targetUser.id}`}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition flex items-center gap-2 hover:scale-[1.02] active:scale-95"
              >
                <Send className="w-4 h-4 -rotate-12" />
                <span>Enviar Mensagem no Chat</span>
              </Link>

              <button
                onClick={handleCopyProfileLink}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-2"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copiado!' : 'Compartilhar Perfil'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CARD DE TRAJETÓRIA DO EGRESSO (SE APLICÁVEL) */}
      {(targetUser.isEgresso || targetUser.category === 'EGRESSO') && (
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-emerald-500/30 space-y-4">
          <div className="flex items-center gap-3 border-b border-emerald-700/50 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 shadow-inner">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>Trajetória & Status do Egresso IFAM</span>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 uppercase">
                  Verificado
                </span>
              </h3>
              <p className="text-xs text-emerald-200/80">
                Dados da trajetória profissional, acadêmica e disponibilidades de colaboração com o IFAM.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-emerald-300 tracking-wider">Formação no IFAM</span>
              <p className="text-sm font-bold text-white">{targetUser.courseName || 'Não informado'}</p>
              <p className="text-xs text-emerald-200">Ano: {targetUser.graduationYear || 'Não informado'}</p>
            </div>

            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-emerald-300 tracking-wider">Atuação Profissional / Acadêmica</span>
              <p className="text-sm font-bold text-white">{targetUser.currentRoleOrCourse || 'Não informado'}</p>
              <p className="text-xs text-emerald-200">{targetUser.currentCompanyOrInst || 'Não informado'}</p>
            </div>

            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-emerald-300 tracking-wider">Status & Escolaridade</span>
              <p className="text-sm font-bold text-white">{targetUser.employmentStatus || 'Não informado'}</p>
              <p className="text-xs text-emerald-200">{targetUser.educationLevel || 'Não informado'}</p>
            </div>
          </div>

          {targetUser.alumniInterests && (
            <div className="pt-3 border-t border-emerald-700/50 space-y-2">
              <span className="text-xs font-black uppercase text-emerald-300">
                Disponibilidade para Colaborar com o IFAM:
              </span>
              <div className="flex flex-wrap gap-2">
                {targetUser.alumniInterests.split(',').map((interest: string) => {
                  const trimmed = interest.trim();
                  const labels: Record<string, string> = {
                    PESQUISA: '🔬 Projetos de Pesquisa & Inovação',
                    GRUPOS_PESQUISA: '🧪 Grupos de Pesquisa',
                    EVENTOS: '🎤 Palestras, Workshops & Eventos',
                    MENTORIA: '🤝 Mentoria de Alunos / Networking',
                  };
                  return (
                    <span
                      key={trimmed}
                      className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 text-xs font-extrabold border border-emerald-500/40"
                    >
                      {labels[trimmed] || trimmed}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. HISTÓRICO ACADÊMICO DE ATUAÇÕES EM EVENTOS (IDÊNTICO À TELA /perfil) */}
      <div id="eventos" className="scroll-mt-24 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* CABEÇALHO DA SEÇÃO COM BUSCA INTEGRADA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-unifik-primary" />
              <span>Certificados e Atuações</span>
            </h2>
            <p className="text-xs text-slate-500">
              Registros oficiais de participação deste usuário como ouvinte, palestrante ou organizador de eventos.
            </p>
          </div>

          {/* Campo de Busca Rápida de Eventos no Cabeçalho Superior */}
          <div className="relative w-full sm:w-72 lg:w-80 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              placeholder="Buscar evento por título..."
              className="w-full pl-9 pr-7 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-unifik-primary transition shadow-xs"
            />
            {eventSearch && (
              <button
                onClick={() => setEventSearch('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS (Espaço total de 100% da largura, sem compressão das abas) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-slate-100 dark:border-slate-800 scrollbar-none">
          <button
            onClick={() => setActiveTab('ouvinte')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'ouvinte'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Como Ouvinte / Participante ({registrations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('palestrante')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'palestrante'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Como Palestrante / Ministrante ({speakingSessions.length})</span>
          </button>

          {organizedEvents.length > 0 && (
            <button
              onClick={() => setActiveTab('organizador')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'organizador'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Como Organizador ({organizedEvents.length})</span>
            </button>
          )}
        </div>

        {/* ABA: OUVINTE / PARTICIPANTE */}
        {activeTab === 'ouvinte' && (
          <div className="space-y-4">
            {registrations.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <GraduationCap className="w-10 h-10 mx-auto opacity-40" />
                <p className="text-xs font-semibold">Nenhum evento registrado como participante.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registrations
                  .filter((reg: any) => {
                    if (!eventSearch.trim()) return true;
                    const ev = reg.event;
                    return (
                      ev?.title?.toLowerCase().includes(eventSearch.toLowerCase()) ||
                      ev?.locationName?.toLowerCase().includes(eventSearch.toLowerCase())
                    );
                  })
                  .map((reg: any) => {
                    const ev = reg.event;
                    if (!ev) return null;

                  return (
                    <Link
                      key={reg.id}
                      href={`/eventos/${ev.slug}`}
                      className="group block p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-emerald-500/50 hover:shadow-md transition cursor-pointer hover:scale-[1.01]"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {ev.category || 'EVENTO IFAM'}
                        </span>
                        <span>{new Date(ev.startDate).toLocaleDateString('pt-BR')}</span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition line-clamp-1">
                        {ev.title}
                      </h4>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {ev.description || 'Sem descrição cadastrada.'}
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{ev.locationName || 'Campus IFAM'}</span>
                        </span>

                        <span className="text-emerald-600 dark:text-emerald-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Ver Evento &rarr;
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA: PALESTRANTE / MINISTRANTE */}
        {activeTab === 'palestrante' && (
          <div className="space-y-4">
            {speakingSessions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Mic className="w-10 h-10 mx-auto opacity-40" />
                <p className="text-xs font-semibold">Nenhuma atividade registrada como palestrante no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {speakingSessions.map((session: any) => (
                  <Link
                    key={session.id}
                    href={session.event?.slug ? `/eventos/${session.event.slug}` : '#'}
                    className="group block p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2 hover:border-amber-500/50 hover:shadow-md transition cursor-pointer hover:scale-[1.01]"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-700 dark:text-amber-400">
                      <span className="px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 uppercase">
                        🎤 Palestrante Oficial
                      </span>
                      <span>{session.workloadHours || 1.0}h de Carga Horária</span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                      {session.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {session.description || 'Palestra / Atividade Técnica no IFAM.'}
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-amber-200/60 dark:border-amber-900/40 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Evento: {session.event?.title || 'IFAM'}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Acessar &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: ORGANIZADOR */}
        {activeTab === 'organizador' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizedEvents.map((ev: any) => (
                <Link
                  key={ev.id}
                  href={`/eventos/${ev.slug}`}
                  className="group block p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-emerald-500/50 hover:shadow-md transition cursor-pointer hover:scale-[1.01]"
                >
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    {ev.category || 'EVENTO'}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">{ev.title}</h4>
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{new Date(ev.startDate).toLocaleDateString('pt-BR')}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Página do Evento &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
