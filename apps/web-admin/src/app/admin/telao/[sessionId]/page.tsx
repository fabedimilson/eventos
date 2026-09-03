'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Users,
  Clock,
  Sparkles,
  ShieldCheck,
  Maximize,
  CheckCircle2,
} from 'lucide-react';
import { fetchApi } from '../../../../lib/api';

export default function ProjectionScreenPage() {
  const params = useParams();
  const sessionId = (params?.sessionId as string) || '';

  const [session, setSession] = useState<any>(null);
  const [qrData, setQrData] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15);
  const [checkInCount, setCheckInCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Carrega dados da sessão
  useEffect(() => {
    async function loadSession() {
      try {
        const data = await fetchApi<{ session: any }>(`/sessions/${sessionId}`);
        setSession(data.session);
        setCheckInCount(data.session._count?.checkIns || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [sessionId]);

  // Rotina de atualização do QR Code dinâmico a cada 15 segundos
  useEffect(() => {
    async function updateQrToken() {
      try {
        const res = await fetchApi<{ sessionId: string; token: string }>(`/sessions/${sessionId}/qr-current`);
        const payload = JSON.stringify({
          sessionId: res.sessionId,
          token: res.token,
          t: Date.now(),
        });
        setQrData(payload);
        setSecondsRemaining(15);
      } catch (err) {
        console.error(err);
      }
    }

    updateQrToken();
    const interval = setInterval(updateQrToken, 15000);

    const countdown = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 1 ? prev - 1 : 15));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, [sessionId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-radial from-slate-900 via-slate-950 to-black text-white flex flex-col justify-between p-8 md:p-12 select-none">
      {/* Top Bar Institucional */}
      <div className="flex items-center justify-between border-b border-emerald-900/40 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-unifik-primary flex items-center justify-center font-black text-2xl shadow-lg border border-emerald-400/30">
            IF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-emerald-400">IFAM</span>
              <span className="text-xs px-2 py-0.5 rounded bg-ifam-red-700 font-bold uppercase tracking-wider">
                Presença Oficial
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Credenciamento Granular por Palestra</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 px-4 py-2 rounded-xl text-emerald-300 font-semibold text-sm">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>{checkInCount} presenças confirmadas</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
            title="Tela Cheia"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Conteúdo Central: Informações da Palestra e QR Code Gigante Rotativo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto w-full my-auto">
        {/* Esquerda: Informações da Palestra */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Sparkles className="w-4 h-4" />
            Check-in Aberto no Telão
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
            {session?.title}
          </h1>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Palestrante:</span>
              <span className="font-bold text-white text-base">{session?.speakerName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Carga Horária:</span>
              <span className="font-bold text-emerald-400">{session?.workloadHours} horas</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Local / Auditório:</span>
              <span className="font-bold text-slate-200">{session?.room || 'Auditório Principal'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Código criptográfico dinâmico com renovação a cada 15 segundos para prevenção de fraudes.</span>
          </div>
        </div>

        {/* Direita: QR Code Gigante com Animação e Contador */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative p-6 rounded-3xl bg-white shadow-2xl shadow-emerald-500/10 border-4 border-emerald-600 flex flex-col items-center">
            {qrData ? (
              <QRCodeSVG
                value={qrData}
                size={300}
                level="H"
                fgColor="#1B5E20"
                bgColor="#FFFFFF"
                includeMargin={false}
              />
            ) : (
              <div className="w-[300px] h-[300px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Selo Central no QR */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-unifik-primary border-4 border-white flex items-center justify-center text-white font-black text-xs shadow-md">
                IFAM
              </div>
            </div>
          </div>

          {/* Barra de Progresso do Token Rotativo */}
          <div className="w-full max-w-xs mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Atualização do QR:</span>
              <span className="text-emerald-400">{secondsRemaining}s</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(secondsRemaining / 15) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Instruções de Rodapé */}
      <div className="text-center text-xs text-slate-500 border-t border-slate-800/80 pt-4">
        Abra o aplicativo <strong>IFAM Eventos</strong> no celular e aponte a câmera para registrar sua presença.
      </div>
    </div>
  );
}
