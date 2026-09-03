import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TheIfamEventsLogo({ className = '', size = 'md' }: LogoProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconWidth = isSm ? '28' : isLg ? '42' : '34';
  const iconHeight = isSm ? '30' : isLg ? '46' : '36';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Símbolo Oficial Unifik: Escudo + Livro/Asas + Foguete + Letra U */}
      <svg
        width={iconWidth}
        height={iconHeight}
        viewBox="0 0 100 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm"
      >
        <defs>
          <linearGradient id="unifikGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        
        {/* Contorno Escudo Externo */}
        <path
          d="M 50 5 C 75 5 92 18 92 38 C 92 72 58 100 50 105 C 42 100 8 72 8 38 C 8 18 25 5 50 5 Z"
          stroke="url(#unifikGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Livro Aberto / Asas Superiores */}
        <path
          d="M 22 28 C 36 20 48 26 50 28 C 52 26 64 20 78 28"
          stroke="url(#unifikGrad)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Foguete / Faísca de Inovação Central */}
        <path
          d="M 50 16 L 54 28 L 50 24 L 46 28 Z"
          fill="#8B5CF6"
        />

        {/* Letra U em Traço Orgânico */}
        <path
          d="M 32 40 L 32 62 C 32 75 68 75 68 62 L 68 40"
          stroke="url(#unifikGrad)"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>

      {/* Tipografia Oficial UNIFIK */}
      <div className="flex flex-col justify-center leading-none tracking-tight font-sans">
        <span style={{ fontSize: isSm ? '16px' : isLg ? '24px' : '20px' }} className="text-slate-900 dark:text-white font-black tracking-wider uppercase">
          UNIFIK
        </span>
        <span style={{ fontSize: isSm ? '9px' : isLg ? '12px' : '10px' }} className="text-violet-600 dark:text-violet-400 font-bold tracking-widest uppercase">
          Acadêmico
        </span>
      </div>
    </div>
  );
}
