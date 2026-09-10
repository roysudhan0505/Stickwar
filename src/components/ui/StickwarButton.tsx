import React from 'react';
import { motion } from 'motion/react';
import { sound } from '../../utils/audio';

interface StickwarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'blood' | 'accent' | 'slate' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const StickwarButton: React.FC<StickwarButtonProps> = ({
  variant = 'blood',
  size = 'md',
  fullWidth = false,
  icon,
  children,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    sound.playClick();
    if (onClick) onClick(e);
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-bold tracking-wider uppercase transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] min-w-[48px]';

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
  };

  const variantStyles = {
    blood:
      'bg-[#E63946] text-[#F1F1F1] border-2 border-[#F1F1F1] shadow-[3px_3px_0px_#000000] hover:bg-[#D90429] active:shadow-[1px_1px_0px_#000000]',
    accent:
      'bg-[#FFD60A] text-[#1A1A2E] border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#000000] hover:bg-[#FFE042] active:shadow-[1px_1px_0px_#000000]',
    slate:
      'bg-[#16213E] text-[#F1F1F1] border-2 border-[#475569] shadow-[3px_3px_0px_#000000] hover:border-[#FFD60A] active:shadow-[1px_1px_0px_#000000]',
    outline:
      'bg-transparent text-[#F1F1F1] border-2 border-[#F1F1F1] shadow-[2px_2px_0px_#000000] hover:bg-white/10 active:shadow-none',
    ghost:
      'bg-transparent text-[#F1F1F1] hover:bg-white/10 shadow-none border-transparent active:scale-95',
  };

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.95, y: 1 }}
      onClick={handleClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...(props as any)}
    >
      {icon && <span className="mr-2 inline-flex items-center text-lg">{icon}</span>}
      <span className="font-tech font-bold text-center tracking-wider">{children}</span>
    </motion.button>
  );
};
