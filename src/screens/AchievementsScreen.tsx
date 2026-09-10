import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Check, Coins, Swords, MapPin, Zap, Flame, Skull } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { TopHeader } from '../components/layout/TopHeader';
import { StickwarButton } from '../components/ui/StickwarButton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { AchievementCategory } from '../types/game';
import { sound } from '../utils/audio';

export const AchievementsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { achievements } = state;

  const [filter, setFilter] = useState<AchievementCategory>('All');

  const filtered = achievements.filter((a) => {
    if (filter === 'All') return true;
    if (filter === 'Completed') return a.claimed || a.progress >= a.target;
    return a.category === filter;
  });

  const completedCount = achievements.filter((a) => a.claimed).length;

  const handleClaim = (id: string) => {
    dispatch({ type: 'CLAIM_ACHIEVEMENT', achievementId: id });
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sword':
        return <Swords className="w-5 h-5 text-[#FFD60A]" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-[#3B82F6]" />;
      case 'MapPin':
        return <MapPin className="w-5 h-5 text-[#06D6A0]" />;
      case 'Skull':
        return <Skull className="w-5 h-5 text-[#E63946]" />;
      default:
        return <Award className="w-5 h-5 text-[#FFD60A]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#F1F1F1] flex flex-col pb-24">
      <TopHeader
        title="BADGES & REWARDS"
        showBackButton
        onBack={() => navigate('/home')}
      />

      <main className="max-w-md w-full mx-auto px-4 py-3 flex-1 flex flex-col space-y-4">
        {/* Top Summary Banner */}
        <div className="bg-[#16213E] p-4 rounded-2xl border-2 border-white/10 flex items-center justify-between shadow-[3px_3px_0px_#000000]">
          <div>
            <span className="font-tech text-xs text-[#F1F1F1]/70 uppercase tracking-wider block">
              War Honor Badges
            </span>
            <span className="font-comic text-2xl text-[#FFD60A]">
              {completedCount} / {achievements.length} UNLOCKED
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#1A1A2E] border-2 border-[#FFD60A] flex items-center justify-center">
            <Award className="w-7 h-7 text-[#FFD60A]" />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(['All', 'Combat', 'Exploration', 'Collection', 'Completed'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sound.playClick();
                setFilter(cat);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-tech font-bold uppercase transition-all flex-shrink-0 ${
                filter === cat
                  ? 'bg-[#E63946] text-white shadow-[2px_2px_0px_#000000]'
                  : 'bg-[#16213E] text-white/60 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Achievement List */}
        <div className="space-y-2.5 flex-1 overflow-y-auto">
          {filtered.map((ach) => {
            const isComplete = ach.progress >= ach.target;
            const canClaim = isComplete && !ach.claimed;

            return (
              <div
                key={ach.id}
                className={`bg-[#16213E] p-3.5 rounded-2xl border-2 transition-all ${
                  ach.claimed
                    ? 'border-[#06D6A0]/40 opacity-70'
                    : canClaim
                    ? 'border-[#FFD60A] shadow-[0_0_10px_rgba(255,214,10,0.3)]'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1A1A2E] border border-white/10 flex items-center justify-center flex-shrink-0">
                      {getIcon(ach.icon)}
                    </div>
                    <div>
                      <h4 className="font-comic text-lg text-white leading-tight">
                        {ach.title}
                      </h4>
                      <p className="font-tech text-xs text-[#F1F1F1]/70 mt-0.5">
                        {ach.description}
                      </p>
                    </div>
                  </div>

                  {/* Coin & Shard Reward Badge */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-lg text-xs font-tech font-bold text-[#FFD60A]">
                      <Coins className="w-3.5 h-3.5" />
                      <span>+{ach.rewardCoins}</span>
                    </div>
                    {ach.rewardShards && (
                      <span className="text-[10px] font-tech text-[#06D6A0] font-bold bg-[#06D6A0]/10 px-1.5 py-0.2 rounded border border-[#06D6A0]/30">
                        +{ach.rewardShards.amount} SHARDS
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress & Claim */}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <ProgressBar
                      value={ach.progress}
                      max={ach.target}
                      color={isComplete ? 'neon' : 'accent'}
                      height="sm"
                    />
                  </div>

                  {ach.claimed ? (
                    <div className="flex items-center gap-1 text-xs font-tech font-bold text-[#06D6A0] flex-shrink-0">
                      <Check className="w-4 h-4" />
                      <span>CLAIMED</span>
                    </div>
                  ) : (
                    <StickwarButton
                      variant={canClaim ? 'accent' : 'slate'}
                      size="sm"
                      disabled={!canClaim}
                      onClick={() => handleClaim(ach.id)}
                      className="py-1 px-3 min-h-[36px]"
                    >
                      {canClaim ? 'CLAIM' : 'LOCKED'}
                    </StickwarButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
