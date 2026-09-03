import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TheIfamEventsLogo({ className = '', size = 'md' }: LogoProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Símbolo Oficial Isolado (Sem Legenda) */}
      <img
        src="/unifik-icon.jpg"
        alt="Unifik"
        className={`${isSm ? 'w-7 h-7' : isLg ? 'w-10 h-10' : 'w-9 h-9'} rounded-xl object-cover shadow-sm ring-1 ring-violet-500/20 shrink-0`}
      />
      {/* Tipografia Oficial da Marca ao Lado */}
      <span className={`${isSm ? 'text-base' : isLg ? 'text-2xl' : 'text-xl'} font-black tracking-wider text-slate-900 dark:text-white uppercase font-sans`}>
        UNIFIK
      </span>
    </div>
  );
}
