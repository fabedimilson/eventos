'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Sparkles, AlertCircle, Bookmark, Link2, Trash2 } from 'lucide-react';
import { EventItem, HighlightItem } from '@ifam-eventos/types';
import { fetchApi } from '../lib/api';
import { ALL_IFAM_CAMPI } from '../lib/constants';

interface CreateHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
  highlightToEdit?: HighlightItem | null;
  onHighlightSaved?: () => void;
}

export function CreateHighlightModal({
  isOpen,
  onClose,
  events,
  highlightToEdit,
  onHighlightSaved,
}: CreateHighlightModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedCampus, setSelectedCampus] = useState('ALL');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [order, setOrder] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (highlightToEdit) {
      setTitle(highlightToEdit.title || '');
      setDescription(highlightToEdit.description || '');
      setCoverPreview(highlightToEdit.coverUrl || null);
      setSelectedCampus(highlightToEdit.campus || 'ALL');
      setSelectedEventId(highlightToEdit.eventId || '');
      setOrder(highlightToEdit.order || 0);
    } else {
      setTitle('');
      setDescription('');
      setCoverPreview(null);
      setSelectedCampus('ALL');
      setSelectedEventId('');
      setOrder(0);
    }
    setError('');
  }, [highlightToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 10MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('O título do destaque é obrigatório.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        coverUrl: coverPreview || undefined,
        campus: selectedCampus,
        eventId: selectedEventId || null,
        order: Number(order) || 0,
      };

      if (highlightToEdit) {
        await fetchApi(`/highlights/${highlightToEdit.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/highlights', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (onHighlightSaved) onHighlightSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar destaque.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!highlightToEdit) return;
    if (!confirm(`Deseja realmente remover o destaque "${highlightToEdit.title}"?`)) return;

    setDeleting(true);
    try {
      await fetchApi(`/highlights/${highlightToEdit.id}`, {
        method: 'DELETE',
      });

      if (onHighlightSaved) onHighlightSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao remover destaque.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 flex justify-center items-center animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 text-white my-auto space-y-5 cursor-default"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Bookmark className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white">
              {highlightToEdit ? 'Editar Destaque' : 'Novo Destaque'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título Curto */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Título Curto do Destaque <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              maxLength={20}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: 23ª, Institucional, Bolsas"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              Nome exibido abaixo do ícone (Recomendado: até 12 caracteres)
            </span>
          </div>

          {/* Descrição Detalhada */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Descrição (Opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Mídias da 23ª SNCT Ciência Delas"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Vínculo a Evento (Opcional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-emerald-400" />
              Vincular a um Evento (Opcional)
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Destaque Livre / Independente --</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Campus */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Visibilidade por Campus
            </label>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Todos os Campi (Global)</option>
              {ALL_IFAM_CAMPI.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Imagem de Capa do Destaque */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Imagem de Capa (Bolinha)
            </label>
            {coverPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 h-24 bg-black flex justify-center items-center">
                <img src={coverPreview} alt="Capa" className="h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverPreview(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Tirar Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex-1 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Abrir Galeria</span>
                </button>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 flex items-center gap-3">
            {highlightToEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="p-3 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs transition active:scale-95 flex items-center justify-center disabled:opacity-50"
                title="Excluir Destaque"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3.5 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                'Salvando...'
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>{highlightToEdit ? 'Salvar Alterações' : 'Criar Destaque'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
