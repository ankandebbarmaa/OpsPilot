import React from 'react';
import logoUrl from '../../assets/logo.png';

interface OpsPilotLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
  variant?: 'standard' | 'light';
}

export const OpsPilotLogo: React.FC<OpsPilotLogoProps> = ({
  size = 32,
  className = '',
  showText = false,
  textClassName = 'text-slate-900 font-bold text-base tracking-tight',
}) => {
  return (
    <div className={`inline-flex items-center space-x-2.5 ${className}`}>
      <img
        src={logoUrl}
        width={size}
        height={size}
        alt="OpsPilot Logo"
        className="shrink-0 transition-transform duration-200 object-contain"
        style={{ width: size, height: size }}
      />

      {showText && (
        <span className={textClassName}>
          OpsPilot
        </span>
      )}
    </div>
  );
};

