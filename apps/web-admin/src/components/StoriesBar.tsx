'use client';

import React, { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { EventItem } from '@ifam-eventos/types';
import { CreatePostModal } from './CreatePostModal';
import { StoryViewerModal } from './StoryViewerModal';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

interface StoriesBarProps {
  events: EventItem[];
  onRefresh?: () => void;
}

export function StoriesBar({ events, onRefresh }: StoriesBarProps) {
  const { user } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedStoryEvent, setSelectedStoryEvent] = useState<EventItem | null>(null);

  const handleOpenCreate = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setCreateModalOpen(true);
  };

  return (
    <div className="w-full">
      {/* Fileira de Bolinhas (Carrossel Horizontal Alinhado à Direita no Desktop) */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-0.5 px-1 no-scrollbar justify-start md:justify-end">
        {/* Bolinha 1: Criar Novo Story / Post */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={handleOpenCreate}
            className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-emerald-500/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:scale-105 transition shadow-sm active:scale-95 group relative"
            title="Postar Foto ou Story"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-ifam-green-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              +
            </span>
          </button>
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate w-16 text-center">
            + Postar
          </span>
        </div>

        {/* Bolinhas dos Eventos Ativos */}
        {events.map((ev) => {
          // Formata o título de forma inteligente (ex: "I Feira" em vez de apenas "I")
          const words = ev.title.split(' ');
          let shortTitle = words[0];
          if (words[0].length <= 2 && words.length > 1) {
            shortTitle = `${words[0]} ${words[1]}`;
          }

          return (
            <div key={ev.id} className="flex flex-col items-center gap-1 shrink-0">
              <button
                onClick={() => setSelectedStoryEvent(ev)}
                className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-500 via-emerald-500 to-ifam-green-600 hover:scale-105 transition shadow-md active:scale-95"
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
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        events={events}
        onPostCreated={() => {
          if (onRefresh) onRefresh();
        }}
      />

      <StoryViewerModal
        isOpen={!!selectedStoryEvent}
        onClose={() => setSelectedStoryEvent(null)}
        event={selectedStoryEvent}
        events={events}
        onSelectEvent={(ev) => setSelectedStoryEvent(ev)}
      />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
