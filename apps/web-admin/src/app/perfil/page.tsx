'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Award,
  Calendar,
  Download,
  ShieldCheck,
  Edit3,
  Mic,
  GraduationCap,
  FileCheck,
  Scale,
  PlusCircle,
  Building2,
  Briefcase,
  CheckCircle,
  ExternalLink,
  QrCode,
  Ticket,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserProfileModal } from '../../components/auth/UserProfileModal';
import { TicketPassModal } from '../../components/TicketPassModal';
import { fetchApi } from '../../lib/api';

import { ProtectedStateCard } from '../../components/ProtectedStateCard';

const demoRegistrations = [
  {
    id: 'reg-1',
    code: 'IFAM-2026-X9K2L1',
    status: 'CONFIRMED',
    statusLabel: 'Inscrição Confirmada',
    statusColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
    title: 'I Simpósio de Tecnologia e Inovação da Amazônia - IFAM 2026',
    description: 'Grandioso simpósio sobre inteligência artificial, robótica e desenvolvimento sustentável no ecossistema amazônico.',
    locationName: 'Campus Manaus Centro - Auditório Central',
    startDate: '2026-09-15T09:00:00Z',
    hasCertificate: false,
    hasPass: true,
  },
  {
    id: 'reg-2',
    code: 'IFAM-2026-EE75GC',
    status: 'COMPLETED',
    statusLabel: 'Concluído • Certificado Liberado',
    statusColor: 'bg-emerald-500 text-white font-black border-emerald-600',
    title: 'Semana Nacional de Ciência e Tecnologia 2026 - SNCT IFAM',
    description: 'Oficina prática de IoT e prototipagem de sensores para monitoramento ambiental na Amazônia.',
    locationName: 'Campus Manaus Centro - Laboratório 04',
    startDate: '2026-08-20T14:00:00Z',
    hasCertificate: true,
    certificateCode: 'IFAM-2026-EE75GC',
    hasPass: true,
  },
  {
    id: 'reg-3',
    code: 'IFAM-2026-ABS992',
    status: 'ABSENT',
    statusLabel: 'Não Compareceu',
    statusColor: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-500/30',
    title: 'Workshop de Metodologias Ativas na Educação Profissional',
    description: 'Treinamento sobre aplicação de projetos integradores na rede federal de ensino.',
    locationName: 'Campus Zona Leste - Mini Auditório',
    startDate: '2026-07-10T10:00:00Z',
    hasCertificate: false,
    hasPass: false,
  },
  {
    id: 'reg-4',
    code: 'IFAM-2026-CNC881',
    status: 'CANCELLED',
    statusLabel: 'Inscrição Cancelada',
    statusColor: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300',
    title: 'Mostra Científica e Tecnológica de Robótica Móvel 2026',
    description: 'Exposição de protótipos de robótica desenvolvidos por estudantes do IFAM.',
    locationName: 'Campus Distrito Industrial',
    startDate: '2026-06-05T08:30:00Z',
    hasCertificate: false,
    hasPass: false,
  },
];

export default function UserProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'ouvinte' | 'palestrante' | 'expositor' | 'avaliador'>('ouvinte');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'COMPLETED' | 'ABSENT' | 'CANCELLED'>('ALL');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const isServidor = user?.category === 'PROFESSOR' || user?.category === 'TECNICO' || user?.category === 'SERVIDOR' || user?.role === 'ORGANIZADOR' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_MASTER' || user?.role === 'ADMIN_UNIDADE';

  const loadUserEvents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetchApi<{ events: any[] }>('/events');
      setRegistrations(res.events || []);

      const invRes = await fetchApi<{ invitations: any[] }>('/invitations/my-invitations');
      setInvitations(invRes.invitations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserEvents();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!authLoading && !user) {
    return (
      <ProtectedStateCard
        title="Seu Perfil e Inscrições"
        description="Faça login com sua conta do IFAM para consultar suas inscrições em eventos, passaporte acadêmico e baixar seus certificados."
      />
    );
  }

  const handleRespondRSVP = async (invitationId: string, status: 'CONFIRMED' | 'DECLINED') => {
    setRespondingId(invitationId);
    try {
      const res = await fetchApi<{ message: string }>(`/invitations/${invitationId}/rsvp`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      alert(res.message || 'Resposta de RSVP salva com sucesso!');
      await loadUserEvents();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar resposta de RSVP.');
    } finally {
      setRespondingId(null);
    }
  };

  const handleDownloadPdf = (validationCode: string) => {
    window.open(`http://localhost:4000/api/v1/certificates/${validationCode}/pdf`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* 1. CARD PRINCIPAL DE PERFIL */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Foto Avatar */}
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-ifam-green-600 shadow-xl bg-slate-100 dark:bg-slate-800 shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-3xl">
                {user ? user.name.charAt(0) : 'U'}
              </div>
            )}
          </div>

          {/* Dados do Usuário */}
          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {user?.category === 'PROFESSOR'
                  ? '👨‍🏫 DOCENTE / PROFESSOR'
                  : user?.category === 'TECNICO'
                  ? '💼 TÉCNICO ADMINISTRATIVO'
                  : user?.category === 'SERVIDOR'
                  ? '🏢 SERVIDOR'
                  : user?.category === 'PESQUISADOR'
                  ? '🔬 PESQUISADOR'
                  : user?.category === 'EGRESSO' || (user as any)?.isEgresso
                  ? '🎓 ALUNO EGRESSO'
                  : user?.category === 'ALUNO'
                  ? '🎓 DISCENTE / ALUNO'
                  : user?.category || 'EXTERNO'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                📍 {user?.campus || 'Campus Manaus Centro'}
              </span>
              {((user as any)?.isEgresso || user?.category === 'EGRESSO') && (
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-500/30 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>EGRESSO IFAM</span>
                </span>
              )}
              {isServidor && (
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  ✨ Permissão de Criar Eventos
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              {user ? user.name : 'Visitante'}
            </h1>
            <p className="text-xs text-slate-500 font-semibold">{user?.email}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed pt-1">
              {user?.bio || 'Nenhuma biografia adicionada. Clique em "Editar Minha Foto e Bio" para personalizar seu perfil.'}
            </p>

            {/* Redes Sociais e Perfil Acadêmico */}
            {((user as any)?.linkedinUrl || (user as any)?.instagramUrl || (user as any)?.lattesUrl) && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                {(user as any)?.linkedinUrl && (
                  <a
                    href={(user as any).linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-bold hover:underline"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {(user as any)?.instagramUrl && (
                  <a
                    href={(user as any).instagramUrl.startsWith('http') ? (user as any).instagramUrl : `https://instagram.com/${(user as any).instagramUrl.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 text-xs font-bold hover:underline"
                  >
                    <span>Instagram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {(user as any)?.lattesUrl && (
                  <a
                    href={(user as any).lattesUrl}
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

            {/* Áreas de Interesse */}
            {(user as any)?.interests && (
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                {(user as any).interests.split(',').map((tag: string) => (
                  <span
                    key={tag.trim()}
                    className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={() => setProfileModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-ifam-green-600" />
                <span>Editar Perfil & Prontidão IFAM Guard</span>
              </button>

              {isServidor && (
                <Link
                  href="/admin/eventos/novo"
                  className="px-4 py-2 rounded-xl bg-ifam-green-700 hover:bg-ifam-green-800 text-white text-xs font-extrabold shadow-md transition flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Criar Novo Evento</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 1.2. CARD DE TRAJETÓRIA DO EGRESSO */}
      {((user as any)?.isEgresso || user?.category === 'EGRESSO') && (
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
            {/* Formação IFAM */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-emerald-300 tracking-wider">Formação no IFAM</span>
              <p className="text-sm font-bold text-white">{(user as any)?.courseName || 'Não informado'}</p>
              <p className="text-xs text-emerald-200">Ano: {(user as any)?.graduationYear || 'Não informado'}</p>
            </div>

            {/* Atuação Atual */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-emerald-300 tracking-wider">Atuação Profissional / Acadêmica</span>
              <p className="text-sm font-bold text-white">{(user as any)?.currentRoleOrCourse || 'Não informado'}</p>
              <p className="text-xs text-emerald-200">{(user as any)?.currentCompanyOrInst || 'Não informado'}</p>
            </div>

            {/* Escolaridade & Situação */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-emerald-300 tracking-wider">Status & Escolaridade</span>
              <p className="text-sm font-bold text-white">{(user as any)?.employmentStatus || 'Não informado'}</p>
              <p className="text-xs text-emerald-200">{(user as any)?.educationLevel || 'Não informado'}</p>
            </div>
          </div>

          {/* Preferências de Colaboração com o IFAM */}
          {(user as any)?.alumniInterests && (
            <div className="pt-3 border-t border-emerald-700/50 space-y-2">
              <span className="text-xs font-black uppercase text-emerald-300">
                Disponibilidade para Colaborar com o IFAM:
              </span>
              <div className="flex flex-wrap gap-2">
                {(user as any).alumniInterests.split(',').map((interest: string) => {
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

      {/* 1.5. CONVITES DE EVENTOS RESTRITOS & RSVP */}
      {invitations.length > 0 && (
        <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-3xl p-6 border border-amber-200 dark:border-amber-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white">
                RSVP PENDENTE
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Convites Especiais para Eventos Restritos
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {invitations.length} convite(s) recebido(s)
            </span>
          </div>

          <div className="space-y-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{inv.event?.title}</h4>
                  <p className="text-xs text-slate-500">
                    📍 {inv.event?.locationName || 'IFAM'} • Data: {new Date(inv.event?.startDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {inv.status === 'CONFIRMED' ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Presença Confirmada!
                    </span>
                  ) : inv.status === 'DECLINED' ? (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-extrabold text-xs">
                      Convite Recusado
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRespondRSVP(inv.id, 'CONFIRMED')}
                        disabled={respondingId === inv.id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-sm"
                      >
                        Vou Comparecer
                      </button>
                      <button
                        onClick={() => handleRespondRSVP(inv.id, 'DECLINED')}
                        disabled={respondingId === inv.id}
                        className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
                      >
                        Não Poderei Ir
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. HISTÓRICO ACADÊMICO DE ATUAÇÕES EM EVENTOS */}
      <div id="eventos" className="scroll-mt-24 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-ifam-green-600" />
            <span>Meus Certificados e Atuações</span>
          </h2>
          <p className="text-xs text-slate-500">
            Consulte seus registros oficiais de participação como ouvinte, palestrante, expositor de artigos ou avaliador.
          </p>
        </div>

        {/* NAVEGAÇÃO DE ABAS (Papeis do Usuário) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('ouvinte')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'ouvinte'
                ? 'bg-ifam-green-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Como Ouvinte / Participante</span>
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
            <span>Como Palestrante / Ministrante</span>
          </button>

          <button
            onClick={() => setActiveTab('expositor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'expositor'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Como Expositor / Autor</span>
          </button>

          <button
            onClick={() => setActiveTab('avaliador')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'avaliador'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Como Avaliador de Bancas</span>
          </button>
        </div>

        {/* CONTEÚDO DA ABA OUVINTE */}
        {activeTab === 'ouvinte' && (
          <div className="space-y-5">
            {/* Sub-Filtros de Status de Inscrição */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Todos ({demoRegistrations.length})
              </button>
              <button
                onClick={() => setStatusFilter('CONFIRMED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  statusFilter === 'CONFIRMED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                }`}
              >
                🟢 Confirmados (1)
              </button>
              <button
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                📜 Com Certificado (1)
              </button>
              <button
                onClick={() => setStatusFilter('ABSENT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  statusFilter === 'ABSENT'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                }`}
              >
                ⚠️ Não Compareceu (1)
              </button>
              <button
                onClick={() => setStatusFilter('CANCELLED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  statusFilter === 'CANCELLED'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                }`}
              >
                ❌ Cancelados (1)
              </button>
            </div>

            {/* Lista de Cartões de Inscrição */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoRegistrations
                .filter((reg) => statusFilter === 'ALL' || reg.status === statusFilter)
                .map((ev) => (
                  <div
                    key={ev.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${ev.statusColor}`}>
                          {ev.statusLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{ev.code}</span>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{ev.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{ev.description}</p>
                      <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                        📍 {ev.locationName}
                      </p>
                    </div>

                    {/* Ações do Cartão */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-end gap-2">
                      {ev.hasPass && (
                        <button
                          onClick={() => {
                            setSelectedReg({
                              id: ev.id,
                              code: ev.code,
                              eventId: ev.id,
                              userId: user?.id || 'user-1',
                              attendanceConfirmed: ev.status === 'COMPLETED',
                              event: {
                                title: ev.title,
                                startDate: ev.startDate,
                                locationName: ev.locationName,
                                primaryColor: '#10B981',
                              },
                              user: {
                                name: user?.name || 'Participante',
                                category: user?.category || 'ALUNO',
                                campus: user?.campus || 'Campus Manaus Centro',
                                avatarUrl: user?.avatarUrl,
                              },
                            });
                            setPassModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                          <span>🎫 Passe QR Code</span>
                        </button>
                      )}

                      {ev.hasCertificate && (
                        <button
                          onClick={() => handleDownloadPdf(ev.certificateCode || ev.code)}
                          className="px-3.5 py-1.5 rounded-xl bg-ifam-green-700 hover:bg-ifam-green-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>📄 Baixar Certificado PDF</span>
                        </button>
                      )}

                      {!ev.hasPass && !ev.hasCertificate && (
                        <span className="text-[11px] text-slate-400 italic">
                          Sem ações disponíveis
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'palestrante' && (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <Mic className="w-12 h-12 text-amber-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Palestras e Ministrações Registradas
            </p>
            <p className="text-xs max-w-md mx-auto">
              Quando você for cadastrado como palestrante convidado em alguma mesa-redonda ou minicurso, os certificados de ministrante aparecerão aqui.
            </p>
          </div>
        )}

        {activeTab === 'expositor' && (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <FileCheck className="w-12 h-12 text-blue-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Trabalhos e Artigos Expostos
            </p>
            <p className="text-xs max-w-md mx-auto">
              Artigos científicos, maquetes, banners e protótipos apresentados em simpósios e na SNCT estarão listados aqui com seus respectivos comprovantes de apresentação.
            </p>
          </div>
        )}

        {activeTab === 'avaliador' && (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <Scale className="w-12 h-12 text-purple-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Bancas Examinadoras e Trabalhos Avaliados
            </p>
            <p className="text-xs max-w-md mx-auto">
              Participações como comissão avaliadora de defesas públicas, feiras de ciências e mostras de tecnologia serão certificadas nesta aba.
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO DE PERFIL */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* MODAL DE PASSE DE ENTRADA QR CODE */}
      <TicketPassModal
        isOpen={passModalOpen}
        onClose={() => setPassModalOpen(false)}
        registration={selectedReg}
      />
    </div>
  );
}
