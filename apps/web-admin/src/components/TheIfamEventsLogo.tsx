import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TheIfamEventsLogo({ className = '', size = 'md' }: LogoProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const logoHeight = isSm ? 'h-8' : isLg ? 'h-14' : 'h-11';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Símbolo Oficial Unifik - Opção 2 Recortado Rente e em Destaque */}
      <img
        src="/unifik-logo.jpg"
        alt="Unifik"
        className={`${logoHeight} w-auto object-contain shrink-0 drop-shadow-xs`}
      />
      {/* Tipografia Oficial da Marca UNIFIK */}
      <span className={`${isSm ? 'text-lg' : isLg ? 'text-3xl' : 'text-2xl'} font-black tracking-wider text-slate-900 dark:text-white uppercase font-sans`}>
        UNIFIK
      </span>
    </div>
  );
}
