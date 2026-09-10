import React from 'react';

interface ProgressBarProps {
  value: number; // current value
  max: number; // max value
  label?: string;
  subLabel?: string;
  color?: 'neon' | 'accent' | 'blood' | 'blue';
  height?: 'sm' | 'md' | 'lg';
  showPercent?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  subLabel,
  color = 'accent',
  height = 'md',
  showPercent = false,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / (max || 1)) * 100)));

  const heightStyles = {
    sm: 'h-2',
    md: 'h-3.5',
    lg: 'h-5',
  };

  const colorStyles = {
    neon: 'bg-[#06D6A0] shadow-[0_0_8px_#06D6A0]',
    accent: 'bg-[#FFD60A] shadow-[0_0_8px_#FFD60A]',
    blood: 'bg-[#E63946] shadow-[0_0_8px_#E63946]',
    blue: 'bg-[#3B82F6] shadow-[0_0_8px_#3B82F6]',
  };

  return (
    <div className="w-full">
      {(label || subLabel || showPercent) && (
        <div className="flex justify-between items-center text-xs font-tech mb-1 font-semibold">
          <span className="text-[#F1F1F1]/80 uppercase tracking-wider">{label}</span>
          <span className="text-[#FFD60A]">
            {subLabel ? subLabel : showPercent ? `${percentage}%` : `${value}/${max}`}
          </span>
        </div>
      )}
      <div
        className={`w-full bg-[#0F172A] rounded-full overflow-hidden border border-white/20 p-[2px] ${heightStyles[height]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${colorStyles[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
