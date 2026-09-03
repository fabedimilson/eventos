'use client';

import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Send, Sparkles, AlertCircle } from 'lucide-react';
import { EventItem } from '@ifam-eventos/types';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
  preSelectedEventId?: string;
  onPostCreated?: () => void;
}

export function CreatePostModal({
  isOpen,
  onClose,
  events,
  preSelectedEventId,
  onPostCreated,
}: CreatePostModalProps) {
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string>(preSelectedEventId || '');
  const [content, setContent] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Define o ID inicial se preSelectedEventId mudar
  React.useEffect(() => {
    if (preSelectedEventId) {
      setSelectedEventId(preSelectedEventId);
    } else if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [preSelectedEventId, events]);

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
    if (!selectedEventId) {
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
      await fetchApi(`/events/${selectedEventId}/posts`, {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          mediaUrl: mediaPreview || undefined,
          mediaType: 'IMAGE',
        }),
      });

      setContent('');
      setMediaPreview(null);
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao publicar no feed.');
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
          {/* Seletor de Evento */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Selecione o Evento
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="" disabled>-- Selecione um evento --</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-95"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Tirar Foto / Câmera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-95"
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
              className="w-full py-3.5 rounded-xl bg-ifam-green-700 hover:bg-ifam-green-800 text-white font-bold text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                'Publicando...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publicar no Feed do Evento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
