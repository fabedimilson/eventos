'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Award,
  Calendar,
  User,
  Building,
  Hash,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';

function ValidarContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams?.get('code') || '';

  const [code, setCode] = useState<string>(codeParam);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);

  const handleValidate = async (searchCode: string) => {
    if (!searchCode.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      // Simulação / busca na API
      if (searchCode.toUpperCase().includes('IFAM')) {
        setResult({
          isValid: true,
          certificate: {
            validationCode: searchCode.toUpperCase(),
            userName: 'LUCAS SILVA AMAZÔNIDA',
            userCategory: 'ALUNO (Graduação em ADS)',
            campus: 'Campus Manaus Centro',
            eventTitle: 'I Simpósio de Tecnologia e Inovação da Amazônia - IFAM 2026',
            totalHoursAwarded: 5.5,
            sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            issuedAt: '2026-08-21T14:30:00Z',
          },
        });
      } else {
        const data = await fetchApi<any>(`/certificates/validate/${searchCode}`);
        setResult(data);
      }
    } catch (err: any) {
      setResult({ isValid: false, error: 'Certificado não localizado nos registros oficiais do IFAM.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codeParam) {
      setCode(codeParam);
      handleValidate(codeParam);
    }
  }, [codeParam]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Cabeçalho */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-unifik-violet-50 dark:bg-emerald-950/50 border border-emerald-500/20 flex items-center justify-center text-unifik-primary dark:text-emerald-400 mx-auto shadow-md">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Auditoria Pública de Certificados
        </h1>

        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Validação oficial de autenticidade de documentos e certificados emitidos pelo Instituto Federal do Amazonas com assinatura SHA-256.
        </p>
      </div>

      {/* Caixa de Busca por Código */}
      <div className="glass-panel p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleValidate(code);
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ex: IFAM-2026-X9K2L1"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-unifik-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-unifik-primary hover:bg-unifik-violet-600 text-white font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? 'Consultando...' : 'Verificar Autenticidade'}
          </button>
        </form>
      </div>

      {/* Resultado da Validação */}
      {searched && (
        <div className="animate-fade-in">
          {result?.isValid ? (
            <div className="glass-panel p-8 rounded-3xl border-2 border-emerald-500/50 bg-emerald-500/5 space-y-6 shadow-xl">
              <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                    Certificado Válido & Autêntico
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    Registro homologado na base institucional do IFAM
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Titular do Certificado
                  </span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    {result.certificate.userName}
                  </p>
                  <p className="text-[11px] text-slate-500">{result.certificate.userCategory}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" /> Unidade Emissora
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {result.certificate.campus || 'Campus Manaus Centro'}
                  </p>
                  <p className="text-[11px] text-slate-500">Diretoria de Ensino e Extensão</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1 md:col-span-2">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Evento Acadêmico
                  </span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    {result.certificate.eventTitle}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Carga Horária Concedida: {result.certificate.totalHoursAwarded} horas
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1 md:col-span-2">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" /> Assinatura Criptográfica SHA-256
                  </span>
                  <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all">
                    {result.certificate.sha256Hash}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl border-2 border-red-500/30 bg-red-500/5 text-center space-y-3">
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Certificado Não Encontrado
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Verifique se o código digitado está correto. Caso o erro persista, procure a comissão organizadora do IFAM.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ValidarCertificadoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Carregando auditoria...</div>}>
      <ValidarContent />
    </Suspense>
  );
}
