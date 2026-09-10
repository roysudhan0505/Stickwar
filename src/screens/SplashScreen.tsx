import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { StickmanFigure } from '../components/StickmanFigure';
import { ProgressBar } from '../components/ui/ProgressBar';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => navigate('/home'), 300);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 20) + 15;
        return next > 100 ? 100 : next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-[#1A1A2E] text-[#F1F1F1] flex flex-col items-center justify-between p-8 select-none z-50">
      <div className="w-full" />

      {/* Center Branding */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-sm">
        <motion.div
          animate={{ x: [-15, 15, -15] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <StickmanFigure type="ninja" color="#FFD60A" size={140} animated={true} />
        </motion.div>

        <div>
          <h1 className="font-comic text-7xl text-[#FFD60A] drop-shadow-[0_8px_0_#000000] tracking-wider">
            STICKWAR
          </h1>
          <p className="font-tech text-xs tracking-[0.3em] uppercase text-[#E63946] font-bold mt-1">
            Fight • Survive • Dominate
          </p>
        </div>
      </div>

      {/* Bottom Loading Progress */}
      <div className="w-full max-w-xs space-y-2 text-center">
        <ProgressBar
          value={progress}
          max={100}
          color="accent"
          height="sm"
        />
        <span className="font-tech text-[11px] text-white/50 tracking-wider uppercase">
          Initializing Battle Engine... {progress}%
        </span>
      </div>
    </div>
  );
};
