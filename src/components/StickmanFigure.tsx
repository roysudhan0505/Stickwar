import React from 'react';
import { motion } from 'motion/react';

interface StickmanFigureProps {
  type: 'basic' | 'ninja' | 'mage' | 'tank' | 'sky';
  color?: string;
  size?: number;
  animated?: boolean;
  action?: 'idle' | 'attack' | 'run';
}

export const StickmanFigure: React.FC<StickmanFigureProps> = ({
  type = 'basic',
  color = '#F1F1F1',
  size = 120,
  animated = true,
}) => {
  // Renders vector comic-book stylized stickman based on class
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <motion.svg
        viewBox="0 0 100 120"
        className="w-full h-full filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
        animate={
          animated
            ? {
                y: [0, -3, 0],
              }
            : undefined
        }
        transition={{
          repeat: Infinity,
          duration: type === 'ninja' ? 1.2 : 2.0,
          ease: 'easeInOut',
        }}
      >
        {/* Glow Aura for special classes */}
        {type === 'ninja' && (
          <circle cx="50" cy="50" r="38" fill="#FFD60A" opacity="0.08" className="animate-pulse" />
        )}
        {type === 'mage' && (
          <circle cx="50" cy="50" r="42" fill="#3B82F6" opacity="0.12" className="animate-pulse" />
        )}
        {type === 'tank' && (
          <circle cx="50" cy="50" r="45" fill="#E63946" opacity="0.10" />
        )}
        {type === 'sky' && (
          <>
            <circle cx="50" cy="50" r="48" fill="#FFD60A" opacity="0.15" className="animate-pulse" />
            {/* Celestial Wings */}
            <path d="M 45 46 Q 15 20 10 38 Q 25 48 45 52" fill="#FFD60A" opacity="0.4" />
            <path d="M 55 46 Q 85 20 90 38 Q 75 48 55 52" fill="#FFD60A" opacity="0.4" />
          </>
        )}

        {/* Head */}
        <circle cx="50" cy="24" r="12" fill="none" stroke={color} strokeWidth="5.5" />

        {/* Eyes / Face Accent */}
        {type === 'ninja' ? (
          <>
            {/* Ninja Mask & Eyes */}
            <path d="M 44 23 L 56 23" stroke="#FFD60A" strokeWidth="2.5" strokeLinecap="round" />
            {/* Headband cloth */}
            <path
              d="M 58 18 Q 72 14 78 22"
              stroke="#E63946"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          </>
        ) : type === 'mage' ? (
          <>
            {/* Mystic circlet / Horn */}
            <path d="M 44 14 L 50 7 L 56 14" stroke="#60A5FA" strokeWidth="3" fill="none" />
            <circle cx="47" cy="24" r="1.5" fill="#60A5FA" />
            <circle cx="53" cy="24" r="1.5" fill="#60A5FA" />
          </>
        ) : type === 'tank' ? (
          <>
            {/* Heavy Helm Plate */}
            <path d="M 42 16 L 50 12 L 58 16" stroke="#94A3B8" strokeWidth="5" fill="none" />
            <path d="M 45 23 L 55 23" stroke="#E63946" strokeWidth="2.5" />
          </>
        ) : (
          <>
            {/* Classic Warrior Headband */}
            <path
              d="M 39 20 L 61 20"
              stroke="#E63946"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 60 21 Q 68 24 74 20"
              stroke="#E63946"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Torso / Spine */}
        <line
          x1="50"
          y1="36"
          x2="50"
          y2="74"
          stroke={color}
          strokeWidth={type === 'tank' ? '8' : '6'}
          strokeLinecap="round"
        />

        {/* Legs */}
        {type === 'ninja' ? (
          // Agile crouched legs
          <>
            <polyline
              points="50,74 36,92 26,112"
              stroke={color}
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <polyline
              points="50,74 66,92 78,112"
              stroke={color}
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </>
        ) : (
          // Standard Stance
          <>
            <polyline
              points="50,74 38,92 32,112"
              stroke={color}
              strokeWidth={type === 'tank' ? '7' : '5.5'}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <polyline
              points="50,74 62,92 68,112"
              stroke={color}
              strokeWidth={type === 'tank' ? '7' : '5.5'}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </>
        )}

        {/* Arms & Weapons */}
        {type === 'basic' && (
          <>
            {/* Left Arm holding katana guard */}
            <polyline
              points="50,44 32,56 24,70"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Right Arm raised with Katana */}
            <polyline
              points="50,44 68,48 76,38"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Katana Blade */}
            <line
              x1="76"
              y1="38"
              x2="95"
              y2="12"
              stroke="#F1F1F1"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line
              x1="73"
              y1="41"
              x2="79"
              y2="35"
              stroke="#FFD60A"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </>
        )}

        {type === 'ninja' && (
          <>
            {/* Dual daggers / kunai */}
            <polyline
              points="50,44 32,46 20,54"
              stroke={color}
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Kunai 1 */}
            <line x1="20" y1="54" x2="10" y2="62" stroke="#FFD60A" strokeWidth="3" strokeLinecap="round" />

            <polyline
              points="50,44 68,42 82,48"
              stroke={color}
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Kunai 2 */}
            <line x1="82" y1="48" x2="94" y2="52" stroke="#FFD60A" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {type === 'mage' && (
          <>
            {/* Left Arm holding mystical staff */}
            <polyline
              points="50,44 68,52 74,40"
              stroke={color}
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Staff Shaft */}
            <line x1="74" y1="18" x2="74" y2="105" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
            {/* Arcane Crystal on top */}
            <polygon points="74,10 79,20 69,20" fill="#60A5FA" stroke="#3B82F6" strokeWidth="1.5" />

            {/* Floating spell orb */}
            <circle cx="26" cy="46" r="6" fill="#3B82F6" opacity="0.8" />
            <circle cx="26" cy="46" r="3" fill="#FFFFFF" />
          </>
        )}

        {type === 'tank' && (
          <>
            {/* Left Arm with Heavy Shield */}
            <polyline
              points="50,44 34,50 28,62"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Great Tower Shield */}
            <rect
              x="16"
              y="38"
              width="14"
              height="45"
              rx="4"
              fill="#334155"
              stroke="#E63946"
              strokeWidth="2.5"
            />

            {/* Right Arm with Warhammer */}
            <polyline
              points="50,44 68,54 78,48"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <line x1="78" y1="48" x2="88" y2="36" stroke="#94A3B8" strokeWidth="4" />
            <rect x="84" y="28" width="16" height="12" rx="2" fill="#E63946" stroke="#F1F1F1" strokeWidth="1.5" />
          </>
        )}

        {type === 'sky' && (
          <>
            {/* Dual Golden Stormblades */}
            <polyline points="50,44 32,42 16,36" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
            <line x1="16" y1="36" x2="4" y2="18" stroke="#FFD60A" strokeWidth="3.5" strokeLinecap="round" />
            <polyline points="50,44 68,42 84,36" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
            <line x1="84" y1="36" x2="96" y2="18" stroke="#FFD60A" strokeWidth="3.5" strokeLinecap="round" />
          </>
        )}
      </motion.svg>
    </div>
  );
};
