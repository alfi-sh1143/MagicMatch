import React from 'react';

interface ProfileAvatarProps {
  seed: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'strip';
  className?: string;
  filter?: 'normal' | 'mono' | 'warm' | 'cyber';
}

const PALETTES = [
  { bg: 'from-amber-700 via-orange-800 to-stone-900', hair: '#1c1917', skin: '#f5d0b0', accent: '#f59e0b' },
  { bg: 'from-rose-800 via-purple-900 to-neutral-950', hair: '#292524', skin: '#d4a373', accent: '#ec4899' },
  { bg: 'from-cyan-900 via-blue-950 to-neutral-950', hair: '#0f172a', skin: '#e2b38f', accent: '#06b6d4' },
  { bg: 'from-emerald-900 via-teal-950 to-stone-950', hair: '#18181b', skin: '#fcd5b8', accent: '#10b981' },
  { bg: 'from-violet-900 via-indigo-950 to-neutral-950', hair: '#172554', skin: '#c68642', accent: '#8b5cf6' },
  { bg: 'from-fuchsia-900 via-pink-950 to-neutral-950', hair: '#312e81', skin: '#8d5524', accent: '#d946ef' },
];

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  seed,
  name,
  size = 'md',
  className = '',
  filter = 'normal',
}) => {
  // Deterministic seed hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const palette = PALETTES[positiveHash % PALETTES.length];
  const hairStyle = positiveHash % 4; // 0: wavy, 1: curly, 2: straight, 3: buzz/bob
  const hasGlasses = positiveHash % 3 === 0;

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36',
    strip: 'w-full aspect-[4/3]',
  };

  const filterStyles = {
    normal: '',
    mono: 'grayscale contrast-125',
    warm: 'sepia-[0.35] brightness-105 contrast-105',
    cyber: 'hue-rotate-15 contrast-110 saturate-125',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${palette.bg} flex items-center justify-center select-none shadow-inner ${sizeClasses[size]} ${filterStyles[filter]} ${className}`}
      aria-label={`Avatar for ${name}`}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full object-cover scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`grad-${positiveHash}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Backdrop Ambient Circle */}
        <circle cx="60" cy="55" r="42" fill={palette.accent} opacity="0.18" />

        {/* Shoulders / Torso */}
        <path
          d="M20 120 C 20 95, 40 85, 60 85 C 80 85, 100 95, 100 120 Z"
          fill={palette.hair}
          opacity="0.9"
        />
        {/* Shirt collar notch */}
        <path d="M52 85 L 60 96 L 68 85 Z" fill={palette.skin} />

        {/* Neck */}
        <rect x="52" y="70" width="16" height="20" rx="3" fill={palette.skin} />
        {/* Neck shadow */}
        <path d="M52 74 Q 60 80 68 74 L 68 78 Q 60 84 52 78 Z" fill="#000000" opacity="0.15" />

        {/* Head */}
        <ellipse cx="60" cy="52" rx="22" ry="25" fill={palette.skin} />

        {/* Ears */}
        <circle cx="37" cy="53" r="5" fill={palette.skin} />
        <circle cx="83" cy="53" r="5" fill={palette.skin} />

        {/* Hair Styles */}
        {hairStyle === 0 && (
          <path
            d="M36 50 C 34 30, 48 20, 60 20 C 72 20, 86 30, 84 50 C 80 34, 72 32, 60 32 C 48 32, 40 34, 36 50 Z"
            fill={palette.hair}
          />
        )}
        {hairStyle === 1 && (
          <g fill={palette.hair}>
            <circle cx="44" cy="34" r="12" />
            <circle cx="60" cy="28" r="14" />
            <circle cx="76" cy="34" r="12" />
            <circle cx="38" cy="46" r="10" />
            <circle cx="82" cy="46" r="10" />
          </g>
        )}
        {hairStyle === 2 && (
          <path
            d="M37 54 C 36 28, 48 22, 60 22 C 72 22, 84 28, 83 54 C 80 38, 60 35, 37 54 Z"
            fill={palette.hair}
          />
        )}
        {hairStyle === 3 && (
          <path
            d="M38 48 C 38 28, 50 24, 60 24 C 70 24, 82 28, 82 48 C 82 48, 76 34, 60 34 C 44 34, 38 48, 38 48 Z"
            fill={palette.hair}
          />
        )}

        {/* Eyes */}
        <ellipse cx="51" cy="52" rx="2.5" ry="3.5" fill="#1c1917" />
        <ellipse cx="69" cy="52" rx="2.5" ry="3.5" fill="#1c1917" />
        <circle cx="52" cy="51" r="0.8" fill="#ffffff" />
        <circle cx="70" cy="51" r="0.8" fill="#ffffff" />

        {/* Eyebrows */}
        <path d="M47 46 Q 51 44 55 46" stroke={palette.hair} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M65 46 Q 69 44 73 46" stroke={palette.hair} strokeWidth="1.8" strokeLinecap="round" />

        {/* Nose */}
        <path d="M59 52 L 58 59 Q 60 61 62 59" stroke="#b45309" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />

        {/* Smile */}
        <path d="M53 66 Q 60 72 67 66" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" />

        {/* Optional Glasses */}
        {hasGlasses && (
          <g stroke="#ffffff" strokeWidth="1.8" fill="none" opacity="0.85">
            <rect x="44" y="47" width="14" height="11" rx="3" />
            <rect x="62" y="47" width="14" height="11" rx="3" />
            <line x1="58" y1="52" x2="62" y2="52" />
          </g>
        )}

        {/* Light Overlay Gradient */}
        <rect x="0" y="0" width="120" height="120" fill={`url(#grad-${positiveHash})`} />
      </svg>
    </div>
  );
};
