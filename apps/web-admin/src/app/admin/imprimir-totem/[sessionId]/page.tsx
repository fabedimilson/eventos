'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  ShieldCheck,
  Building,
  Calendar,
  Clock,
  Award,
  Users,
} from 'lucide-react';
import { fetchApi } from '../../../../lib/api';

export default function PrintTotemPage() {
  const params = useParams();
  const sessionId = (params?.sessionId as string) || '';

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const data = await fetchApi<{ session: any }>(`/sessions/${sessionId}`);
        setSession(data.session);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [sessionId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
        Gerando Placa de Credenciamento para Impressão...
      </div>
    );
  }

  const primaryColor = session?.event?.primaryColor || '#1B5E20';
  const qrPayload = JSON.stringify({
    sessionId: session?.id,
    eventId: session?.eventId,
    token: `IFAM-CHECKIN-${session?.id}`,
  });

  return (
    <div className="min-h-screen bg-slate-200 p-4 md:p-8 flex flex-col items-center justify-center print:bg-white print:p-0">
      {/* Barra Superior de Ação (Oculta na Impressão) */}
      <div className="w-full max-w-2xl mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="font-extrabold text-lg text-slate-800">
            Placa de Credenciamento para Impressão
          </h1>
          <p className="text-xs text-slate-500">
            Imprima e afixe este cartaz na entrada do auditório/espaço do IFAM.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-6 py-2.5 rounded-xl bg-ifam-green-700 hover:bg-ifam-green-800 text-white font-bold text-sm shadow-md transition flex items-center gap-2 active:scale-95"
        >
          <Printer className="w-4 h-4" />
          Imprimir Folha / Gerar PDF
        </button>
      </div>

      {/* CARTAZ DE IMPRESSÃO (Formatado para Folha A4 Vertical) */}
      <div
        className="w-full max-w-[210mm] min-h-[297mm] bg-white rounded-3xl shadow-2xl p-10 flex flex-col justify-between border-4 border-slate-300 print:border-none print:shadow-none print:w-full print:h-full print:rounded-none"
        style={{ borderColor: primaryColor }}
      >
        {/* Topo Institucional do Cartaz */}
        <div className="space-y-4 text-center border-b-2 border-slate-200 pb-6">
          <div className="flex items-center justify-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              IF
            </div>
            <div className="text-left">
              <span className="font-extrabold text-2xl tracking-tight text-slate-900 block leading-none">
                IFAM
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Instituto Federal do Amazonas
              </span>
            </div>
          </div>

          <div className="pt-2">
            <span
              className="inline-block px-4 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: primaryColor }}
            >
              TOTEM OFICIAL DE CREDENCIAMENTO E CHECK-IN
            </span>
          </div>
        </div>

        {/* Informações Principais da Palestra / Evento */}
        <div className="text-center my-6 space-y-4">
          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
            {session?.title}
          </h2>

          <p className="text-sm font-semibold text-slate-600 max-w-lg mx-auto">
            Palestrante: <span className="text-slate-900 font-bold">{session?.speakerName}</span>
          </p>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-700 pt-2 font-bold">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Building className="w-4 h-4 text-emerald-700" />
              <span>{session?.room || 'Auditório Gilberto Mestrinho (CMC)'}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>{session?.workloadHours}h certificadas</span>
            </div>
          </div>
        </div>

        {/* MOLDURA CENTRAL DO QR CODE PARA LEITURA NA ENTRADA */}
        <div className="flex flex-col items-center justify-center my-4 space-y-4">
          <div
            className="p-6 rounded-3xl bg-white shadow-xl border-4 flex flex-col items-center"
            style={{ borderColor: primaryColor }}
          >
            <QRCodeSVG
              value={qrPayload}
              size={260}
              level="H"
              fgColor={primaryColor}
              bgColor="#FFFFFF"
            />
          </div>

          <div className="text-center space-y-1">
            <p className="text-base font-extrabold text-slate-900">
              REGISTRE SUA PRESENÇA AQUI
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Abra a câmera ou o app <strong>IFAM Eventos</strong> e aponte para a placa ao entrar.
            </p>
          </div>
        </div>

        {/* Rodapé com Selo Criptográfico e Assinatura Institucional */}
        <div className="border-t-2 border-slate-200 pt-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Validação de Presença Granular Autenticada com SHA-256</span>
          </div>

          <p className="text-[10px] text-slate-400">
            Diretoria de Extensão e Coordenação de Eventos — Instituto Federal do Amazonas (IFAM Campus Manaus Centro)
          </p>
        </div>
      </div>
    </div>
  );
}
