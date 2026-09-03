'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { ValidateCertificateModal } from './ValidateCertificateModal';

export function Footer() {
  const [validateModalOpen, setValidateModalOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm mt-auto py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
          {/* Identidade Institucional no Rodapé */}
          <div className="flex items-center gap-3">
            <img
              src="/unifik-logo.jpg"
              alt="Unifik"
              className="w-8 h-8 object-contain shrink-0"
            />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Unifik
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} Unifik — Ecossistema Acadêmico, Rede Social e Gestão de Eventos
              </p>
            </div>
          </div>

          {/* Botão de Destaque: Validar Autenticidade de Certificados (Abre Popup Modal) */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setValidateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/80 shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>🛡️ Validar Autenticidade de Certificado</span>
            </button>
          </div>

          {/* Links Secundários */}
          <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500 text-[11px]">
            <Link href="/networking" className="hover:text-emerald-600 transition">
              Networking
            </Link>
            <span>•</span>
            <Link href="/certificados" className="hover:text-emerald-600 transition">
              Certificados
            </Link>
            <span>•</span>
            <span>Portaria Normativa IFAM</span>
          </div>
        </div>
      </footer>

      {/* Modal Popup de Validação de Certificado */}
      <ValidateCertificateModal
        isOpen={validateModalOpen}
        onClose={() => setValidateModalOpen(false)}
      />
    </>
  );
}
