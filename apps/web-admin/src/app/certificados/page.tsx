'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  Download,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import { CertificateItem } from '@ifam-eventos/types';
import { fetchApi, API_BASE_URL } from '../../lib/api';
import { generateClientCertificatePdf } from '../../lib/certificatePdfGenerator';
import { useAuth } from '../../context/AuthContext';
import { ProtectedStateCard } from '../../components/ProtectedStateCard';

export default function CertificadosPage() {
  const { user, loading: authLoading } = useAuth();
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadCertificates() {
      try {
        const res = await fetchApi<{ certificates: CertificateItem[] }>('/certificates/my');
        if (res && res.certificates && res.certificates.length > 0) {
          setCertificates(res.certificates);
        } else {
          setCertificates([]);
        }
      } catch (err) {
        console.error('Erro ao buscar certificados:', err);
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    }

    loadCertificates();
  }, [user]);

  if (!authLoading && !user) {
    return (
      <ProtectedStateCard
        title="Carteira de Certificados"
        description="Faça login com sua conta do IFAM para consultar seus certificados digitais autenticados com hash SHA-256 e validação pública."
      />
    );
  }

  const handleDownloadPdf = async (cert: CertificateItem) => {
    try {
      await generateClientCertificatePdf({
        userName: user?.name || 'Participante IFAM',
        userCpf: user?.cpf,
        eventTitle: cert.event?.title || 'Evento Acadêmico IFAM',
        totalHours: cert.totalHoursAwarded || 4.0,
        validationCode: cert.validationCode,
        sha256Hash: cert.sha256Hash,
        issuedAt: cert.issuedAt,
      });
    } catch (err) {
      console.error('Erro ao gerar certificado PDF:', err);
      alert('Erro ao gerar arquivo de certificado PDF.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-unifik-violet-100 dark:bg-emerald-950/60 text-unifik-primary dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
              Atividades Complementares
            </span>
            <span className="text-xs text-slate-500">• Assinatura Digital SHA-256</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Meus Certificados Acadêmicos
          </h1>
        </div>

        <Link
          href="/validar"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Consultar Validação Pública
        </Link>
      </div>

      {/* Lista de Certificados */}
      {certificates.length === 0 ? (
        <div className="glass-panel text-center py-16 rounded-3xl">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="font-bold text-slate-700 dark:text-slate-300">Você ainda não possui certificados emitidos</p>
          <p className="text-xs text-slate-500 mt-1">
            Participe dos eventos do IFAM e registre sua presença nas palestras via QR Code para receber a certificação.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-unifik-violet-50 dark:bg-emerald-950/60 flex items-center justify-center text-unifik-primary dark:text-emerald-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    {cert.totalHoursAwarded} horas
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {cert.event?.title}
                </h3>

                <p className="text-xs text-slate-500">
                  Emitido para: <strong>{user?.name || 'Lucas Silva Amazônida'}</strong>
                </p>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Código de Registro:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{cert.validationCode}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Assinatura Digital:</span>
                    <span className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]">
                      {cert.sha256Hash}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href={`/validar?code=${cert.validationCode}`}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs text-center transition flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Ver Selo de Autenticidade
                </Link>

                <button
                  onClick={() => handleDownloadPdf(cert)}
                  className="py-2.5 px-4 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
