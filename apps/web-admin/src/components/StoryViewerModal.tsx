'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { EventItem } from '@ifam-eventos/types';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  events?: EventItem[];
  onSelectEvent?: (event: EventItem) => void;
}

export function StoryViewerModal({ isOpen, onClose, event, events, onSelectEvent }: StoryViewerModalProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Estados de feedback Toast e Modais Secundários
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Conteúdo Inadequado');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Carrega publicações do evento
  useEffect(() => {
    if (event && isOpen) {
      setLoading(true);
      setCurrentIndex(0);
      setProgress(0);
      setLiked(false);
      fetchApi<{ posts: any[] }>(`/events/${event.id}/posts`)
        .then((res) => {
          setPosts(res.posts || []);
        })
        .catch(() => setPosts([]))
        .finally(() => setLoading(false));
    }
  }, [event, isOpen]);

  // Função centralizada para avançar (Post Atual -> Próximo Post -> Próximo Evento -> Fechar)
  const handleNext = () => {
    setLiked(false);
    setProgress(0);
    if (posts.length > 0 && currentIndex < posts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (events && onSelectEvent && event) {
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
    setLiked(false);
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (events && onSelectEvent && event) {
      const currentIdx = events.findIndex((e) => e.id === event.id);
      if (currentIdx > 0) {
        onSelectEvent(events[currentIdx - 1]);
      }
    }
  };

  // Timer com Animação de Progresso Fluido (5s para posts, 3s para eventos sem foto)
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
  }, [isOpen, loading, posts.length, currentIndex, isPaused, reportModalOpen, event?.id]);

  if (!isOpen || !event) return null;

  const currentPost = posts[currentIndex];

  // Verifica permissão para moderação (Autor do post, Criador do Evento ou Admin)
  const isAuthor = user && currentPost && user.id === currentPost.userId;
  const isEventOrganizer = user && user.id === event.organizerId;
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
        a.download = `ifam-story-${event.slug}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Post apenas texto: baixa cartão formatado
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
    const shareUrl = `${window.location.origin}/eventos/${event.slug}`;
    const shareData = {
      title: event.title,
      text: currentPost?.content ? `"${currentPost.content}" - ${event.title}` : `Confira o evento ${event.title} no IFAM Eventos!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Usuário cancelou ou navegador bloqueou
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('🔗 Link do evento copiado para a área de transferência!');
      } catch {
        showToast('Não foi possível copiar o link.');
      }
    }
  };

  // 3. Exportar para Instagram Story 9:16 (Canvas 1080x1920 - Premium Visual Identity)
  const handleExportInstagramStory = async () => {
    if (!event || !currentPost) return;

    // 1. Carrega e garante a decodificação da foto ANTES de iniciar o Canvas
    let loadedImg: HTMLImageElement | null = null;

    if (currentPost.mediaUrl) {
      loadedImg = await new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = currentPost.mediaUrl;
      });
    }

    // Fallback de segurança para elemento do DOM
    if (!loadedImg || loadedImg.naturalWidth === 0) {
      const domImg = document.getElementById('current-story-img') as HTMLImageElement;
      if (domImg && domImg.naturalWidth > 0) {
        loadedImg = domImg;
      }
    }

    // 2. Prepara o Canvas nativo 1080x1920
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fundo Gradiente Institucional Imersivo IFAM (Escuro Esmeralda Deep)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGradient.addColorStop(0, '#01150f');
    bgGradient.addColorStop(0.35, '#04382b');
    bgGradient.addColorStop(0.75, '#064e3b');
    bgGradient.addColorStop(1, '#021a12');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Orbe de Luz Superior Direita (Efeito Neon Esmeralda)
    const topGlow = ctx.createRadialGradient(900, 150, 0, 900, 150, 500);
    topGlow.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
    topGlow.addColorStop(1, 'rgba(1, 21, 15, 0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, 1080, 1920);

    // Orbe de Luz Inferior Esquerda (Efeito Neon Verde Água)
    const bottomGlow = ctx.createRadialGradient(180, 1750, 0, 180, 1750, 550);
    bottomGlow.addColorStop(0, 'rgba(52, 211, 153, 0.16)');
    bottomGlow.addColorStop(1, 'rgba(1, 21, 15, 0)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, 0, 1080, 1920);

    // Selo Superior: IFAM EVENTOS (y=45)
    ctx.save();
    ctx.beginPath();
    const headerPillGradient = ctx.createLinearGradient(300, 45, 780, 45);
    headerPillGradient.addColorStop(0, '#059669');
    headerPillGradient.addColorStop(1, '#10B981');
    ctx.fillStyle = headerPillGradient;
    ctx.roundRect(300, 45, 480, 64, [32]);
    ctx.fill();
    ctx.strokeStyle = '#6EE7B7';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏛️  IFAM EVENTOS', 540, 88);
    ctx.restore();

    // Título do Evento com Subtítulo Institucional (y=155)
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;
    ctx.fillText(event.title.toUpperCase(), 540, 160, 960);
    ctx.restore();

    // Área da Foto Principal (980px de largura x 1260px de altura)
    const photoX = 50;
    const photoY = 195;
    const photoW = 980;
    const photoH = 1260;
    const radius = 36;

    if (loadedImg && loadedImg.naturalWidth > 0) {
      ctx.save();
      // Path de corte seguro com arcos universais
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

      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';

      // Object-fit cover em canvas
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

      // Moldura Verde Institucional com Destaque
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
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
    } else {
      // Sem Imagem: Card Elegante de Texto Escuro
      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, [radius]);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'italic font-serif 52px sans-serif';
      ctx.textAlign = 'center';

      const contentText = currentPost?.content || `Presença confirmada no ${event.title}!`;
      ctx.fillText(`"${contentText}"`, 540, 750, 900);
      ctx.restore();
    }

    // Legenda Flutuante em Card Branco Glassmorphic de Alto Contraste (y=1370)
    if (currentPost?.content && loadedImg && loadedImg.naturalWidth > 0) {
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(80, 1370, 920, 90, [26]);
      ctx.fill();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 14;

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      const displayCaption = currentPost.content.length > 50 ? `${currentPost.content.substring(0, 47)}...` : currentPost.content;
      ctx.fillText(`💬  "${displayCaption}"`, 540, 1426, 880);
      ctx.restore();
    }

    // Rodapé Institucional: Hashtags & Marca d'Água Oficial IFAM
    ctx.save();

    // Hashtags Oficiais
    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText('#IFAMEventos   •   #InstitutoFederal', 540, 1630);

    // Marca d'água oficial do Instituto Federal do Amazonas no rodapé da imagem
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('INSTITUTO FEDERAL DO AMAZONAS  •  IFAM', 540, 1750);
    ctx.restore();

    // Baixa a imagem gerada
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `story-instagram-ifam-${event.slug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('📸 Story 9:16 gerado para o Instagram! Confira seus downloads.');
  };

  // 4. Denúncia por Participante
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost) return;

    setSubmittingReport(true);
    try {
      await fetchApi(`/events/posts/${currentPost.id}/report`, {
        method: 'POST',
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails,
        }),
      });

      setReportModalOpen(false);
      setReportDetails('');
      showToast('🚩 Denúncia enviada aos moderadores do campus.');
    } catch (err: any) {
      showToast(err.message || 'Erro ao enviar denúncia.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // 5. Exclusão / Moderação por Admin ou Criador
  const handleDeletePost = async () => {
    if (!currentPost) return;
    if (!confirm('Deseja realmente remover esta publicação do feed do evento?')) return;

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
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="absolute top-5 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce border border-emerald-400">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div
        className="relative w-full max-w-sm h-full sm:h-[650px] bg-slate-950 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-slate-800 text-white select-none"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Barra de Progresso Superior com Animação Viva */}
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

          {/* Cabeçalho do Story (Usuário Autor & Evento & Botões de Ação) */}
          <div className="flex items-center justify-between pt-1 pointer-events-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-emerald-500 to-ifam-green-600 p-[2px] shrink-0">
                {currentPost?.user?.avatarUrl ? (
                  <img
                    src={currentPost.user.avatarUrl}
                    alt={currentPost.user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-ifam-green-700 text-white flex items-center justify-center text-[10px] font-bold">
                    {currentPost?.user?.name?.charAt(0) || event.title.charAt(0)}
                  </div>
                )}
              </div>

              <div className="truncate max-w-[130px]">
                <p className="text-xs font-extrabold text-white truncate">
                  {currentPost ? currentPost.user?.name || 'Participante' : event.title}
                </p>
                <p className="text-[10px] text-slate-300 truncate">{event.title}</p>
              </div>
            </div>

            {/* Ações Rápidas do Topo (Download, Share, Instagram, Denúncia/Exclusão, Fechar) */}
            <div className="flex items-center gap-1">
              {currentPost && (
                <>
                  {/* Botão Baixar Mídia */}
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-full bg-black/40 text-slate-200 hover:text-white hover:bg-black/80 transition"
                    title="Baixar Imagem"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Botão Compartilhar */}
                  <button
                    onClick={handleShare}
                    className="p-1.5 rounded-full bg-black/40 text-slate-200 hover:text-white hover:bg-black/80 transition"
                    title="Compartilhar Link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {/* Botão Instagram Story 9:16 */}
                  <button
                    onClick={handleExportInstagramStory}
                    className="p-1.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white hover:scale-110 transition active:scale-95 shadow-xs"
                    title="Gerar Cartão Instagram Story (9:16)"
                  >
                    <Instagram className="w-4 h-4" />
                  </button>

                  {/* Botão de Moderação (Se for Admin/Organizador) ou Denúncia (Se for usuário comum) */}
                  {canModerate ? (
                    <button
                      onClick={handleDeletePost}
                      className="p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-700 transition"
                      title="Excluir Publicação (Moderador)"
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

        {/* Conteúdo Principal do Story */}
        <div className="relative flex-1 flex items-center justify-center bg-slate-900">
          {loading ? (
            <div className="text-center py-10 text-slate-400">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Carregando stories...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <img
                src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
                alt={event.title}
                className="absolute inset-0 w-full h-full object-cover opacity-25 blur-xs"
              />
              <div className="relative z-10 space-y-3 max-w-xs">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-extrabold text-white">{event.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ainda não há fotos publicadas no feed deste evento. Seja o primeiro a postar um Story!
                </p>
                <p className="text-[10px] text-amber-400 font-semibold pt-2">
                  Avançando para o próximo evento...
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

              {/* Legenda Sobreposta */}
              {currentPost.mediaUrl && currentPost.content && (
                <div className="absolute bottom-0 left-0 right-0 p-4 pb-5 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-20 pointer-events-none">
                  <p className="text-xs text-white leading-relaxed line-clamp-3 font-medium">
                    {currentPost.content}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navegação Esquerda / Direita */}
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

        {/* Rodapé: Curtida + Link para Detalhes */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 z-30 flex items-center gap-2">
          {posts.length > 0 && (
            <button
              onClick={() => setLiked(!liked)}
              className={`p-2.5 rounded-xl border transition active:scale-125 ${
                liked
                  ? 'bg-red-500/20 border-red-500 text-red-500'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Curtir Story"
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            </button>
          )}

          <Link
            href={`/eventos/${event.slug}`}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-ifam-green-700 hover:bg-ifam-green-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Ver Detalhes do Evento</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Modal Secundário: Denunciar Publicação */}
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

