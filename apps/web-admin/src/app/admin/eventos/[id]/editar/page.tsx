'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Upload,
  ArrowLeft,
  Save,
  CheckCircle,
  FileText,
  Clock,
  Plus,
  Trash2,
  Tv,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  Users,
  Mic,
  Video,
  X,
} from 'lucide-react';
import { fetchApi } from '../../../../../lib/api';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = (params?.id as string) || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Campos Principais do Evento
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('IFAM Campus Manaus Centro');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [activeSpeakerSuggestions, setActiveSpeakerSuggestions] = useState<number | null>(null);

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

  const [targetAudience, setTargetAudience] = useState<string>('Livre (Comunidade Aberta)');
  const TARGET_AUDIENCE_OPTIONS = [
    'Livre (Comunidade Aberta)',
    'Alunos (Ensino Técnico e Superior)',
    'Servidores (Docentes e Técnicos)',
    'Estudantes e Pesquisadores',
    'Pós-Graduação',
    'Apenas Convidados / Fechado',
  ];

  // Programação do Evento (Sessões / Palestras)
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetchApi<{ event: any }>(`/events/${eventId}`);
        if (res.event) {
          const ev = res.event;
          setTitle(ev.title || '');
          setSlug(ev.slug || '');
          setDescription(ev.description || '');
          setLocationName(ev.locationName || 'IFAM Campus Manaus Centro');
          setVisibility(ev.visibility || 'PUBLIC');
          setStartDate(ev.startDate ? new Date(ev.startDate).toISOString().slice(0, 16) : '');
          setEndDate(ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 16) : '');
          setBannerUrl(ev.bannerUrl || '');
          setBannerPreview(ev.bannerUrl || '');
          if (ev.targetAudience) setTargetAudience(ev.targetAudience);
          if (ev.category) {
            setCategories(ev.category.split(',').map((c: string) => c.trim()).filter(Boolean));
          }

          // Pré-carrega as sessões/palestras existentes do evento
          if (ev.sessions && Array.isArray(ev.sessions)) {
            setSessions(
              ev.sessions.map((s: any) => ({
                id: s.id || `sess-${Date.now()}-${Math.random()}`,
                title: s.title || '',
                description: s.description || '',
                speakerName: s.speakerName || '',
                speakerBio: s.speakerBio || '',
                roomLocation: s.room || s.roomLocation || 'Auditório Principal',
                targetAudience: s.targetAudience || 'Livre (Comunidade Aberta)',
                startTime: s.startTime ? new Date(s.startTime).toISOString().slice(0, 16) : '',
                endTime: s.endTime ? new Date(s.endTime).toISOString().slice(0, 16) : '',
                workloadHours: s.workloadHours || 2,
                youtubeUrl: s.youtubeLiveUrl || s.youtubeUrl || '',
                isLiveActive: Boolean(s.isLiveActive),
              }))
            );
          }
        }
      } catch (err) {
        console.error('Erro ao carregar evento:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);

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

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 10MB.');
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

  // Funções de Gerenciamento da Programação (Sessões)
  const addSession = () => {
    setSessions([
      ...sessions,
      {
        id: `sess-${Date.now()}`,
        title: 'Nova Palestra / Mesa Redonda',
        description: 'Descrição resumida da atividade acadêmica...',
        speakerName: '',
        speakerBio: '',
        roomLocation: 'Miniauditório I',
        targetAudience: 'Livre (Comunidade Aberta)',
        startTime: startDate || new Date().toISOString().slice(0, 16),
        endTime: endDate || new Date().toISOString().slice(0, 16),
        workloadHours: 2,
        youtubeUrl: '',
        isLiveActive: false,
      },
    ]);
  };

  const removeSession = (index: number) => {
    setSessions(sessions.filter((_, i) => i !== index));
  };

  const updateSessionField = (index: number, field: string, value: any) => {
    const updated = [...sessions];
    updated[index] = { ...updated[index], [field]: value };
    setSessions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await fetchApi(`/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          slug,
          description,
          locationName,
          visibility,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          bannerUrl,
          category: categories.join(','),
          targetAudience,
          sessions: sessions.map((s) => ({
            ...s,
            startTime: new Date(s.startTime).toISOString(),
            endTime: new Date(s.endTime).toISOString(),
          })),
        }),
      });

      setSaveSuccess(true);
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar evento.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 font-bold text-sm">
        <div className="w-8 h-8 border-4 border-unifik-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Carregando dados completos do evento...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Dashboard</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Editar Evento e Programação de Palestras
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Banner HD */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-unifik-primary" />
            <span>Imagem de Capa (Banner HD do Evento)</span>
          </h3>

          <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 text-center group cursor-pointer">
            {bannerPreview ? (
              <div className="relative h-48 w-full rounded-xl overflow-hidden shadow-md">
                <img src={bannerPreview} alt="Preview Banner" className="w-full h-full object-cover" />
                <label
                  htmlFor="edit-banner-file"
                  className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-2 cursor-pointer"
                >
                  <Upload className="w-5 h-5" />
                  <span>Trocar Imagem de Capa</span>
                </label>
              </div>
            ) : (
              <label htmlFor="edit-banner-file" className="cursor-pointer block py-8 space-y-2">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Clique aqui para selecionar uma imagem do computador
                </p>
                <p className="text-[10px] text-slate-400">Suporta JPG, PNG ou WEBP até 10MB</p>
              </label>
            )}

            <input
              type="file"
              id="edit-banner-file"
              accept="image/*"
              onChange={handleBannerFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Informações Principais */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-unifik-primary" />
            <span>Informações Gerais do Evento</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Título do Evento *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Descrição Oficial e Objetivos *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data/Hora de Início *
              </label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data/Hora de Término *
              </label>
              <input
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Local do Evento / Campus *
            </label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Público-Alvo Recomendado
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold focus:ring-2 focus:ring-unifik-primary"
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
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold focus:ring-2 focus:ring-unifik-primary"
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
                  <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 bg-unifik-violet-50 dark:bg-emerald-950/40 text-unifik-primary dark:text-emerald-400 rounded-full border border-unifik-violet-500 dark:border-emerald-800/50 shadow-sm transition-all">
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
        </div>

        {/* PROGRAMAÇÃO OFICIAL DO EVENTO (SESSÕES / PALESTRAS) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-unifik-primary" />
                <span>Programação Oficial (Palestras, Oficinas e Mesas Redondas)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Adicione ou edite as atividades do evento. Elas gerarão a carga horária nos certificados dos alunos.
              </p>
            </div>

            <button
              type="button"
              onClick={addSession}
              className="px-4 py-2 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Atividade</span>
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Clock className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nenhuma palestra cadastrada na programação
              </p>
              <p className="text-[11px]">Clique em "+ Adicionar Atividade" acima para incluir palestras ou minicursos.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sessions.map((sess, idx) => (
                <div
                  key={sess.id || idx}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-unifik-violet-100 dark:bg-emerald-950 text-unifik-violet-600 dark:text-emerald-300 font-extrabold text-xs">
                      Atividade #{idx + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeSession(idx)}
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 transition"
                      title="Remover esta atividade"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Título da Palestra / Atividade *
                      </label>
                      <input
                        type="text"
                        required
                        value={sess.title}
                        onChange={(e) => updateSessionField(idx, 'title', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>

                    <div className="md:col-span-2 relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
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
                        value={sess.speakerName}
                        onChange={(e) => {
                          updateSessionField(idx, 'speakerName', e.target.value);
                          setActiveSpeakerSuggestions(idx);
                        }}
                        onFocus={() => setActiveSpeakerSuggestions(idx)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                      />

                      {/* SUGESTÕES DE USUÁRIOS DO BANCO */}
                      {activeSpeakerSuggestions === idx && sess.speakerName.split(',').pop()?.trim().length! >= 1 && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                          {dbUsers
                            .filter((u) => {
                              const term = sess.speakerName.split(',').pop()?.trim().toLowerCase() || '';
                              return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
                            })
                            .slice(0, 5)
                            .map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  const names = sess.speakerName.split(',').map((n: string) => n.trim());
                                  names.pop(); // remove the partial typed name
                                  names.push(u.name);
                                  
                                  const bios = (sess.speakerBio || '').split(' | ').map((b: string) => b.trim()).filter(Boolean);
                                  bios.push(`${u.category || 'Servidor'} - ${u.campus || 'IFAM'}`);

                                  updateSessionField(idx, 'speakerName', names.join(', ') + ', ');
                                  updateSessionField(idx, 'speakerBio', bios.join(' | '));
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Sala / Auditório
                      </label>
                      <input
                        type="text"
                        value={sess.roomLocation}
                        onChange={(e) => updateSessionField(idx, 'roomLocation', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Público-Alvo Específico
                      </label>
                      <select
                        value={sess.targetAudience}
                        onChange={(e) => updateSessionField(idx, 'targetAudience', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                      >
                        {TARGET_AUDIENCE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Início
                      </label>
                      <input
                        type="datetime-local"
                        value={sess.startTime}
                        onChange={(e) => updateSessionField(idx, 'startTime', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Término
                      </label>
                      <input
                        type="datetime-local"
                        value={sess.endTime}
                        onChange={(e) => updateSessionField(idx, 'endTime', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Carga Horária (em horas)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={sess.workloadHours}
                        onChange={(e) => updateSessionField(idx, 'workloadHours', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Link de Transmissão do YouTube (Opcional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={sess.youtubeUrl}
                        onChange={(e) => updateSessionField(idx, 'youtubeUrl', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Evento e programação de palestras atualizados com sucesso! Redirecionando...</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3.5 rounded-2xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition duration-200 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando Alterações...' : 'Salvar Alterações do Evento e Programação'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
