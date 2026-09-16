'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Calendar, MapPin, Sparkles, Check, Copy } from 'lucide-react';
import { RegistrationItem } from '@ifam-eventos/types';
import { useAuth } from '../context/AuthContext';

interface TicketPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: RegistrationItem | null;
}

export const TicketPassModal: React.FC<TicketPassModalProps> = ({
  isOpen,
  onClose,
  registration,
}) => {
  const { user: authUser } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !registration) return null;

  const event = registration.event;
  const user = {
    ...registration.user,
    avatarUrl: registration.user?.avatarUrl || authUser?.avatarUrl,
    name: registration.user?.name || authUser?.name || 'Participante',
    category: registration.user?.category || authUser?.category || 'EXTERNO',
    campus: registration.user?.campus || authUser?.campus,
  };
  const qrData = JSON.stringify({
    code: registration.code,
    eventId: registration.eventId,
    userId: registration.userId,
    userName: user?.name,
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(registration.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = 2;
      const w = 420 * scale;
      const h = 590 * scale;
      canvas.width = w;
      canvas.height = h;
      ctx.scale(scale, scale);

      // Função auxiliar para quebra de texto elegante
      const wrapTextCanvas = (
        context: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number
      ) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            context.fillText(line.trim(), x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        context.fillText(line.trim(), x, currentY);
        return currentY;
      };

      // Função de retângulo arredondado
      const drawRoundRect = (
        c: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
      ) => {
        c.beginPath();
        c.moveTo(x + radius, y);
        c.lineTo(x + width - radius, y);
        c.quadraticCurveTo(x + width, y, x + width, y + radius);
        c.lineTo(x + width, y + height - radius);
        c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        c.lineTo(x + radius, y + height);
        c.quadraticCurveTo(x, y + height, x, y + height - radius);
        c.lineTo(x, y + radius);
        c.quadraticCurveTo(x, y, x + radius, y);
        c.closePath();
      };

      // 1. Fundo do Pass (Gradiente Profundo Cyber Dark)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 590);
      bgGrad.addColorStop(0, '#04160e');
      bgGrad.addColorStop(0.3, '#081119');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      drawRoundRect(ctx, 0, 0, 420, 590, 24);
      ctx.fill();

      // Borda Neon Esmeralda Externa
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      drawRoundRect(ctx, 0, 0, 420, 590, 24);
      ctx.stroke();

      // Barra Holográfica Superior
      const holoGrad = ctx.createLinearGradient(0, 0, 420, 0);
      holoGrad.addColorStop(0, '#10b981');
      holoGrad.addColorStop(0.5, '#34d399');
      holoGrad.addColorStop(1, '#059669');
      ctx.fillStyle = holoGrad;
      ctx.fillRect(15, 0, 390, 4);

      // 2. ELEMENTOS GEOMÉTRICOS VETORIAIS FLUTUANTES NO FUNDO
      ctx.save();

      // Hachuras Diagonais
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.22)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(15 + i * 8, 14);
        ctx.lineTo(35 + i * 8, 42);
        ctx.stroke();
      }

      // Arcos Concêntricos (Radar Arcs) Superior Direito
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(385, 75, 38, Math.PI * 0.7, Math.PI * 1.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(385, 75, 24, Math.PI * 0.7, Math.PI * 1.6);
      ctx.stroke();

      // Círculo com Ponteiro / Teardrop Pin
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
      ctx.beginPath();
      ctx.arc(40, 160, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(52, 211, 153, 0.25)';
      ctx.beginPath();
      ctx.moveTo(28, 152);
      ctx.lineTo(18, 142);
      ctx.lineTo(34, 144);
      ctx.closePath();
      ctx.fill();

      // Losango com Ponto Central
      ctx.save();
      ctx.translate(380, 235);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-12, -12, 24, 24);
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Fatia Geométrica (Wedge)
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(380, 330);
      ctx.lineTo(365, 360);
      ctx.arc(380, 330, 32, Math.PI * 0.65, Math.PI * 0.35, true);
      ctx.lineTo(380, 330);
      ctx.stroke();

      // Meia-Lua / Crescente
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(385, 285, 22, 0, Math.PI * 2);
      ctx.arc(393, 285, 18, 0, Math.PI * 2, true);
      ctx.fill();

      // Círculos Vazados Flutuantes
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(28, 265, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(390, 460, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(38, 480, 14, 0, Math.PI * 2);
      ctx.stroke();

      // Chevron Angulado Grande na Esquerda
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, 340);
      ctx.lineTo(38, 375);
      ctx.lineTo(8, 410);
      ctx.stroke();

      // 3. WATERMARK GIGANTE "PASS" COM BORDAS VAZADAS E FUNDO TRANSPARENTE
      ctx.font = '900 96px system-ui, -apple-system, sans-serif';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.14)';
      ctx.lineWidth = 2.5;
      ctx.strokeText('PASS', 130, 275);

      ctx.restore(); // Fim dos elementos gráficos

      // 4. Header do Evento
      const headerGrad = ctx.createLinearGradient(0, 0, 420, 145);
      headerGrad.addColorStop(0, 'rgba(6, 78, 59, 0.98)');
      headerGrad.addColorStop(1, 'rgba(4, 47, 46, 0.92)');
      ctx.fillStyle = headerGrad;

      ctx.beginPath();
      ctx.moveTo(0, 24);
      ctx.quadraticCurveTo(0, 0, 24, 0);
      ctx.lineTo(396, 0);
      ctx.quadraticCurveTo(420, 0, 420, 24);
      ctx.lineTo(420, 145);
      ctx.lineTo(0, 145);
      ctx.closePath();
      ctx.fill();

      // Borda divisória do header
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 144, 420, 1.5);

      // Badge Topo: PASS OFICIAL IFAM
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
      drawRoundRect(ctx, 18, 14, 185, 24, 12);
      ctx.fill();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.2;
      drawRoundRect(ctx, 18, 14, 185, 24, 12);
      ctx.stroke();

      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.fillText('✦ IFAM • OFFICIAL EVENT PASS', 28, 30);

      // Título do Evento MAIOR e com destaque
      ctx.fillStyle = '#ffffff';
      const eventTitle = event?.title || 'Evento IFAM';
      ctx.font = eventTitle.length > 50 ? 'bold 15px system-ui, -apple-system, sans-serif' : 'bold 16px system-ui, -apple-system, sans-serif';
      
      const lastY = wrapTextCanvas(ctx, eventTitle, 18, 58, 384, 21);

      // Data e Local mais nítidos
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      const dateStr = event?.startDate ? new Date(event.startDate).toLocaleDateString('pt-BR') : '';
      const locStr = (event?.locationName || 'IFAM Campus Manaus Centro');
      ctx.fillText(`📅 ${dateStr}   📍 ${locStr}`, 18, Math.max(lastY + 22, 130));

      // 5. Notches e Linha Pontilhada estilo Ticket VIP
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(0, 155, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(420, 155, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(18, 155);
      ctx.lineTo(402, 155);
      ctx.stroke();
      ctx.setLineDash([]);

      // 6. Card do Participante (Com Foto / Avatar Real)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      drawRoundRect(ctx, 18, 166, 384, 82, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1.2;
      drawRoundRect(ctx, 18, 166, 384, 82, 14);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
      ctx.fillText('PARTICIPANTE AUTORIZADO', 90, 186);
      ctx.fillText('VÍNCULO', 275, 186);

      // Nome do Participante
      const fullName = user?.name || 'Participante';
      ctx.fillStyle = '#f8fafc';
      ctx.font = fullName.length > 25 ? 'bold 13px system-ui, -apple-system, sans-serif' : 'bold 14px system-ui, -apple-system, sans-serif';
      wrapTextCanvas(ctx, fullName, 90, 205, 175, 16);

      // Badge Vínculo
      ctx.fillStyle = 'rgba(6, 78, 59, 0.9)';
      drawRoundRect(ctx, 270, 194, 118, 24, 8);
      ctx.fill();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.2;
      drawRoundRect(ctx, 270, 194, 118, 24, 8);
      ctx.stroke();
      
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText((user?.category || 'EXTERNO'), 280, 210);

      if (user?.campus) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 9.5px system-ui, -apple-system, sans-serif';
        ctx.fillText(`Campus: ${user.campus}`, 90, 238);
      }

      // Função de desenho do Avatar do Usuário no Canvas (Aumentado)
      const drawAvatarAndProceed = (onComplete: () => void) => {
        const fallbackAvatar = () => {
          ctx.save();
          ctx.fillStyle = '#064e3b';
          ctx.beginPath();
          ctx.arc(52, 207, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#6ee7b7';
          ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText((user?.name ? user.name.charAt(0).toUpperCase() : 'P'), 52, 214);
          ctx.restore();
          onComplete();
        };

        if (user?.avatarUrl) {
          const avImg = new Image();
          avImg.crossOrigin = 'anonymous';
          avImg.onload = () => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(52, 207, 26, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avImg, 26, 181, 52, 52);
            ctx.restore();

            // Borda elegante iluminada
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(52, 207, 26, 0, Math.PI * 2);
            ctx.stroke();
            onComplete();
          };
          avImg.onerror = () => {
            fallbackAvatar();
          };
          avImg.src = user.avatarUrl;
        } else {
          fallbackAvatar();
        }
      };

      // 7. Renderização com Avatar e QR Code
      drawAvatarAndProceed(() => {
        const svgElement = document.getElementById('pass-qr-svg');
        if (svgElement) {
          const svgString = new XMLSerializer().serializeToString(svgElement);
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const URL = window.URL || window.webkitURL || window;
          const blobURL = URL.createObjectURL(svgBlob);
          const img = new Image();
          img.onload = () => {
            // Caixa Branca do QR Code maior
            ctx.fillStyle = '#ffffff';
            drawRoundRect(ctx, 120, 256, 180, 180, 18);
            ctx.fill();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            drawRoundRect(ctx, 120, 256, 180, 180, 18);
            ctx.stroke();

            // Desenha o QR Code preenchendo a caixa
            ctx.drawImage(img, 130, 266, 160, 160);

            // Código Único de Entrada em Bloco Grande
            ctx.fillStyle = '#06130d';
            drawRoundRect(ctx, 50, 448, 320, 48, 14);
            ctx.fill();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1.5;
            drawRoundRect(ctx, 50, 448, 320, 48, 14);
            ctx.stroke();

            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CÓDIGO ÚNICO DE ACESSO E ENTRADA', 210, 464);

            ctx.fillStyle = '#34d399';
            ctx.font = 'bold 18px monospace';
            ctx.fillText(registration.code, 210, 486);

            // Selo de Autenticidade Digital com Tipografia Clara
            ctx.fillStyle = '#cbd5e1';
            ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
            ctx.fillText('Apresente este QR Code no credenciamento do evento.', 210, 520);

            ctx.fillStyle = '#34d399';
            ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
            ctx.fillText('🛡️ CREDENCIAL DIGITAL OFICIAL • IFAM EVENTOS', 210, 545);

            ctx.fillStyle = '#64748b';
            ctx.font = '9px system-ui, -apple-system, sans-serif';
            ctx.fillText('Instituto Federal de Educação, Ciência e Tecnologia do Amazonas', 210, 568);

            // Dispara o download da imagem PNG
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `pass-ifam-${registration.code || 'ingresso'}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(blobURL);
            setDownloading(false);
          };
          img.src = blobURL;
        }
      });
    } catch (e) {
      console.error('Erro ao gerar imagem:', e);
      setDownloading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in cursor-pointer"
    >
      {/* CARD DO PASS: Altura contida e footer fixo para NUNCA cortar botões em notebooks */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] max-h-[92vh] flex flex-col bg-slate-950 rounded-3xl shadow-[0_20px_60px_-15px_rgba(16,185,129,0.35)] border border-emerald-500/40 text-white overflow-hidden my-auto cursor-default animate-scale-in"
      >
        {/* BARRA HOLOGRÁFICA NO TOPO */}
        <div className="w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-500 flex-shrink-0" />

        {/* CABEÇALHO DO EVENTO (FIXO NO TOPO) */}
        <div className="relative p-3.5 text-white overflow-hidden bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border-b border-emerald-500/20 flex-shrink-0">
          <div className="flex items-center justify-between relative z-10 mb-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-400/50 bg-emerald-950/70 text-[10px] font-black text-emerald-300 tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>CREDENCIAL OFICIAL • IFAM</span>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-sm sm:text-base font-extrabold text-white leading-snug drop-shadow-sm line-clamp-2">
            {event?.title || 'Evento IFAM'}
          </h2>

          <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-emerald-200 mt-1.5 font-medium">
            {event?.startDate && (
              <span className="inline-flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                <Calendar className="w-3 h-3 text-emerald-400" />
                {new Date(event.startDate).toLocaleDateString('pt-BR')}
              </span>
            )}
            {event?.locationName && (
              <span className="inline-flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-emerald-500/30 truncate max-w-[220px]">
                <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                {event.locationName}
              </span>
            )}
          </div>
        </div>

        {/* NOTCHES LATERAIS E LINHA PONTILHADA DE INGRESSO (FIXO) */}
        <div className="relative flex items-center justify-between w-full h-2.5 bg-slate-950 flex-shrink-0">
          <div className="w-2.5 h-2.5 bg-black rounded-r-full -ml-1 border-r border-emerald-500/40" />
          <div className="flex-1 border-t border-dashed border-emerald-500/30 mx-2" />
          <div className="w-2.5 h-2.5 bg-black rounded-l-full -mr-1 border-l border-emerald-500/40" />
        </div>

        {/* CORPO COM ROLAGEM SUAVE CASO A TELA SEJA MUITO PEQUENA */}
        <div className="overflow-y-auto flex-1 p-3.5 space-y-2.5 custom-scrollbar">
          
          {/* Card do Participante com Foto Oficial e Espaço Amplo */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-xs shadow-md">
            <div className="flex items-center gap-3">
              {/* FOTO / AVATAR REAL DO USUÁRIO */}
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.name || 'Foto do Participante'}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.35)] flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 border-2 border-emerald-400/80 flex items-center justify-center text-emerald-300 font-black text-xl shadow-[0_0_12px_rgba(16,185,129,0.35)] flex-shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
                </div>
              )}

              {/* DADOS DO USUÁRIO */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 tracking-wider">
                    Participante Autorizado
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded-md border border-emerald-400/60 bg-emerald-950/90 text-emerald-300 font-black text-[9px] tracking-wide shadow-sm flex-shrink-0">
                    {user?.category || 'EXTERNO'}
                  </span>
                </div>

                <p className="font-extrabold text-white text-sm sm:text-base leading-tight break-words">
                  {user?.name || 'Participante'}
                </p>

                {user?.campus && (
                  <p className="text-[10px] text-slate-300 font-medium truncate pt-0.5 flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">Campus:</span> {user.campus}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ÁREA DO QR CODE */}
          <div className="relative flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/60 border border-emerald-500/30 text-center space-y-2">
            {/* Viewfinder Corners */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />

            <div className="p-2.5 bg-white rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.25)] border border-emerald-400/60 inline-block">
              <QRCodeSVG
                id="pass-qr-svg"
                value={qrData}
                size={120}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Código Único Clicável */}
            <button
              onClick={handleCopyCode}
              title="Clique para copiar o código"
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between hover:bg-slate-900 transition group"
            >
              <div className="text-left">
                <p className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider">
                  Código Único de Acesso
                </p>
                <p className="text-xs sm:text-sm font-mono font-black text-emerald-400 tracking-wider">
                  {registration.code}
                </p>
              </div>
              <span className="text-[9.5px] text-emerald-300 font-semibold flex items-center gap-1 group-hover:text-emerald-200">
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400 group-hover:text-emerald-400" /> Copiar
                  </>
                )}
              </span>
            </button>
            
            <p className="text-[9px] text-slate-400 leading-tight">
              Apresente este QR Code no credenciamento do evento.
            </p>
          </div>

        </div>

        {/* BOTÕES DE AÇÃO (RODAPÉ FIXO - 100% VISÍVEL, NUNCA CORTA!) */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 flex-shrink-0 z-20">
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={downloading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-95 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 border border-emerald-300/40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Gerando...' : 'Salvar Imagem (PNG)'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 font-bold text-xs transition border border-slate-700"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};



