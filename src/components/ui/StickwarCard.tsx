import React from 'react';

interface StickwarCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'blood' | 'glass';
  onClick?: () => void;
  interactive?: boolean;
}

export const StickwarCard: React.FC<StickwarCardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick,
  interactive = false,
}) => {
  const variantStyles = {
    default: 'bg-[#16213E] border-2 border-[#334155] shadow-[4px_4px_0px_#000000]',
    accent: 'bg-[#16213E] border-2 border-[#FFD60A] shadow-[4px_4px_0px_rgba(255,214,10,0.3)]',
    blood: 'bg-[#16213E] border-2 border-[#E63946] shadow-[4px_4px_0px_rgba(230,57,70,0.3)]',
    glass: 'bg-[#16213E]/80 backdrop-blur-md border-2 border-white/10 shadow-[3px_3px_0px_#000000]',
  };

  const interactiveStyles = interactive
    ? 'cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.99]'
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-4 ${variantStyles[variant]} ${interactiveStyles} ${className}`}
    >
      {children}
    </div>
  );
};
