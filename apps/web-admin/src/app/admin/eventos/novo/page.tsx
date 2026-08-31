'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Tv,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Video,
  CheckSquare,
  Square,
  Sparkles,
  Building2,
  Zap,
  Upload,
  Image as ImageIcon,
  FileText,
  File,
  X,
  Check,
  Download,
  Paperclip,
} from 'lucide-react';
import { fetchApi } from '../../../../lib/api';

interface SessionForm {
  title: string;
  description: string;
  speakerName: string;
  speakerBio: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  roomLocation: string;
  targetAudience: string;
  workloadHours: number;
  requireDoubleCheckIn: boolean;
  hasLiveStream: boolean;
  youtubeUrl: string;
  forceLiveActive: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [activeSpeakerSuggestions, setActiveSpeakerSuggestions] = useState<number | null>(null);

  // Form Evento
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [startDate, setStartDate] = useState('2026-10-26');
  const [endDate, setEndDate] = useState('2026-10-29');
  const [locationName, setLocationName] = useState('IFAM Campus Manaus Centro');
  const [categories, setCategories] = useState<string[]>(['Educação']);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'RESTRICTED'>('PUBLIC');
  const [targetAudience, setTargetAudience] = useState<string>('Livre (Comunidade Aberta)');
  const [capacity, setCapacity] = useState<string>('');
  const [certificateType, setCertificateType] = useState<'EVENT_GLOBAL' | 'PER_SESSION' | 'BOTH'>('EVENT_GLOBAL');
  const [attendanceTrackingMode, setAttendanceTrackingMode] = useState<'PER_SESSION' | 'DAILY_ATTENDANCE' | 'GLOBAL_SINGLE_CHECKIN'>('DAILY_ATTENDANCE');
  const [dailyWorkloadHours, setDailyWorkloadHours] = useState<number>(4);
  const [requireDailyCheckOut, setRequireDailyCheckOut] = useState<boolean>(true);
  const [minAttendanceRate, setMinAttendanceRate] = useState<number>(75);

  const TARGET_AUDIENCE_OPTIONS = [
    'Livre (Comunidade Aberta)',
    'Alunos (Ensino Técnico e Superior)',
    'Servidores (Docentes e Técnicos)',
    'Estudantes e Pesquisadores',
    'Pós-Graduação',
    'Apenas Convidados / Fechado',
  ];

  const CATEGORY_OPTIONS = [
    'Educação',
    'Tecnologia',
    'Pesquisa',
    'Extensão',
    'Cultura',
    'Esporte',
    'Defesas (TCC / Bancas)',
    'Institucional',
    'Sustentabilidade',
  ];

  // Artigos / Anais / Documentos Científicos do Evento
  const [documents, setDocuments] = useState<UploadedFile[]>([]);

  // Form Sessões / Palestras (Inicia com 1 atividade em branco)
  const [sessions, setSessions] = useState<SessionForm[]>([
    {
      title: '',
      description: '',
      speakerName: '',
      speakerBio: '',
      sessionDate: '2026-10-26',
      startTime: '08:00',
      endTime: '10:00',
      roomLocation: '',
      targetAudience: 'Livre (Comunidade Aberta)',
      workloadHours: 2,
      requireDoubleCheckIn: false,
      hasLiveStream: false,
      youtubeUrl: '',
      forceLiveActive: false,
    },
  ]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetchApi<{ users: any[] }>('/users');
        setDbUsers(res.users || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadUsers();
  }, []);

  // Upload da Foto / Banner de Capa
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A foto deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setBannerUrl(base64);
        setBannerPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBanner = () => {
    setBannerUrl('');
    setBannerPreview('');
  };

  // Upload de Artigos / Editais / Trabalhos Científicos (PDF, DOC, DOCX, ZIP)
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        alert(`O arquivo ${file.name} ultrapassa o limite de 20MB.`);
        return;
      }

      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onloadend = () => {
        const newDoc: UploadedFile = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: sizeStr,
          type: file.type || 'application/pdf',
          url: reader.result as string,
        };
        setDocuments((prev) => [...prev, newDoc]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleAddSession = () => {
    setSessions((prev) => [
      ...prev,
      {
        title: '',
        description: '',
        speakerName: '',
        speakerBio: '',
        sessionDate: startDate || '2026-10-26',
        startTime: '14:00',
        endTime: '16:00',
        roomLocation: 'Miniauditório I',
        targetAudience: 'Livre (Comunidade Aberta)',
        workloadHours: 2,
        requireDoubleCheckIn: false,
        hasLiveStream: false,
        youtubeUrl: '',
        forceLiveActive: false,
      },
    ]);
  };

  const handleRemoveSession = (index: number) => {
    setSessions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSessionChange = (index: number, field: keyof SessionForm, value: any) => {
    setSessions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const rawSlug = slug || title || 'evento-ifam';
      let cleanSlug = rawSlug
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      if (cleanSlug.length < 3) {
        cleanSlug = `${cleanSlug || 'evento'}-${Date.now().toString(36)}`;
      }

      // Se for Aferição Diária, aceita cadastrar sem nenhuma sessão obrigatória
      const validSessions = sessions.filter((s) => s.title.trim().length > 0);
      const formattedSessions = validSessions.map((s) => ({
        title: s.title,
        description: s.description,
        speakerName: s.speakerName,
        speakerBio: s.speakerBio,
        startTime: `${s.sessionDate}T${s.startTime}:00Z`,
        endTime: `${s.sessionDate}T${s.endTime}:00Z`,
        roomLocation: s.roomLocation,
        targetAudience: s.targetAudience,
        workloadHours: s.workloadHours,
        requireDoubleCheckIn: Boolean(s.requireDoubleCheckIn),
        hasLiveStream: s.hasLiveStream,
        youtubeUrl: s.youtubeUrl,
        isLiveActive: s.forceLiveActive,
      }));

      await fetchApi('/events', {
        method: 'POST',
        body: JSON.stringify({
          title,
          slug: cleanSlug,
          description,
          bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
          startDate,
          endDate,
          locationName,
          category: categories.join(','),
          targetAudience,
          visibility,
          certificateType,
          attendanceTrackingMode,
          dailyWorkloadHours: Number(dailyWorkloadHours),
          requireDailyCheckOut,
          minAttendanceRate: Number((minAttendanceRate / 100).toFixed(2)),
          capacity: capacity ? parseInt(capacity) : undefined,
          sessions: formattedSessions,
          documents,
        }),
      });

      alert('Evento e parâmetros de frequência cadastrados com sucesso!');
      router.push('/');
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar evento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Voltar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </Link>
        <span className="text-xs font-extrabold uppercase text-ifam-green-700 dark:text-emerald-400 tracking-wider">
          Painel do Organizador IFAM
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* BLOCO 1: DADOS DO EVENTO */}
        <div className="glass-panel p-6 rounded-3xl space-y-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
            <Building2 className="w-5 h-5" />
            <span>1. Informações Gerais do Evento</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Título do Evento *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Semana Nacional de Ciência e Tecnologia 2026 - SNCT IFAM"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-ifam-green-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Descrição Geral *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Descreva a proposta temática do evento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-ifam-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unidade / Campus Principal *
              </label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-ifam-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Categorias / Palavras-Chave Principais *
              </label>
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !categories.includes(val)) {
                    setCategories([...categories, val]);
                  }
                }}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold focus:ring-2 focus:ring-ifam-green-500"
              >
                <option value="">Selecione para adicionar...</option>
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat} value={cat} disabled={categories.includes(cat)}>
                    {cat}
                  </option>
                ))}
              </select>

              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {categories.map((cat) => (
                    <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 bg-ifam-green-50 dark:bg-emerald-950/40 text-ifam-green-700 dark:text-emerald-400 rounded-full border border-ifam-green-200 dark:border-emerald-800/50 shadow-sm transition-all">
                      <span className="text-xs font-bold">{cat}</span>
                      <button
                        type="button"
                        onClick={() => setCategories(categories.filter(c => c !== cat))}
                        className="p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Visibilidade e Acesso
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-ifam-green-500"
              >
                <option value="PUBLIC">🌐 Aberto ao Público Geral</option>
                <option value="RESTRICTED">🔒 Restrito a Convidados (RSVP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Capacidade Máxima de Vagas (Opcional)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 200 (deixe em branco para ilimitado)"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-ifam-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Público-Alvo Recomendado
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold focus:ring-2 focus:ring-ifam-green-500"
              >
                {TARGET_AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data de Início do Evento
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-ifam-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data de Término do Evento
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-ifam-green-500"
              />
            </div>

            {/* SEÇÃO DE UPLOAD DA FOTO / BANNER DE CAPA */}
            <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Foto de Capa / Banner do Evento (Upload ou URL)
              </label>

              {bannerPreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 h-48 bg-slate-100 dark:bg-slate-800 group">
                  <img
                    src={bannerPreview}
                    alt="Preview Banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleRemoveBanner}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg hover:bg-red-700 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remover Foto</span>
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-emerald-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Imagem Carregada</span>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-ifam-green-500 dark:hover:border-emerald-400 rounded-2xl p-6 text-center transition bg-slate-50/50 dark:bg-slate-900/50">
                  <input
                    type="file"
                    id="banner-file-input"
                    accept="image/*"
                    onChange={handleBannerFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="banner-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Clique aqui ou arraste a foto do banner
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Formatos aceitos: JPG, PNG, WEBP (máx. 5MB)
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BLOCO DE REGRAS DE CERTIFICAÇÃO & PRESENÇA */}
        <div className="glass-panel p-6 rounded-3xl space-y-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
            <Sparkles className="w-5 h-5" />
            <span>2. Modelo de Aferição de Frequência & Certificação</span>
          </div>

          {/* 1. SELETOR DE AFERIÇÃO DE FREQUÊNCIA */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Como será realizada a aferição de presença dos participantes?
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                  attendanceTrackingMode === 'DAILY_ATTENDANCE'
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">📅 Aferição Diária (Recomendado)</span>
                  <input
                    type="radio"
                    name="attMode"
                    value="DAILY_ATTENDANCE"
                    checked={attendanceTrackingMode === 'DAILY_ATTENDANCE'}
                    onChange={() => setAttendanceTrackingMode('DAILY_ATTENDANCE')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ideal para <strong>Semanas Acadêmicas, Congressos e Seminários</strong>. O participante faz check-in e check-out a cada dia do evento (não exige cadastrar oficinas obrigatórias).
                </p>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                  attendanceTrackingMode === 'PER_SESSION'
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">🎯 Aferição por Oficinas / Palestras</span>
                  <input
                    type="radio"
                    name="attMode"
                    value="PER_SESSION"
                    checked={attendanceTrackingMode === 'PER_SESSION'}
                    onChange={() => setAttendanceTrackingMode('PER_SESSION')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ideal para <strong>Minicursos e Workshops</strong>. O participante precisa escanear o QR Code específico em cada atividade para validar sua presença.
                </p>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                  attendanceTrackingMode === 'GLOBAL_SINGLE_CHECKIN'
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">🎟️ Check-in Único (Credenciamento)</span>
                  <input
                    type="radio"
                    name="attMode"
                    value="GLOBAL_SINGLE_CHECKIN"
                    checked={attendanceTrackingMode === 'GLOBAL_SINGLE_CHECKIN'}
                    onChange={() => setAttendanceTrackingMode('GLOBAL_SINGLE_CHECKIN')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Basta 1 único check-in de entrada na portaria/recepção para validar a participação integral no evento.
                </p>
              </label>
            </div>

            {/* Parâmetros Específicos do Modo de Aferição Diária */}
            {attendanceTrackingMode === 'DAILY_ATTENDANCE' && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-slate-950/60 border border-emerald-500/30 space-y-3 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Carga Horária Creditada por Dia:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={dailyWorkloadHours}
                        onChange={(e) => setDailyWorkloadHours(parseFloat(e.target.value) || 4)}
                        className="w-24 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      />
                      <span className="text-xs text-slate-500">horas por dia de presença</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Regra de Permanência Diária:
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={requireDailyCheckOut}
                        onChange={(e) => setRequireDailyCheckOut(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Exigir Check-in na Entrada + Check-out na Saída a cada dia</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. MODALIDADE DE CERTIFICAÇÃO */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Tipo de Certificado Gerado:
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                  certificateType === 'EVENT_GLOBAL'
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">📜 Certificado Geral Consolidado</span>
                  <input
                    type="radio"
                    name="certType"
                    value="EVENT_GLOBAL"
                    checked={certificateType === 'EVENT_GLOBAL'}
                    onChange={() => setCertificateType('EVENT_GLOBAL')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Emite 1 certificado com a soma das horas e frequência geral atingida.
                </p>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                  certificateType === 'PER_SESSION'
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">🎯 Certificado por Oficina</span>
                  <input
                    type="radio"
                    name="certType"
                    value="PER_SESSION"
                    checked={certificateType === 'PER_SESSION'}
                    onChange={() => setCertificateType('PER_SESSION')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Emite certificados individuais por palestra ou atividade cumprida.
                </p>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                  certificateType === 'BOTH'
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">🌟 Modelo Híbrido (Ambos)</span>
                  <input
                    type="radio"
                    name="certType"
                    value="BOTH"
                    checked={certificateType === 'BOTH'}
                    onChange={() => setCertificateType('BOTH')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Emite certificados modulares e também o Certificado Geral do evento.
                </p>
              </label>
            </div>

            {/* Slider de Frequência Mínima Exigida */}
            {(certificateType === 'EVENT_GLOBAL' || certificateType === 'BOTH') && (
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-slate-950/60 border border-emerald-500/20 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>Percentual Mínimo de Presença Exigido:</span>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-black text-sm">
                    {minAttendanceRate}% de presença
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={minAttendanceRate}
                  onChange={(e) => setMinAttendanceRate(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {attendanceTrackingMode === 'DAILY_ATTENDANCE'
                    ? `O participante precisará comparecer a pelo menos ${minAttendanceRate}% dos dias do evento para obter o certificado.`
                    : `O participante que realizar check-in em menos de ${minAttendanceRate}% da carga horária programada não terá o certificado liberado.`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* BLOCO 3: CADASTRO COMPLETO DA PROGRAMAÇÃO */}
        <div className="glass-panel p-6 rounded-3xl space-y-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-ifam-green-700 dark:text-emerald-400 font-extrabold text-sm">
              <Clock className="w-5 h-5" />
              <span>
                3. Programação de Atividades & Oficinas{' '}
                {attendanceTrackingMode === 'DAILY_ATTENDANCE' && (
                  <span className="text-xs font-normal text-slate-500">(Opcional no modo de Aferição Diária)</span>
                )}
              </span>
            </div>
            {attendanceTrackingMode === 'DAILY_ATTENDANCE' && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                Frequência aferida por dia
              </span>
            )}
          </div>

          <div className="space-y-6">
            {sessions.map((session, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Atividade / Palestra #{idx + 1}
                  </span>

                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSession(idx)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remover Atividade</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Título da Atividade / Palestra {attendanceTrackingMode === 'PER_SESSION' ? '*' : '(Opcional)'}
                    </label>
                    <input
                      type="text"
                      required={attendanceTrackingMode === 'PER_SESSION'}
                      placeholder="Ex: Cerimônia de Abertura, Workshop de Robótica, Mesa Redonda..."
                      value={session.title}
                      onChange={(e) => handleSessionChange(idx, 'title', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Data da Atividade
                    </label>
                    <input
                      type="date"
                      value={session.sessionDate}
                      onChange={(e) => handleSessionChange(idx, 'sessionDate', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Horário de Início
                    </label>
                    <input
                      type="time"
                      value={session.startTime}
                      onChange={(e) => handleSessionChange(idx, 'startTime', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Horário de Término
                    </label>
                    <input
                      type="time"
                      value={session.endTime}
                      onChange={(e) => handleSessionChange(idx, 'endTime', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Local Específico (Auditório / Sala / Laboratório) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Auditório Djalma Batista, Lab de Informática II..."
                      value={session.roomLocation}
                      onChange={(e) => handleSessionChange(idx, 'roomLocation', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Público-Alvo Específico
                    </label>
                    <select
                      value={session.targetAudience}
                      onChange={(e) => handleSessionChange(idx, 'targetAudience', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                    >
                      {TARGET_AUDIENCE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Carga Horária (Horas Certificadas)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={session.workloadHours}
                      onChange={(e) => handleSessionChange(idx, 'workloadHours', parseFloat(e.target.value) || 1)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div className="md:col-span-2 relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Palestrante Convidado *
                      </label>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        📧 E-mail enviado só após a publicação
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Digite o nome ou busque no banco de dados..."
                      value={session.speakerName}
                      onChange={(e) => {
                        handleSessionChange(idx, 'speakerName', e.target.value);
                        setActiveSpeakerSuggestions(idx);
                      }}
                      onFocus={() => setActiveSpeakerSuggestions(idx)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                    />

                    {/* SUGESTÕES DE USUÁRIOS DO BANCO */}
                    {activeSpeakerSuggestions === idx && session.speakerName.split(',').pop()?.trim().length! >= 1 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {dbUsers
                          .filter((u) => {
                            const term = session.speakerName.split(',').pop()?.trim().toLowerCase() || '';
                            return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
                          })
                          .slice(0, 5)
                          .map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                const names = session.speakerName.split(',').map(n => n.trim());
                                names.pop(); // remove the partial typed name
                                names.push(u.name);
                                
                                const bios = (session.speakerBio || '').split(' | ').map(b => b.trim()).filter(Boolean);
                                bios.push(`${u.category || 'Servidor'} - ${u.campus || 'IFAM'}`);

                                handleSessionChange(idx, 'speakerName', names.join(', ') + ', ');
                                handleSessionChange(idx, 'speakerBio', bios.join(' | '));
                                setActiveSpeakerSuggestions(null);
                              }}
                              className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50 dark:hover:bg-slate-800 transition flex items-center justify-between"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{u.name}</p>
                                <p className="text-[10px] text-slate-400">{u.email} • {u.category || 'IFAM'} ({u.campus || 'Campus CMC'})</p>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                                Puxar do Banco
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* CONFIGURAÇÃO DE TRANSMISSÃO E AUTOMACÃO POR HORÁRIO */}
                  <div className="md:col-span-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={session.hasLiveStream}
                        onChange={(e) => handleSessionChange(idx, 'hasLiveStream', e.target.checked)}
                        className="w-4 h-4 rounded text-ifam-green-600 focus:ring-ifam-green-500"
                      />
                      <Tv className="w-4 h-4 text-red-600" />
                      <span>Atividade terá Transmissão Ao Vivo (YouTube)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer select-none pt-2 border-t border-slate-100 dark:border-slate-800">
                      <input
                        type="checkbox"
                        checked={session.requireDoubleCheckIn}
                        onChange={(e) => handleSessionChange(idx, 'requireDoubleCheckIn', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>Exigir Check-in Duplo Obrigatório (Entrada + Saída com 75% de permanência)</span>
                    </label>

                    {session.hasLiveStream && (
                      <div className="space-y-3 pt-1 animate-fade-in">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Link da Transmissão do YouTube
                          </label>
                          <input
                            type="url"
                            placeholder="https://youtube.com/watch?v=..."
                            value={session.youtubeUrl}
                            onChange={(e) => handleSessionChange(idx, 'youtubeUrl', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                          <div className="flex items-center gap-2 font-medium">
                            <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              <strong>Automação Inteligente:</strong> A flag "AO VIVO AGORA" será ativada automaticamente no portal exatamente entre às <strong>{session.startTime || '08:00'}</strong> e <strong>{session.endTime || '10:00'}</strong> do dia <strong>{session.sessionDate}</strong>.
                            </span>
                          </div>

                          <label className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 cursor-pointer shrink-0 ml-3">
                            <input
                              type="checkbox"
                              checked={session.forceLiveActive}
                              onChange={(e) => handleSessionChange(idx, 'forceLiveActive', e.target.checked)}
                              className="w-3.5 h-3.5 rounded text-red-600"
                            />
                            <span>Forçar Início Imediato</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* BOTÃO + ADICIONAR NOVA ATIVIDADE NA PARTE INFERIOR DA LISTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddSession}
                className="w-full py-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border-2 border-dashed border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>+ Adicionar Próxima Atividade / Palestra na Programação</span>
              </button>
            </div>
          </div>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-ifam-green-700 hover:bg-ifam-green-800 text-white font-extrabold text-sm shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          <span>{loading ? 'Cadastrando Evento...' : 'Salvar e Publicar Evento no IFAM'}</span>
        </button>
      </form>
    </div>
  );
}
