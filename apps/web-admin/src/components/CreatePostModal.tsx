'use client';

import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Send, Sparkles, AlertCircle, Plus, Bookmark } from 'lucide-react';
import { EventItem, HighlightItem } from '@ifam-eventos/types';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
  highlights?: HighlightItem[];
  preSelectedEventId?: string;
  preSelectedHighlightId?: string;
  onPostCreated?: () => void;
  onOpenCreateHighlight?: () => void;
}

export function CreatePostModal({
  isOpen,
  onClose,
  events,
  highlights = [],
  preSelectedEventId,
  preSelectedHighlightId,
  onPostCreated,
  onOpenCreateHighlight,
}: CreatePostModalProps) {
  const { user } = useAuth();
  const [targetType, setTargetType] = useState<'story' | 'highlight' | 'event'>('story');
  const [selectedEventId, setSelectedEventId] = useState<string>(preSelectedEventId || '');
  const [selectedHighlightId, setSelectedHighlightId] = useState<string>(preSelectedHighlightId || '');
  const [content, setContent] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const canManageHighlights =
    user &&
    (['ADMIN_MASTER', 'ADMIN_UNIDADE', 'SUPER_ADMIN'].includes(user.role) ||
      ['PROFESSOR', 'TECNICO', 'SERVIDOR', 'PESQUISADOR'].includes(user.category));

  React.useEffect(() => {
    if (preSelectedHighlightId) {
      setTargetType('highlight');
      setSelectedHighlightId(preSelectedHighlightId);
    } else if (preSelectedEventId) {
      setTargetType('event');
      setSelectedEventId(preSelectedEventId);
    } else {
      setTargetType('story');
    }
  }, [preSelectedEventId, preSelectedHighlightId, events, highlights, isOpen]);

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
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetType === 'highlight' && !selectedHighlightId) {
      setError('Por favor, selecione um destaque.');
      return;
    }
    if (targetType === 'event' && !selectedEventId) {
      setError('Por favor, selecione um evento.');
      return;
    }
    if (!content.trim() && !mediaPreview) {
      setError('Escreva uma legenda ou selecione uma foto.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await fetchApi('/events/stories', {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          mediaUrl: mediaPreview || undefined,
          mediaType: 'IMAGE',
          ...(targetType === 'highlight' && { highlightId: selectedHighlightId }),
          ...(targetType === 'event' && { eventId: selectedEventId }),
        }),
      });

      setContent('');
      setMediaPreview(null);
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao publicar story.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 flex justify-center items-center animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 text-white my-auto space-y-5 cursor-default"
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-base font-extrabold text-white">Novo Story / Publicação</h2>
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
          {/* Seletor de Tipo de Destino (Story 24h vs Destaques vs Evento) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-400">
                Onde você quer publicar?
              </label>
              {canManageHighlights && onOpenCreateHighlight && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreateHighlight();
                  }}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Destaque</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => setTargetType('story')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  targetType === 'story'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Story 24h</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('highlight')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  targetType === 'highlight'
                    ? 'bg-violet-500/20 border-violet-500 text-violet-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="truncate">Destaques ({highlights.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('event')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  targetType === 'event'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Evento ({events.length})</span>
              </button>
            </div>

            {targetType === 'story' && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Seu Story 24h ficará disponível no topo da rede social durante as próximas 24 horas.</span>
              </div>
            )}

            {targetType === 'highlight' && (
              <select
                value={selectedHighlightId}
                onChange={(e) => setSelectedHighlightId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" disabled>-- Selecione um Destaque Fixado --</option>
                {highlights.map((h) => (
                  <option key={h.id} value={h.id}>
                    ⭐ {h.title} {h.description ? `- ${h.description}` : ''}
                  </option>
                ))}
              </select>
            )}

            {targetType === 'event' && (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" disabled>-- Selecione um evento --</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    📅 {ev.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Legenda / Texto */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Legenda ou Comentário
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Compartilhe seu momento, aprendizado ou foto no evento..."
              className="w-full p-3.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Pré-visualização da Mídia */}
          {mediaPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 max-h-56 bg-black flex justify-center items-center">
              <img src={mediaPreview} alt="Preview" className="max-h-56 object-contain" />
              <button
                type="button"
                onClick={() => setMediaPreview(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Botões de Seleção de Foto / Câmera */
            <div className="flex items-center gap-3">
              {/* Input exclusivo para Câmera */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Input exclusivo para Galeria */}
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
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Tirar Foto / Câmera</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Abrir Galeria</span>
              </button>
            </div>
          )}

          {/* Botão de Envio */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                'Publicando...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publicar no Feed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
