import React from 'react';
import { StickwarModal } from '../ui/StickwarModal';
import { useGame } from '../../context/GameContext';
import { Coins, Check, Lock, Flame } from 'lucide-react';
import { StickwarButton } from '../ui/StickwarButton';
import { sound } from '../../utils/audio';

export const DailyRewardModal: React.FC = () => {
  const { state, dispatch } = useGame();
  const { dailyRewards, player, showDailyRewardModal } = state;

  const currentStreak = player.dailyStreak;
  const todayReward = dailyRewards[currentStreak - 1] || dailyRewards[0];

  const handleClaim = (day: number) => {
    dispatch({ type: 'CLAIM_DAILY_REWARD', day });
    sound.playUpgrade();
  };

  return (
    <StickwarModal
      isOpen={showDailyRewardModal}
      onClose={() => dispatch({ type: 'TOGGLE_DAILY_MODAL', open: false })}
      title="Daily Reward"
      subtitle="Log in every day to claim bonus coins and warrior shards!"
    >
      <div className="space-y-4">
        {/* Streak badge */}
        <div className="flex items-center justify-between bg-[#1A1A2E] p-3 rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-400 fill-orange-500 animate-pulse" />
            <div>
              <span className="font-comic text-lg text-[#FFD60A]">
                Day {currentStreak} Streak!
              </span>
              <p className="font-tech text-xs text-[#F1F1F1]/70">
                Keep the flame alive for massive Day 7 rewards!
              </p>
            </div>
          </div>
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-4 gap-2">
          {dailyRewards.map((reward) => {
            const isClaimed = reward.claimed;
            const isToday = reward.day === currentStreak && !isClaimed;
            const isLocked = reward.day > currentStreak;

            return (
              <div
                key={reward.day}
                className={`relative rounded-xl p-2.5 flex flex-col items-center justify-between border-2 text-center transition-all ${
                  reward.day === 7 ? 'col-span-2 bg-[#E63946]/20 border-[#E63946]' : ''
                } ${
                  isToday
                    ? 'bg-[#FFD60A]/15 border-[#FFD60A] shadow-[0_0_12px_rgba(255,214,10,0.4)] scale-105'
                    : isClaimed
                    ? 'bg-black/40 border-[#06D6A0]/40 opacity-70'
                    : 'bg-[#1A1A2E] border-white/10 opacity-60'
                }`}
              >
                {/* Header day */}
                <span className="font-tech text-[10px] uppercase font-bold text-[#F1F1F1]/60">
                  Day {reward.day}
                </span>

                {/* Reward icon */}
                <div className="my-1.5 flex flex-col items-center">
                  <Coins className={`w-5 h-5 ${isToday ? 'text-[#FFD60A]' : 'text-yellow-500'}`} />
                  <span className="font-tech font-bold text-xs text-[#FFD60A]">
                    +{reward.coins}
                  </span>
                  {reward.shards && (
                    <span className="text-[9px] font-tech text-blue-400">
                      +{reward.shards} Shards
                    </span>
                  )}
                </div>

                {/* Status indicator */}
                <div>
                  {isClaimed ? (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#06D6A0]">
                      <Check className="w-3 h-3" />
                      <span>CLAIMED</span>
                    </div>
                  ) : isToday ? (
                    <span className="bg-[#FFD60A] text-[#1A1A2E] text-[9px] font-bold px-1.5 py-0.5 rounded font-tech">
                      TODAY
                    </span>
                  ) : (
                    <Lock className="w-3 h-3 text-white/40 mx-auto" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Claim Action */}
        <div className="pt-2">
          {todayReward && !todayReward.claimed ? (
            <StickwarButton
              variant="accent"
              fullWidth
              size="lg"
              onClick={() => handleClaim(todayReward.day)}
            >
              Claim Day {todayReward.day} (+{todayReward.coins} Coins)
            </StickwarButton>
          ) : (
            <StickwarButton
              variant="slate"
              fullWidth
              disabled
            >
              Next Reward In 24 Hours
            </StickwarButton>
          )}
        </div>
      </div>
    </StickwarModal>
  );
};
