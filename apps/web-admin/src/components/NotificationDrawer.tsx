'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Ticket, X, Sparkles, Clock } from 'lucide-react';
import { NotificationItem } from '@ifam-eventos/types';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface NotificationDrawerProps {
  onOpenTicket?: (eventId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ onOpenTicket }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetchApi<{ notifications: NotificationItem[] }>('/events/user/notifications');
      setNotifications(res.notifications || []);
    } catch (err) {
      // Falhas de rede temporárias (ex: Render desativado ou inicializando) são tratadas silenciosamente
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // Polling a cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [user]);

  // Fecha popover ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id: string) => {
    try {
      await fetchApi(`/events/user/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  };

  const handleConfirmAttendance = async (eventId: string, notificationId: string) => {
    setLoading(true);
    try {
      await fetchApi(`/events/${eventId}/confirm-attendance`, { method: 'POST' });
      await handleMarkRead(notificationId);
      alert('Sua presença foi confirmada com sucesso! Aguardamos você no evento.');
      if (onOpenTicket) {
        onOpenTicket(eventId);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar presença.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BOTÃO DO SINO COM BADGE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
        title="Notificações e Follow-up"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white font-black text-[10px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN DE NOTIFICAÇÕES */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                Notificações e Follow-up 24h
              </span>
            </div>

            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                {unreadCount} nova(s)
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhuma notificação no momento.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 transition space-y-2 ${
                    !notif.isRead
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {new Date(notif.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Ações Específicas do Follow-up 24h */}
                  {notif.type === 'REMINDER_24H' && notif.eventId && (
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleConfirmAttendance(notif.eventId!, notif.id)}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-extrabold text-[11px] shadow-sm transition flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Confirmar Presença</span>
                      </button>

                      {onOpenTicket && (
                        <button
                          onClick={() => {
                            handleMarkRead(notif.id);
                            onOpenTicket(notif.eventId!);
                            setIsOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition flex items-center gap-1.5"
                        >
                          <Ticket className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Ver Pass</span>
                        </button>
                      )}
                    </div>
                  )}

                  {!notif.isRead && notif.type !== 'REMINDER_24H' && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Marcar como lida
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
