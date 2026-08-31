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
      {/* Ícone de Arcos Concêntricos (Verde e Vermelho IFAM) */}
      <svg
        width={isSm ? '28' : isLg ? '44' : '34'}
        height={isSm ? '24' : isLg ? '38' : '30'}
        viewBox="0 0 100 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Arco Exterior - Verde IFAM */}
        <path
          d="M 10 85 A 75 75 0 0 1 85 10 L 85 30 A 55 55 0 0 0 30 85 Z"
          fill="#10B981"
        />
        {/* Arco Intermediário - Vermelho IFAM */}
        <path
          d="M 35 85 A 50 50 0 0 1 85 35 L 85 52 A 33 33 0 0 0 52 85 Z"
          fill="#EF4444"
        />
        {/* Arco Interior - Verde IFAM */}
        <path
          d="M 58 85 A 27 27 0 0 1 85 58 L 85 73 A 12 12 0 0 0 73 85 Z"
          fill="#10B981"
        />
      </svg>

      {/* Tipografia Oficial IFAM EVENTOS */}
      <div className="flex flex-col justify-center leading-tight font-black tracking-tight uppercase font-sans">
        <span style={{ fontSize: isSm ? '12px' : isLg ? '18px' : '15px' }} className="text-slate-900 dark:text-white font-extrabold">
          IFAM
        </span>
        <span style={{ fontSize: isSm ? '10px' : isLg ? '14px' : '11px', letterSpacing: '0.08em' }} className="text-emerald-600 dark:text-emerald-400 font-bold">
          EVENTOS
        </span>
      </div>
    </div>
  );
}
