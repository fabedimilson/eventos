'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Bookmark, Pencil } from 'lucide-react';
import { EventItem, HighlightItem } from '@ifam-eventos/types';
import { CreatePostModal } from './CreatePostModal';
import { CreateHighlightModal } from './CreateHighlightModal';
import { StoryViewerModal } from './StoryViewerModal';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { fetchApi } from '../lib/api';

interface StoriesBarProps {
  events: EventItem[];
  onRefresh?: () => void;
}

export function StoriesBar({ events, onRefresh }: StoriesBarProps) {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [createHighlightModalOpen, setCreateHighlightModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedHighlightToEdit, setSelectedHighlightToEdit] = useState<HighlightItem | null>(null);

  const [selectedStoryEvent, setSelectedStoryEvent] = useState<EventItem | null>(null);
  const [selectedStoryHighlight, setSelectedStoryHighlight] = useState<HighlightItem | null>(null);

  const canManageHighlights =
    user &&
    (['ADMIN_MASTER', 'ADMIN_UNIDADE', 'SUPER_ADMIN'].includes(user.role) ||
      ['PROFESSOR', 'TECNICO', 'SERVIDOR', 'PESQUISADOR'].includes(user.category));

  const loadHighlights = async () => {
    try {
      const data = await fetchApi<{ highlights: HighlightItem[] }>('/highlights');
      setHighlights(data.highlights || []);
    } catch (err) {
      console.error('Erro ao carregar destaques:', err);
    }
  };

  useEffect(() => {
    loadHighlights();
  }, []);

  const handleOpenCreatePost = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setCreatePostModalOpen(true);
  };

  const handleOpenCreateHighlight = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedHighlightToEdit(null);
    setCreateHighlightModalOpen(true);
  };

  const handleEditHighlight = (e: React.MouseEvent, h: HighlightItem) => {
    e.stopPropagation();
    setSelectedHighlightToEdit(h);
    setCreateHighlightModalOpen(true);
  };

  // Filtra eventos que ainda não possuem um Destaque cadastrado
  const eventsWithoutHighlight = events.filter(
    (ev) => !highlights.some((h) => h.eventId === ev.id)
  );

  return (
    <div className="w-full">
      {/* Fileira de Bolinhas (Carrossel Horizontal Alinhado à Direita no Desktop) */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-0.5 px-1 no-scrollbar justify-start md:justify-end">
        {/* Bolinha 1: Criar Novo Story / Post */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={handleOpenCreatePost}
            className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-emerald-500/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:scale-105 transition shadow-sm active:scale-95 group relative"
            title="Postar Foto ou Story"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-unifik-primary text-white flex items-center justify-center text-xs font-bold shadow-xs">
              +
            </span>
          </button>
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate w-16 text-center">
            + Postar
          </span>
        </div>

        {/* Bolinha 2 (Se for Admin/Servidor): Criar Novo Destaque */}
        {canManageHighlights && (
          <div className="flex flex-col items-center gap-1 shrink-0">
            <button
              onClick={handleOpenCreateHighlight}
              className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-violet-500/60 flex items-center justify-center text-violet-600 dark:text-violet-400 hover:scale-105 transition shadow-sm active:scale-95 group relative"
              title="Criar Novo Destaque (Admin/Servidor)"
            >
              <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Bookmark className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                +
              </span>
            </button>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate w-16 text-center">
              + Destaque
            </span>
          </div>
        )}

        {/* Bolinhas dos Destaques Cadastrados (Independentes ou Vinculados a Evento) */}
        {highlights.map((h) => {
          const coverImage =
            h.coverUrl ||
            h.event?.bannerUrl ||
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300';

          return (
            <div key={h.id} className="flex flex-col items-center gap-1 shrink-0 relative group">
              <button
                onClick={() => {
                  setSelectedStoryHighlight(h);
                  setSelectedStoryEvent(null);
                }}
                className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-500 via-emerald-500 to-unifik-primary hover:scale-105 transition shadow-md active:scale-95"
              >
                <img
                  src={coverImage}
                  alt={h.title}
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                />
              </button>

              {/* Botão de Edição Rápida para Admins */}
              {canManageHighlights && (
                <button
                  onClick={(e) => handleEditHighlight(e, h)}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-emerald-400 opacity-0 group-hover:opacity-100 hover:scale-110 transition flex items-center justify-center shadow-lg"
                  title="Editar Destaque"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}

              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[70px] text-center">
                {h.title}
              </span>
            </div>
          );
        })}

        {/* Bolinhas de Eventos Ativos que ainda não têm um destaque cadastrado */}
        {eventsWithoutHighlight.map((ev) => {
          const words = ev.title.split(' ');
          let shortTitle = words[0];
          if (words[0].length <= 2 && words.length > 1) {
            shortTitle = `${words[0]} ${words[1]}`;
          }

          return (
            <div key={ev.id} className="flex flex-col items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  setSelectedStoryEvent(ev);
                  setSelectedStoryHighlight(null);
                }}
                className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-slate-400 via-emerald-500 to-violet-500 hover:scale-105 transition shadow-md active:scale-95 opacity-90"
              >
                <img
                  src={ev.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300'}
                  alt={ev.title}
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                />
              </button>
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[70px] text-center">
                {shortTitle}
              </span>
            </div>
          );
        })}
      </div>

      {/* Modais */}
      <CreatePostModal
        isOpen={createPostModalOpen}
        onClose={() => setCreatePostModalOpen(false)}
        events={events}
        highlights={highlights}
        onPostCreated={() => {
          loadHighlights();
          if (onRefresh) onRefresh();
        }}
        onOpenCreateHighlight={() => {
          setSelectedHighlightToEdit(null);
          setCreateHighlightModalOpen(true);
        }}
      />

      <CreateHighlightModal
        isOpen={createHighlightModalOpen}
        onClose={() => {
          setCreateHighlightModalOpen(false);
          setSelectedHighlightToEdit(null);
        }}
        events={events}
        highlightToEdit={selectedHighlightToEdit}
        onHighlightSaved={() => {
          loadHighlights();
          if (onRefresh) onRefresh();
        }}
      />

      <StoryViewerModal
        isOpen={!!selectedStoryEvent || !!selectedStoryHighlight}
        onClose={() => {
          setSelectedStoryEvent(null);
          setSelectedStoryHighlight(null);
        }}
        event={selectedStoryEvent}
        highlight={selectedStoryHighlight}
        events={events}
        highlights={highlights}
        onSelectEvent={(ev) => {
          setSelectedStoryHighlight(null);
          setSelectedStoryEvent(ev);
        }}
        onSelectHighlight={(h) => {
          setSelectedStoryEvent(null);
          setSelectedStoryHighlight(h);
        }}
      />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
