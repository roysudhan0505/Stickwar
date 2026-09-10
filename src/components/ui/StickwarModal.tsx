import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { sound } from '../../utils/audio';

interface StickwarModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const StickwarModal: React.FC<StickwarModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-md bg-[#16213E] border-2 border-[#FFD60A] rounded-2xl shadow-[6px_6px_0px_#000000] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-[#1A1A2E] border-b border-white/10">
              <div>
                <h3 className="font-comic text-2xl tracking-wider text-[#FFD60A]">{title}</h3>
                {subtitle && <p className="font-tech text-xs text-[#F1F1F1]/70">{subtitle}</p>}
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="p-2 text-[#F1F1F1] hover:text-[#E63946] transition-colors rounded-lg bg-white/5 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
