import React from 'react';

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
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200"
      >
        <defs>
          {/* Top Royal Blue Gradient */}
          <linearGradient id="opspilot-blue-grad" x1="30" y1="20" x2="85" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="60%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Bottom Dark Navy Gradient */}
          <linearGradient id="opspilot-navy-grad" x1="25" y1="75" x2="60" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
        </defs>

        {/* Top Royal Blue Curved P-Loop Ribbon */}
        <path
          d="M 37 28 H 63 C 77 28 86 37 86 49.5 C 86 62 76 71 61.5 71 L 51 61.5 C 67 61.5 74 56.5 74 49.5 C 74 42.5 68 38 59 38 H 42.5 Z"
          fill="url(#opspilot-blue-grad)"
        />

        {/* Bottom Dark Navy Angled Arrow Stem */}
        <path
          d="M 31.5 71 H 43 L 48.5 56.5 L 55 41.5 L 35 50.5 L 40.5 53.5 Z"
          fill="url(#opspilot-navy-grad)"
        />
      </svg>

      {showText && (
        <span className={textClassName}>
          OpsPilot
        </span>
      )}
    </div>
  );
};
