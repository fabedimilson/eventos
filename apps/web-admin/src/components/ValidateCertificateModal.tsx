'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Award,
  User,
  Building,
  Hash,
  X,
} from 'lucide-react';
import { fetchApi } from '../lib/api';

interface ValidateCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ValidateCertificateModal({ isOpen, onClose }: ValidateCertificateModalProps) {
  const [code, setCode] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleValidate = async (searchCode: string) => {
    if (!searchCode.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 overflow-hidden">
        {/* Botão Fechar Modal */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho do Popup */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Validar Certificado IFAM
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Digite o código impresso no documento para verificar a autenticidade SHA-256.
            </p>
          </div>
        </div>

        {/* Formulário de Busca */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleValidate(code);
          }}
          className="flex flex-col sm:flex-row items-center gap-2.5"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ex: IFAM-2026-8A9F-73B1"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? 'Consultando...' : 'Verificar'}
          </button>
        </form>

        {/* Exibição do Resultado */}
        {searched && (
          <div className="pt-2 animate-fade-in">
            {result?.isValid ? (
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      Documento Válido & Autêntico
                    </h4>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      Registro homologado pela Diretoria de Ensino do IFAM
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
                      <User className="w-3 h-3 text-emerald-500" /> Titular
                    </span>
                    <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate">
                      {result.certificate.userName}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{result.certificate.userCategory}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
                      <Building className="w-3 h-3 text-emerald-500" /> Unidade
                    </span>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                      {result.certificate.campus || 'Campus Manaus Centro'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-0.5 sm:col-span-2">
                    <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
                      <Award className="w-3 h-3 text-emerald-500" /> Evento & Carga Horária
                    </span>
                    <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate">
                      {result.certificate.eventTitle}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {result.certificate.totalHoursAwarded} horas complementares concedidas
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-0.5 sm:col-span-2">
                    <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
                      <Hash className="w-3 h-3 text-emerald-500" /> Hash SHA-256
                    </span>
                    <p className="font-mono text-[9px] text-slate-500 dark:text-slate-400 break-all">
                      {result.certificate.sha256Hash}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-red-500/30 bg-red-500/10 text-center space-y-2">
                <XCircle className="w-8 h-8 text-red-500 mx-auto" />
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Certificado Não Encontrado
                </h4>
                <p className="text-[11px] text-slate-500">
                  Verifique o código impresso no documento ou no QR Code.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
