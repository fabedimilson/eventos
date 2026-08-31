'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Tv, Radio, ArrowRight } from 'lucide-react';
import { EventItem } from '@ifam-eventos/types';

interface EventCardProps {
  event: EventItem;
}

export function EventCard({ event }: EventCardProps) {
  const isHybridOrOnline = event.modality === 'ONLINE' || event.modality === 'HIBRIDO';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-100 dark:shadow-none hover:shadow-2xl hover:-translate-y-1 transition duration-300 flex flex-col group">
      {/* Imagem de Capa do Evento */}
      <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        {/* Badges de Modalidade */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-ifam-green-600 text-white shadow-lg backdrop-blur-md">
            {event.category || 'EVENTO IFAM'}
          </span>
          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase backdrop-blur-md shadow-lg ${
            event.modality === 'ONLINE'
              ? 'bg-blue-600 text-white'
              : event.modality === 'HIBRIDO'
              ? 'bg-purple-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}>
            {event.modality}
          </span>
        </div>

        {/* Banner de Transmissão Ao Vivo (se online/híbrido) */}
        {isHybridOrOnline && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[10px] font-bold flex items-center gap-1.5 animate-pulse shadow-md">
            <Radio className="w-3 h-3" />
            <span>Transmissão ao Vivo</span>
          </div>
        )}
      </div>

      {/* Corpo do Card */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-ifam-green-600 dark:text-ifam-green-400 mb-2">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(event.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-ifam-green-600 transition mb-2">
            {event.title}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {event.description}
          </p>
        </div>

        <div>
          <div className="space-y-2 mb-5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{event.location} - {event.campus}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{event.currentRegistrations || 0} inscritos / {event.capacity} vagas</span>
            </div>
          </div>

          {/* Botão de Ver Detalhes e Inscrição */}
          <Link
            href={`/eventos/${event.slug}`}
            className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-ifam-green-600 dark:hover:bg-ifam-green-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition duration-300 shadow-md group-hover:shadow-ifam-green-600/20"
          >
            <span>Garantir Vaga & Programação</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
