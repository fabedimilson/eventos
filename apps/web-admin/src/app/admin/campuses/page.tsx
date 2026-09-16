'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { ProtectedStateCard } from '../../../components/ProtectedStateCard';

interface CampusUnit {
  id: string;
  institutionId: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address?: string | null;
  active: boolean;
}

export default function AdminCampusesPage() {
  const { user, loading: authLoading } = useAuth();
  const [campuses, setCampuses] = useState<CampusUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<CampusUnit | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('AM');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isAdmin =
    user?.role === 'ADMIN_UNIDADE' || user?.role === 'ADMIN_MASTER' || user?.role === 'SUPER_ADMIN';

  const loadCampuses = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ campuses: CampusUnit[] }>('/institutions/ifam/campuses');
      setCampuses(res.campuses || []);
    } catch (err) {
      console.error('Erro ao carregar campi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadCampuses();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  if (!authLoading && !isAdmin) {
    return (
      <ProtectedStateCard
        title="Acesso Restrito ao Painel da Unidade"
        description="Apenas administradores de campus (Setor de Comunicação) ou Administradores Master possuem permissão para gerenciar as unidades e campi da instituição."
      />
    );
  }

  const handleOpenCreateModal = () => {
    setEditingCampus(null);
    setName('');
    setCode('');
    setCity('Manaus');
    setState('AM');
    setAddress('');
    setFeedback(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (campus: CampusUnit) => {
    setEditingCampus(campus);
    setName(campus.name);
    setCode(campus.code);
    setCity(campus.city);
    setState(campus.state);
    setAddress(campus.address || '');
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setFeedback({ type: 'error', message: 'Nome e sigla do campus são obrigatórios.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      if (editingCampus) {
        // Atualizar campus existente
        await fetchApi(`/institutions/campuses/${editingCampus.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, code, city, state, address }),
        });
        setFeedback({ type: 'success', message: 'Campus atualizado com sucesso!' });
      } else {
        // Obter ID da instituição principal
        const instRes = await fetchApi<{ institutions: any[] }>('/institutions');
        const instId = instRes.institutions?.[0]?.id;

        if (!instId) {
          throw new Error('Instituição padrão não encontrada.');
        }

        await fetchApi(`/institutions/${instId}/campuses`, {
          method: 'POST',
          body: JSON.stringify({ name, code, city, state, address }),
        });
        setFeedback({ type: 'success', message: 'Novo campus cadastrado com sucesso!' });
      }

      await loadCampuses();
      setTimeout(() => setModalOpen(false), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao salvar campus.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (campus: CampusUnit) => {
    try {
      await fetchApi(`/institutions/campuses/${campus.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !campus.active }),
      });
      await loadCampuses();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do campus.');
    }
  };

  const filteredCampuses = campuses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-unifik-primary flex items-center gap-1.5 font-bold transition mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para a Página Inicial</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-unifik-primary" />
            <span>Gestão de Campi & Unidades da Instituição</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Cadastre e edite as unidades de ensino da sua instituição. Cada campus possui sua própria grade de cursos, turmas e cronograma acadêmico.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-unifik-primary hover:bg-emerald-700 text-white font-black text-xs transition shadow-md flex items-center gap-2 shrink-0 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Cadastrar Novo Campus</span>
        </button>
      </div>

      {/* BARRA DE PESQUISA */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, sigla ou cidade do campus..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-unifik-primary"
          />
        </div>
        <span className="text-xs font-bold text-slate-400 shrink-0">
          {filteredCampuses.length} {filteredCampuses.length === 1 ? 'unidade' : 'unidades'}
        </span>
      </div>

      {/* LISTAGEM DE CAMPI */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Carregando unidades da instituição...</div>
      ) : filteredCampuses.length === 0 ? (
        <div className="text-center py-16 text-slate-400 space-y-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Building2 className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-xs font-semibold">Nenhum campus encontrado com este filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampuses.map((campus) => (
            <div
              key={campus.id}
              className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition shadow-xs flex flex-col justify-between space-y-4 ${
                campus.active
                  ? 'border-slate-200 dark:border-slate-800 hover:border-unifik-primary'
                  : 'border-slate-200/50 dark:border-slate-800/40 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-black text-[10px] tracking-wider uppercase">
                    {campus.code}
                  </span>
                  <button
                    onClick={() => handleToggleActive(campus)}
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition ${
                      campus.active
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {campus.active ? 'Ativo' : 'Desativado'}
                  </button>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                  {campus.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {campus.city} - {campus.state}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleOpenEditModal(campus)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE CAMPUS */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingCampus ? 'Editar Unidade / Campus' : 'Cadastrar Novo Campus'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                    : 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-200'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome Completo do Campus <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Campus Manaus Centro"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Sigla / Código <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex: CMC, CPAR"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Cidade / UF
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Manaus"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Endereço / Localização
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Av. Sete de Setembro, 1975 - Centro"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-unifik-primary hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : editingCampus ? 'Salvar Alterações' : 'Cadastrar Campus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
