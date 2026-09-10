import React from 'react';
import { Coins, Flame, User, Shield } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/audio';
import { useNavigate } from 'react-router-dom';

interface TopHeaderProps {
  onAvatarClick?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  showBackButton = false,
  onBack,
  title,
}) => {
  const { state } = useGame();
  const navigate = useNavigate();
  const { player } = state;

  return (
    <header className="sticky top-0 z-30 w-full bg-[#1A1A2E]/95 backdrop-blur-md border-b-2 border-[#16213E] px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Left: Player Profile or Back Button */}
        {showBackButton ? (
          <button
            onClick={() => {
              sound.playClick();
              if (onBack) onBack();
              else navigate(-1);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#16213E] border border-white/20 rounded-xl text-sm font-tech font-bold text-[#F1F1F1] hover:border-[#FFD60A] active:scale-95"
          >
            <span className="text-base">◀</span>
            <span>BACK</span>
          </button>
        ) : (
          <div
            onClick={() => {
              sound.playClick();
              navigate('/settings');
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="relative w-10 h-10 rounded-xl bg-[#16213E] border-2 border-[#FFD60A] flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform shadow-[2px_2px_0px_#000000]">
              <User className="w-5 h-5 text-[#FFD60A]" />
              {player.isGuest && (
                <div className="absolute -bottom-1 -right-1 bg-[#E63946] text-[8px] font-bold px-1 rounded text-white">
                  GUEST
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-tech font-bold text-sm tracking-wide text-[#F1F1F1] group-hover:text-[#FFD60A] transition-colors line-clamp-1">
                {player.username}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-[#FFD60A]/80 font-tech font-semibold uppercase">
                <Shield className="w-2.5 h-2.5 text-[#FFD60A]" />
                <span>{player.rank}</span>
              </div>
            </div>
          </div>
        )}

        {/* Center: Title (if provided in sub-screens) */}
        {title && (
          <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
            <h1 className="font-comic text-xl text-[#FFD60A] tracking-wider uppercase drop-shadow-md">
              {title}
            </h1>
          </div>
        )}

        {/* Right: Gold Coins Balance & Daily Streak */}
        <div className="flex items-center gap-2">
          {/* Daily streak indicator */}
          <div
            onClick={() => {
              sound.playClick();
            }}
            className="hidden xs:flex items-center gap-1 bg-[#16213E] px-2 py-1 rounded-lg border border-white/10 text-xs font-tech font-bold text-orange-400"
            title="Daily Streak"
          >
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-400 animate-pulse" />
            <span>{player.dailyStreak}d</span>
          </div>

          {/* Coins Badge */}
          <div
            onClick={() => sound.playCoin()}
            className="flex items-center gap-1.5 bg-[#16213E] border-2 border-[#FFD60A] px-2.5 py-1 rounded-xl shadow-[2px_2px_0px_#000000] cursor-pointer active:scale-95 transition-transform"
          >
            <Coins className="w-4 h-4 text-[#FFD60A] fill-[#FFD60A]" />
            <span className="font-tech font-bold text-sm text-[#FFD60A]">
              {player.goldCoins.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
