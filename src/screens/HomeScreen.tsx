import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Swords, Users, Trophy, Award, Settings, Gift, Sparkles, ShieldAlert } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { TopHeader } from '../components/layout/TopHeader';
import { StickwarButton } from '../components/ui/StickwarButton';
import { StickmanFigure } from '../components/StickmanFigure';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';
import { sound } from '../utils/audio';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { player, characters, dailyRewards } = state;
  const activeChar = characters[player.activeCharacterId] || characters.basic_stick;

  // Check if today daily reward is unclaimed
  const unclaimedDaily = dailyRewards.some(
    (r) => r.day === player.dailyStreak && !r.claimed
  );

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#F1F1F1] flex flex-col pb-20 select-none overflow-x-hidden">
      <TopHeader />

      {/* Guest Mode Banner */}
      {player.isGuest && (
        <div
          onClick={() => {
            sound.playClick();
            navigate('/auth');
          }}
          className="mx-4 mt-2 bg-[#E63946]/15 border border-[#E63946]/50 rounded-xl p-2.5 flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#E63946] flex-shrink-0" />
            <span className="text-xs font-tech text-[#F1F1F1]/90">
              Guest Session. <strong className="text-[#FFD60A]">Sign in</strong> to sync progress!
            </span>
          </div>
          <span className="text-xs font-tech font-bold text-[#FFD60A]">JOIN ➔</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 flex flex-col justify-between py-4">
        {/* Game Title & Branding */}
        <div className="text-center my-2">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <h1 className="font-comic text-6xl xs:text-7xl text-[#FFD60A] tracking-wider drop-shadow-[0_6px_0_#000000] stroke-black">
              STICKWAR
            </h1>
            <p className="font-tech text-xs xs:text-sm uppercase tracking-[0.25em] text-[#E63946] font-bold mt-[-4px]">
              Fight • Survive • Dominate
            </p>
          </motion.div>
        </div>

        {/* Hero Character Showcase */}
        <div className="relative my-4 flex flex-col items-center justify-center">
          {/* Animated Background Battlefield Ring */}
          <div className="absolute w-56 h-56 rounded-full bg-gradient-to-b from-[#16213E] to-transparent border border-white/10 -z-0 flex items-center justify-center">
            <div className="w-44 h-44 rounded-full border border-dashed border-[#FFD60A]/30 animate-[spin_40s_linear_infinite]" />
          </div>

          {/* Stickman Character */}
          <div className="relative z-10 py-2">
            <StickmanFigure
              type={activeChar.silhouetteType}
              color="#F1F1F1"
              size={170}
              animated={true}
            />
          </div>

          {/* Active Character Pill */}
          <div
            onClick={() => {
              sound.playClick();
              navigate('/characters');
            }}
            className="z-10 mt-1 flex items-center gap-2 bg-[#16213E]/90 border border-[#FFD60A]/60 px-3.5 py-1 rounded-full shadow-[2px_2px_0px_#000000] cursor-pointer hover:border-[#FFD60A] active:scale-95 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-[#06D6A0] animate-pulse" />
            <span className="font-tech font-bold text-sm text-[#FFD60A]">
              {activeChar.name}
            </span>
            <span className="text-[10px] uppercase font-tech px-1.5 py-0.2 bg-[#E63946] text-white rounded font-bold">
              {activeChar.rarity}
            </span>
          </div>
        </div>

        {/* Main Action Menu Buttons */}
        <div className="space-y-2.5 z-10">
          {/* In-App PWA Install Banner */}
          <PWAInstallButton variant="banner" className="mb-1" />

          {/* Primary PLAY Button */}
          <StickwarButton
            variant="blood"
            size="lg"
            fullWidth
            icon={<Swords className="w-6 h-6 animate-bounce" />}
            onClick={() => navigate('/worlds')}
            className="text-xl py-4 shadow-[4px_4px_0px_#000000] border-2 border-white"
          >
            PLAY CAMPAIGN
          </StickwarButton>

          {/* 2-Column Sub Menu Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <StickwarButton
              variant="slate"
              size="md"
              icon={<Users className="w-4 h-4 text-[#FFD60A]" />}
              onClick={() => navigate('/characters')}
            >
              WARRIORS
            </StickwarButton>

            <StickwarButton
              variant="slate"
              size="md"
              icon={<Trophy className="w-4 h-4 text-[#FFD60A]" />}
              onClick={() => navigate('/leaderboard')}
            >
              RANKS
            </StickwarButton>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <StickwarButton
              variant="slate"
              size="md"
              icon={<Award className="w-4 h-4 text-[#06D6A0]" />}
              onClick={() => navigate('/achievements')}
            >
              BADGES
            </StickwarButton>

            {/* Daily Reward Button with notification badge */}
            <div className="relative">
              <StickwarButton
                variant="slate"
                size="md"
                fullWidth
                icon={<Gift className="w-4 h-4 text-orange-400" />}
                onClick={() => dispatch({ type: 'TOGGLE_DAILY_MODAL', open: true })}
              >
                REWARDS
              </StickwarButton>
              {unclaimedDaily && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FFD60A] rounded-full animate-ping pointer-events-none" />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
