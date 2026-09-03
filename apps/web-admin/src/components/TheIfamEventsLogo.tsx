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
      {/* Símbolo Oficial Unifik - Opção 2 em Fundo Claro */}
      <img
        src="/unifik-logo.jpg"
        alt="Unifik"
        className={`${isSm ? 'h-7' : isLg ? 'h-11' : 'h-9'} w-auto object-contain shrink-0 rounded-lg`}
      />
      {/* Tipografia Oficial da Marca UNIFIK */}
      <span className={`${isSm ? 'text-lg' : isLg ? 'text-2xl' : 'text-xl'} font-black tracking-wider text-slate-900 dark:text-white uppercase font-sans`}>
        UNIFIK
      </span>
    </div>
  );
}
