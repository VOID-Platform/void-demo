import React, { useId } from 'react';

interface VoidLogoProps {
  className?: string;
  glow?: boolean;
  size?: number;
}

export const VoidLogo: React.FC<VoidLogoProps> = ({ className = '', glow = true, size = 32 }) => {
  const uniqueId = useId().replace(/:/g, '');
  const gradientId = `voidLogoGradient_${uniqueId}`;
  const glowGradId = `voidGlowGrad_${uniqueId}`;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div className="absolute inset-0 bg-[#A855F7]/25 blur-lg rounded-full scale-125 pointer-events-none" />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DF00FF" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#7E22CE" />
          </linearGradient>
          <linearGradient id={glowGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DF00FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Outer Geometric V Outline */}
        <path
          d="M 18 20 L 50 82 L 82 20"
          stroke={`url(#${gradientId})`}
          strokeWidth="4"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />

        {/* Left Arm Geometric Facets */}
        <polygon
          points="18,20 40,48 18,36"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.5"
          fill="rgba(168, 85, 247, 0.12)"
        />
        <polygon
          points="18,36 45,62 28,54"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.5"
          fill="rgba(223, 0, 255, 0.08)"
        />
        <polygon
          points="28,54 50,82 38,66"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.5"
          fill="rgba(126, 34, 206, 0.16)"
        />

        {/* Right Arm Geometric Facets */}
        <polygon
          points="82,20 60,48 82,36"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.5"
          fill="rgba(168, 85, 247, 0.12)"
        />
        <polygon
          points="82,36 55,62 72,54"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.5"
          fill="rgba(223, 0, 255, 0.08)"
        />
        <polygon
          points="72,54 50,82 62,66"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.5"
          fill="rgba(126, 34, 206, 0.16)"
        />

        {/* Inner Facet Connecting Laser Line */}
        <line
          x1="50"
          y1="82"
          x2="50"
          y2="30"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.5"
          strokeDasharray="2 2"
          opacity="0.6"
        />
      </svg>
    </div>
  );
};
