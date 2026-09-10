import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-[#E63946] border-2 border-white px-3.5 py-1.5 text-xs font-tech font-bold text-white shadow-[0_4px_12px_rgba(230,57,70,0.6)] animate-bounce">
      <WifiOff className="w-4 h-4 text-[#FFD60A]" />
      <span>OFFLINE MODE — Local Progress & Stages Active</span>
    </div>
  );
};
