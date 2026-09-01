'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../lib/api';
import { ALL_IFAM_CAMPI } from '../../lib/constants';
import {
  X,
  User,
  Camera,
  Save,
  Check,
  Lock,
  Mail,
  Linkedin,
  Instagram,
  FileText,
  Sparkles,
  Tag,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INTEREST_OPTIONS = [
  '🤖 IA & Ciência de Dados',
  '⚡ Robótica & Automação',
  '🧪 Biotecnologia & Saúde',
  '🌿 Bioeconomia Amazônica',
  '💻 Eng. de Software & Web',
  '🎓 Educação Tecnológica',
  '📡 Redes, Segurança & IoT',
  '🚀 Inovação & Startups',
  '📊 Gestão de Projetos',
  '🌱 Agronomia & Florestal',
  '🎨 Design & UX/UI',
  '⚙️ Engenharia & Indústria 4.0',
];

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, login } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [pronoun, setPronoun] = useState(user?.pronoun || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState(user?.category || 'TECNICO');
  const [campus, setCampus] = useState(user?.campus || 'Campus Manaus Centro');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState((user as any)?.linkedinUrl || '');
  const [instagramUrl, setInstagramUrl] = useState((user as any)?.instagramUrl || '');
  const [lattesUrl, setLattesUrl] = useState((user as any)?.lattesUrl || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    (user as any)?.interests ? (user as any).interests.split(',').map((s: string) => s.trim()) : []
  );

  const [responderCategories, setResponderCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ifam_responder_categories');
      return saved ? JSON.parse(saved) : ['HEALTH', 'HARASSMENT'];
    }
    return ['HEALTH', 'HARASSMENT'];
  });

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPronoun(user.pronoun || '');
      setEmail(user.email || '');
      setCategory(user.category || 'TECNICO');
      // Busca correspondência exata ou aproximada no array ALL_IFAM_CAMPI
      let matchedCampus = user.campus || 'Campus Manaus - Centro';
      if (!ALL_IFAM_CAMPI.includes(matchedCampus)) {
        const found = ALL_IFAM_CAMPI.find((c) =>
          c.toLowerCase().replace(/[\s-]/g, '').includes(matchedCampus.toLowerCase().replace(/[\s-]/g, '')) ||
          matchedCampus.toLowerCase().replace(/[\s-]/g, '').includes(c.toLowerCase().replace(/[\s-]/g, ''))
        );
        if (found) matchedCampus = found;
      }
      setCampus(matchedCampus);
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
      setAvatarPreview(user.avatarUrl || '');
      setLinkedinUrl((user as any)?.linkedinUrl || '');
      setInstagramUrl((user as any)?.instagramUrl || '');
      setLattesUrl((user as any)?.lattesUrl || '');
      if ((user as any)?.interests) {
        setSelectedInterests((user as any).interests.split(',').map((s: string) => s.trim()));
      }
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`ifam_responder_categories_${user.id}`);
        if (saved) setResponderCategories(JSON.parse(saved));
      }
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleToggleResponder = (cat: string) => {
    setResponderCategories((prev) => {
      const updated = prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat];
      if (typeof window !== 'undefined' && user) {
        localStorage.setItem(`ifam_responder_categories_${user.id}`, JSON.stringify(updated));
        localStorage.setItem('ifam_responder_categories', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleToggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      if (selectedInterests.length >= 5) {
        alert('Você pode selecionar no máximo 5 áreas de interesse.');
        return;
      }
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A foto deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        setAvatarPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    try {
      const interestsString = selectedInterests.join(', ');

      const res = await fetchApi<{ message: string; user: any }>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          email,
          ...(password.trim() ? { password: password.trim() } : {}),
          pronoun,
          category,
          campus,
          bio,
          avatarUrl,
          linkedinUrl,
          instagramUrl,
          lattesUrl,
          interests: interestsString,
        }),
      });

      // Atualiza o contexto do usuário localmente no localStorage
      const savedUser = localStorage.getItem('ifam_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const updated = {
          ...parsed,
          name,
          email,
          pronoun,
          category,
          campus,
          bio,
          avatarUrl,
          linkedinUrl,
          instagramUrl,
          lattesUrl,
          interests: interestsString,
        };
        localStorage.setItem('ifam_user', JSON.stringify(updated));
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-fade-in p-4 sm:p-6 flex justify-center items-start pt-12 sm:pt-16 pb-12">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl space-y-5 p-6 my-auto max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-ifam-green-700 dark:text-emerald-400 font-extrabold text-sm">
            <User className="w-5 h-5" />
            <span>Editar Meu Perfil no IFAM Eventos</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* UPLOAD / PREVIEW DA FOTO DE PERFIL */}
          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-ifam-green-600 shadow-lg bg-slate-100 dark:bg-slate-800 group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-2xl">
                  {name.charAt(0) || 'U'}
                </div>
              )}

              <input
                type="file"
                id="profile-avatar-input"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
              <label
                htmlFor="profile-avatar-input"
                className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white cursor-pointer text-[10px] font-bold gap-1"
              >
                <Camera className="w-5 h-5" />
                <span>Trocar Foto</span>
              </label>
            </div>

            <span className="text-[10px] text-slate-400 font-medium">
              Clique na foto para escolher uma nova imagem do computador
            </span>
          </div>

          {/* Nome e Vínculo/Profissão em Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pronome de Tratamento
              </label>
              <select
                value={pronoun}
                onChange={(e) => setPronoun(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
              >
                <option value="">Não informar (Opcional)</option>
                <option value="Ele/Dele">Ele/Dele</option>
                <option value="Ela/Dela">Ela/Dela</option>
                <option value="Sr.">Sr.</option>
                <option value="Sra.">Sra.</option>
                <option value="Prof.">Prof.</option>
                <option value="Profa.">Profa.</option>
                <option value="Dr.">Dr.</option>
                <option value="Dra.">Dra.</option>
                <option value="Me.">Me. (Mestre)</option>
                <option value="Ma.">Ma. (Mestra)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vínculo / Categoria Profissional *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
              >
                <option value="PROFESSOR">PROFESSOR (Docente)</option>
                <option value="TECNICO">TÉCNICO (TAE / Administrativo)</option>
                <option value="PESQUISADOR">PESQUISADOR (Colaborador)</option>
                <option value="ALUNO">ALUNO (Discente / Estudante)</option>
                <option value="EXTERNO">EXTERNO (Comunidade / Visitante)</option>
              </select>
            </div>
          </div>

          {/* E-mail e Nova Senha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>E-mail Institucional *</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Nova Senha (deixe em branco se não mudar)</span>
              </label>
              <input
                type="password"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Campus */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Campus IFAM de Origem
            </label>
            <select
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
            >
              {ALL_IFAM_CAMPI.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Bio / Mini Apresentação */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Bio / Minibiografia (Apresentação Profissional/Acadêmica)
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Docente em Engenharia de Software e Pesquisador de Inteligência Artificial no IFAM CMC..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          {/* Redes Sociais & Links Profissionais */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Redes Sociais & Perfil Acadêmico (Links)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Linkedin className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-3" />
                <input
                  type="url"
                  placeholder="LinkedIn URL"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="relative">
                <Instagram className="w-3.5 h-3.5 text-pink-600 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Instagram (@usuario)"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="relative">
                <FileText className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-3" />
                <input
                  type="url"
                  placeholder="Currículo Lattes URL"
                  value={lattesUrl}
                  onChange={(e) => setLattesUrl(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* REDE DE APOIO & VOLUNTARIADO IFAM GUARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/30 dark:from-slate-800/60 dark:to-amber-950/20 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Rede de Socorro & Voluntariado IFAM Guard</span>
              </label>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full">
                Prontidão no Campus
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Como membro da comunidade, você pode se prontificar a receber notificações e chamados de socorro prioritários quando um participante disparar um alerta no campus. Selecione suas áreas de atuação voluntária:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              <label
                className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between space-y-1.5 ${
                  responderCategories.includes('HEALTH')
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">🚑 Saúde / Socorro</span>
                  <input
                    type="checkbox"
                    checked={responderCategories.includes('HEALTH')}
                    onChange={() => handleToggleResponder('HEALTH')}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Primeiros socorros, mal-estar e emergências médicas.
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between space-y-1.5 ${
                  responderCategories.includes('HARASSMENT')
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">🛡️ Testemunha Ativa</span>
                  <input
                    type="checkbox"
                    checked={responderCategories.includes('HARASSMENT')}
                    onChange={() => handleToggleResponder('HARASSMENT')}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Prevenção pacífica de assédio, bullying e constrangimento.
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between space-y-1.5 ${
                  responderCategories.includes('VIOLENCE')
                    ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">🚨 Segurança & Drogas</span>
                  <input
                    type="checkbox"
                    checked={responderCategories.includes('VIOLENCE')}
                    onChange={() => handleToggleResponder('VIOLENCE')}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Brigas, agressões físicas, ameaças, porte de armas ou drogas.
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between space-y-1.5 ${
                  responderCategories.includes('ASSET')
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">🏢 Incêndios & Riscos</span>
                  <input
                    type="checkbox"
                    checked={responderCategories.includes('ASSET')}
                    onChange={() => handleToggleResponder('ASSET')}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Focos de incêndio, vazamentos, furtos e danos ao patrimônio.
                </p>
              </label>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Perfil, vínculo, prontidão voluntária e redes salvos com sucesso!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-ifam-green-700 hover:bg-ifam-green-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Salvando...' : 'Salvar Alterações do Perfil'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
