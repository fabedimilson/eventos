'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MessageSquare,
  Heart,
  Download,
  Share2,
  Instagram,
  Flag,
  Trash2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { EventItem, HighlightItem } from '@ifam-eventos/types';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: EventItem | null;
  highlight?: HighlightItem | null;
  is24hMode?: boolean;
  customTitle?: string;
  events?: EventItem[];
  highlights?: HighlightItem[];
  onSelectEvent?: (event: EventItem) => void;
  onSelectHighlight?: (highlight: HighlightItem) => void;
}

export function StoryViewerModal({
  isOpen,
  onClose,
  event,
  highlight,
  is24hMode,
  customTitle,
  events,
  highlights,
  onSelectEvent,
  onSelectHighlight,
}: StoryViewerModalProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Estados de curtidas por post
  const [likesCountMap, setLikesCountMap] = useState<Record<string, number>>({});
  const [userLikesMap, setUserLikesMap] = useState<Record<string, boolean>>({});

  // Estados de feedback Toast e Modais Secundários
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Conteúdo Inadequado');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const currentPost = posts[currentIndex];

  // Sincroniza curtidas do post atual
  useEffect(() => {
    if (currentPost) {
      const initialCount = currentPost._count?.likes ?? (likesCountMap[currentPost.id] || 0);
      const isUserLiked = user
        ? (currentPost.likes?.some((l: any) => l.userId === user.id) || !!userLikesMap[currentPost.id])
        : false;

      setLikesCountMap((prev) => ({ ...prev, [currentPost.id]: initialCount }));
      setUserLikesMap((prev) => ({ ...prev, [currentPost.id]: isUserLiked }));
    }
  }, [currentPost?.id, user?.id]);

  const handleToggleLike = async () => {
    if (!currentPost) return;
    if (!user) {
      showToast('🔒 Faça login para curtir este story!');
      return;
    }

    const currentLiked = userLikesMap[currentPost.id] || false;
    const currentCount = likesCountMap[currentPost.id] || 0;

    const newLiked = !currentLiked;
    const newCount = newLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    setUserLikesMap((prev) => ({ ...prev, [currentPost.id]: newLiked }));
    setLikesCountMap((prev) => ({ ...prev, [currentPost.id]: newCount }));

    try {
      const res = await fetchApi<{ liked: boolean; likesCount: number }>(`/events/posts/${currentPost.id}/like`, {
        method: 'POST',
      });
      setUserLikesMap((prev) => ({ ...prev, [currentPost.id]: res.liked }));
      setLikesCountMap((prev) => ({ ...prev, [currentPost.id]: res.likesCount }));
    } catch {
      setUserLikesMap((prev) => ({ ...prev, [currentPost.id]: currentLiked }));
      setLikesCountMap((prev) => ({ ...prev, [currentPost.id]: currentCount }));
    }
  };

  const title = customTitle || (highlight ? highlight.title : event ? event.title : 'Story');
  const bannerUrl = highlight?.coverUrl || event?.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
  const slug = event?.slug;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Carrega publicações do evento, destaque ou 24h ativos
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setCurrentIndex(0);
    setProgress(0);

    if (is24hMode) {
      fetchApi<{ posts: any[] }>('/events/stories/active')
        .then((res) => {
          setPosts(res.posts || []);
        })
        .catch(() => setPosts([]))
        .finally(() => setLoading(false));
    } else if (highlight) {
      fetchApi<{ posts: any[] }>(`/highlights/${highlight.id}/posts`)
        .then((res) => {
          setPosts(res.posts || []);
        })
        .catch(() => setPosts([]))
        .finally(() => setLoading(false));
    } else if (event) {
      fetchApi<{ posts: any[] }>(`/events/${event.id}/posts`)
        .then((res) => {
          setPosts(res.posts || []);
        })
        .catch(() => setPosts([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [event?.id, highlight?.id, is24hMode, isOpen]);

  // Função centralizada para avançar
  const handleNext = () => {
    setProgress(0);
    if (posts.length > 0 && currentIndex < posts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (highlight && highlights && onSelectHighlight) {
        const currentIdx = highlights.findIndex((h) => h.id === highlight.id);
        if (currentIdx >= 0 && currentIdx < highlights.length - 1) {
          onSelectHighlight(highlights[currentIdx + 1]);
          return;
        }
      }
      if (event && events && onSelectEvent) {
        const currentIdx = events.findIndex((e) => e.id === event.id);
        if (currentIdx >= 0 && currentIdx < events.length - 1) {
          onSelectEvent(events[currentIdx + 1]);
          return;
        }
      }
      onClose();
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (highlight && highlights && onSelectHighlight) {
      const currentIdx = highlights.findIndex((h) => h.id === highlight.id);
      if (currentIdx > 0) {
        onSelectHighlight(highlights[currentIdx - 1]);
      }
    } else if (event && events && onSelectEvent) {
      const currentIdx = events.findIndex((e) => e.id === event.id);
      if (currentIdx > 0) {
        onSelectEvent(events[currentIdx - 1]);
      }
    }
  };

  // Timer com Animação de Progresso Fluido
  useEffect(() => {
    if (!isOpen || loading || isPaused || reportModalOpen) return;

    const isNoPosts = posts.length === 0;
    const step = isNoPosts ? 3.33 : 1;
    const intervalTime = 50;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isOpen, loading, posts.length, currentIndex, isPaused, reportModalOpen, event?.id, highlight?.id, is24hMode]);

  if (!isOpen || (!event && !highlight && !is24hMode)) return null;

  const isAuthor = user && currentPost && user.id === currentPost.userId;
  const isEventOrganizer = user && event && user.id === event.organizerId;
  const isAdmin = user && (user.role === 'ADMIN_MASTER' || user.role === 'ADMIN_UNIDADE');
  const canModerate = isAuthor || isEventOrganizer || isAdmin;

  // 1. Download de Mídia
  const handleDownload = async () => {
    if (!currentPost) return;
    try {
      if (currentPost.mediaUrl) {
        const res = await fetch(currentPost.mediaUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ifam-story-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        handleExportInstagramStory();
        return;
      }
      showToast('📥 Mídia salva nos seus downloads!');
    } catch {
      showToast('Erro ao baixar mídia. Tente novamente.');
    }
  };

  // 2. Compartilhar via Web Share API ou Copiar Link
  const handleShare = async () => {
    const shareUrl = slug ? `${window.location.origin}/eventos/${slug}` : window.location.href;
    const shareData = {
      title,
      text: currentPost?.content ? `"${currentPost.content}" - ${title}` : `Confira os destaques no IFAM!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('🔗 Link copiado para a área de transferência!');
      } catch {
        showToast('Não foi possível copiar o link.');
      }
    }
  };

  // 3. Exportar para Instagram Story 9:16
  const handleExportInstagramStory = async () => {
    if (!currentPost) return;

    let loadedImg: HTMLImageElement | null = null;
    if (currentPost.mediaUrl) {
      loadedImg = await new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = currentPost.mediaUrl;
      });
    }

    if (!loadedImg || loadedImg.naturalWidth === 0) {
      const domImg = document.getElementById('current-story-img') as HTMLImageElement;
      if (domImg && domImg.naturalWidth > 0) {
        loadedImg = domImg;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgGradient = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGradient.addColorStop(0, '#01150f');
    bgGradient.addColorStop(0.35, '#04382b');
    bgGradient.addColorStop(0.75, '#064e3b');
    bgGradient.addColorStop(1, '#021a12');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1920);

    const topGlow = ctx.createRadialGradient(900, 150, 0, 900, 150, 500);
    topGlow.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
    topGlow.addColorStop(1, 'rgba(1, 21, 15, 0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.save();
    ctx.beginPath();
    const headerPillGradient = ctx.createLinearGradient(300, 45, 780, 45);
    headerPillGradient.addColorStop(0, '#059669');
    headerPillGradient.addColorStop(1, '#10B981');
    ctx.fillStyle = headerPillGradient;
    ctx.roundRect(300, 45, 480, 64, [32]);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏛️  UNIFIK ACADÊMICO', 540, 88);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 14;
    ctx.fillText(title.toUpperCase(), 540, 160, 960);
    ctx.restore();

    const photoX = 50;
    const photoY = 195;
    const photoW = 980;
    const photoH = 1260;
    const radius = 36;

    if (loadedImg && loadedImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(photoX + radius, photoY);
      ctx.lineTo(photoX + photoW - radius, photoY);
      ctx.quadraticCurveTo(photoX + photoW, photoY, photoX + photoW, photoY + radius);
      ctx.lineTo(photoX + photoW, photoY + photoH - radius);
      ctx.quadraticCurveTo(photoX + photoW, photoY + photoH, photoX + photoW - radius, photoY + photoH);
      ctx.lineTo(photoX + radius, photoY + photoH);
      ctx.quadraticCurveTo(photoX, photoY + photoH, photoX, photoY + photoH - radius);
      ctx.lineTo(photoX, photoY + radius);
      ctx.quadraticCurveTo(photoX, photoY, photoX + radius, photoY);
      ctx.closePath();
      ctx.clip();

      const naturalW = loadedImg.naturalWidth;
      const naturalH = loadedImg.naturalHeight;
      const imgAspect = naturalW / naturalH;
      const targetAspect = photoW / photoH;
      let renderW = photoW;
      let renderH = photoH;
      let offsetX = photoX;
      let offsetY = photoY;

      if (imgAspect > targetAspect) {
        renderW = photoH * imgAspect;
        offsetX = photoX - (renderW - photoW) / 2;
      } else {
        renderH = photoW / imgAspect;
        offsetY = photoY - (renderH - photoH) / 2;
      }

      ctx.drawImage(loadedImg, offsetX, offsetY, renderW, renderH);
      ctx.restore();
    }

    if (currentPost?.content && loadedImg && loadedImg.naturalWidth > 0) {
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(80, 1370, 920, 90, [26]);
      ctx.fill();

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      const displayCaption = currentPost.content.length > 50 ? `${currentPost.content.substring(0, 47)}...` : currentPost.content;
      ctx.fillText(`💬  "${displayCaption}"`, 540, 1426, 880);
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('#Unifik   •   #InstitutoFederal', 540, 1630);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('UNIFIK  •  ECOSSISTEMA ACADÊMICO', 540, 1750);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `story-unifik-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('📸 Story 9:16 gerado para o Instagram! Confira seus downloads.');
  };

  // 4. Denúncia por Participante
  const handleOpenReportModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      showToast('🔒 Faça login para denunciar esta publicação aos moderadores.');
      return;
    }
    setIsPaused(true);
    setReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setReportModalOpen(false);
    setIsPaused(false);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentPost) return;
    if (!user) {
      showToast('🔒 Faça login para denunciar esta publicação.');
      handleCloseReportModal();
      return;
    }

    setSubmittingReport(true);
    try {
      await fetchApi(`/events/posts/${currentPost.id}/report`, {
        method: 'POST',
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails,
        }),
      });

      handleCloseReportModal();
      setReportDetails('');
      showToast('🚩 Denúncia enviada aos moderadores do campus.');
    } catch (err: any) {
      showToast(err.message || 'Erro ao enviar denúncia.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // 5. Exclusão / Moderação
  const handleDeletePost = async () => {
    if (!currentPost) return;
    if (!confirm('Deseja realmente remover esta publicação?')) return;

    try {
      await fetchApi(`/events/posts/${currentPost.id}`, {
        method: 'DELETE',
      });

      const updatedPosts = posts.filter((p) => p.id !== currentPost.id);
      setPosts(updatedPosts);

      if (updatedPosts.length === 0) {
        onClose();
      } else {
        setCurrentIndex((prev) => (prev >= updatedPosts.length ? 0 : prev));
      }

      showToast('🗑️ Publicação removida com sucesso.');
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover publicação.');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-fade-in cursor-pointer"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-5 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce border border-emerald-400">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm h-full sm:h-[650px] bg-slate-950 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-slate-800 text-white select-none cursor-default"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Barra de Progresso Superior */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent space-y-2 pointer-events-none">
          {posts.length > 0 ? (
            <div className="flex gap-1.5 w-full">
              {posts.map((_, idx) => (
                <div key={idx} className="h-1 flex-1 rounded-full bg-slate-700/60 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-75 ease-linear"
                    style={{
                      width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-1 w-full bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Cabeçalho */}
          <div className="flex items-center justify-between pt-1 pointer-events-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-emerald-500 to-unifik-primary p-[2px] shrink-0">
                {currentPost?.user?.avatarUrl ? (
                  <img
                    src={currentPost.user.avatarUrl}
                    alt={currentPost.user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-unifik-primary text-white flex items-center justify-center text-[10px] font-bold">
                    {currentPost?.user?.name?.charAt(0) || title.charAt(0)}
                  </div>
                )}
              </div>

              <div className="truncate max-w-[160px]">
                <p className="text-xs font-extrabold text-white truncate">
                  {currentPost ? currentPost.user?.name || 'Participante' : title}
                </p>
                <p className="text-[10px] text-emerald-300 truncate font-medium">
                  {(() => {
                    if (!currentPost?.createdAt) return title;
                    const diffMs = Date.now() - new Date(currentPost.createdAt).getTime();
                    const mins = Math.floor(diffMs / 60000);
                    const hrs = Math.floor(diffMs / 3600000);
                    let agoText = 'agora mesmo';
                    if (mins >= 1 && mins < 60) agoText = `${mins}m atrás`;
                    else if (hrs >= 1) agoText = `${hrs}h atrás`;

                    const contextName = currentPost.event?.title || currentPost.highlight?.title || currentPost.user?.campus;
                    const is24hStory = !currentPost.highlightId;
                    const expText = is24hStory && hrs < 24 ? ` • expira em ${Math.max(1, 24 - hrs)}h` : '';

                    return contextName ? `${contextName} • ${agoText}${expText}` : `${agoText}${expText}`;
                  })()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {currentPost && (
                <>
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-full bg-black/40 text-slate-200 hover:text-white hover:bg-black/80 transition"
                    title="Baixar Imagem"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-1.5 rounded-full bg-black/40 text-slate-200 hover:text-white hover:bg-black/80 transition"
                    title="Compartilhar Link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleExportInstagramStory}
                    className="p-1.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white hover:scale-110 transition active:scale-95 shadow-xs"
                    title="Gerar Cartão Instagram Story (9:16)"
                  >
                    <Instagram className="w-4 h-4" />
                  </button>

                  {canModerate ? (
                    <button
                      onClick={handleDeletePost}
                      className="p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-700 transition"
                      title="Excluir Publicação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setReportModalOpen(true)}
                      className="p-1.5 rounded-full bg-black/40 text-amber-400 hover:bg-black/80 transition"
                      title="Denunciar Publicação"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black transition active:scale-95 ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="relative flex-1 flex items-center justify-center bg-slate-900">
          {loading ? (
            <div className="text-center py-10 text-slate-400">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Carregando stories...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <img
                src={bannerUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover opacity-25 blur-xs"
              />
              <div className="relative z-10 space-y-3 max-w-xs">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-extrabold text-white">{title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ainda não há fotos publicadas neste destaque. Seja o primeiro a publicar um Story!
                </p>
                <p className="text-[10px] text-amber-400 font-semibold pt-2">
                  Avançando para o próximo destaque...
                </p>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {currentPost.mediaUrl ? (
                <img
                  id="current-story-img"
                  src={currentPost.mediaUrl}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-8 text-center bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 w-full h-full flex flex-col items-center justify-center">
                  <p className="text-base font-bold text-white leading-relaxed italic">
                    "{currentPost.content}"
                  </p>
                </div>
              )}

              {currentPost.mediaUrl && currentPost.content && (
                <div className="absolute bottom-0 left-0 right-0 p-4 pb-5 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-20 pointer-events-none">
                  <p className="text-xs text-white leading-relaxed line-clamp-3 font-medium">
                    {currentPost.content}
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handlePrev}
            className="absolute left-2 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/60 transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/60 transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 z-30 flex items-center gap-2">
          {currentPost && (
            <button
              onClick={handleToggleLike}
              className={`px-3 py-2 rounded-xl border transition flex items-center gap-1.5 active:scale-110 shrink-0 ${
                userLikesMap[currentPost.id]
                  ? 'bg-red-500/20 border-red-500 text-red-500 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Curtir Story"
            >
              <Heart className={`w-4 h-4 ${userLikesMap[currentPost.id] ? 'fill-current text-red-500' : ''}`} />
              <span className="text-xs font-extrabold">{likesCountMap[currentPost.id] || 0}</span>
            </button>
          )}

          {slug ? (
            <Link
              href={`/eventos/${slug}`}
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Ver Detalhes do Evento</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Fechar Destaque</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal Secundário: Denúncia */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl max-w-xs w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Denunciar Publicação</span>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Motivo da Denúncia
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs"
                >
                  <option value="Conteúdo Inadequado">Conteúdo Inadequado / Impróprio</option>
                  <option value="Spam ou Propaganda">Spam ou Propaganda</option>
                  <option value="Discurso de Ódio">Discurso de Ódio / Ofensa</option>
                  <option value="Violação de Direitos">Violação de Direitos / Imagem</option>
                  <option value="Outro Motivo">Outro Motivo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Detalhes (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Descreva brevemente o problema..."
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                >
                  {submittingReport ? 'Enviando...' : 'Enviar Denúncia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
