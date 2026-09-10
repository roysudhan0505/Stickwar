import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StickwarButton } from '../components/ui/StickwarButton';
import { StickmanFigure } from '../components/StickmanFigure';

export const NotFoundScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#F1F1F1] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="rotate-12">
        <StickmanFigure type="basic" color="#E63946" size={130} animated={true} />
      </div>

      <h1 className="font-comic text-5xl text-[#FFD60A] drop-shadow-[0_4px_0_#000000]">
        404 — STAGE NOT FOUND
      </h1>
      <p className="font-tech text-sm text-[#F1F1F1]/70 max-w-xs">
        This battlefield doesn't exist or has been conquered into oblivion.
      </p>

      <StickwarButton
        variant="blood"
        size="md"
        onClick={() => navigate('/home')}
        className="mt-2"
      >
        RETURN TO HEADQUARTERS
      </StickwarButton>
    </div>
  );
};
