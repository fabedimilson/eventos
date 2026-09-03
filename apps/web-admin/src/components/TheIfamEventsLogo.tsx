import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TheIfamEventsLogo({ className = '', size = 'md' }: LogoProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const logoHeight = isSm ? 'h-7' : isLg ? 'h-12' : 'h-9';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Logotipo Oficial Aprovado do Unifik */}
      <img
        src="/logo-unifik.jpg"
        alt="Unifik"
        className={`${logoHeight} w-auto object-contain rounded-xl shadow-xs`}
      />
    </div>
  );
}
