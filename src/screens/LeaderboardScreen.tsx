import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Flame, Users, Clock, RefreshCw, Shield } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { TopHeader } from '../components/layout/TopHeader';
import { LeaderboardEntry } from '../types/game';
import { sound } from '../utils/audio';

export const LeaderboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useGame();
  const { player } = state;

  const [activeTab, setActiveTab] = useState<'global' | 'friends' | 'weekly'>('global');
  const [refreshing, setRefreshing] = useState(false);

  // Mock initial leaderboard data
  const mockLeaderboard: LeaderboardEntry[] = [
    { rank: 1, username: 'KageShadow', avatar: 'ninja', score: 184500, stagesCleared: 20, bestBossTime: '24.2s' },
    { rank: 2, username: 'TitanSlayer', avatar: 'tank', score: 162300, stagesCleared: 19, bestBossTime: '28.5s' },
    { rank: 3, username: 'ArcaneVortex', avatar: 'mage', score: 148900, stagesCleared: 17, bestBossTime: '31.0s' },
    { rank: 4, username: 'StickSamurai', avatar: 'basic', score: 132400, stagesCleared: 15, bestBossTime: '36.4s' },
    { rank: 5, username: 'GhostReaper', avatar: 'ninja', score: 119800, stagesCleared: 13, bestBossTime: '39.8s' },
    { rank: 6, username: 'IronWall', avatar: 'tank', score: 98400, stagesCleared: 11, bestBossTime: '44.1s' },
    { rank: 7, username: 'PixelBlade', avatar: 'basic', score: 85200, stagesCleared: 9, bestBossTime: '48.9s' },
  ];

  const handleRefresh = () => {
    sound.playClick();
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const top3 = mockLeaderboard.slice(0, 3);
  const remaining = mockLeaderboard.slice(3);

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#F1F1F1] flex flex-col pb-24">
      <TopHeader
        title="LEADERBOARD"
        showBackButton
        onBack={() => navigate('/home')}
      />

      <main className="max-w-md w-full mx-auto px-4 py-3 flex-1 flex flex-col space-y-4">
        {/* Tab Selector */}
        <div className="flex bg-[#16213E] p-1 rounded-xl border border-white/10">
          {(
            [
              { key: 'global', label: 'Global', icon: Trophy },
              { key: 'weekly', label: 'Weekly', icon: Flame },
              { key: 'friends', label: 'Friends', icon: Users },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                sound.playClick();
                setActiveTab(key);
              }}
              className={`flex-1 py-2 rounded-lg font-tech font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all ${
                activeTab === key
                  ? 'bg-[#FFD60A] text-[#1A1A2E] shadow-[2px_2px_0px_#000000]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Weekly Reset Banner if Weekly Tab */}
        {activeTab === 'weekly' && (
          <div className="flex items-center justify-between bg-[#16213E] px-3 py-2 rounded-xl border border-orange-500/30 text-xs font-tech">
            <span className="text-orange-400 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Resets every Monday
            </span>
            <span className="text-white/60">3 Days Remaining</span>
          </div>
        )}

        {/* Top 3 Podium Display */}
        <div className="flex items-end justify-center gap-2 pt-4 pb-2">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="flex-1 flex flex-col items-center">
              <div className="relative mb-1">
                <div className="w-12 h-12 rounded-xl bg-[#16213E] border-2 border-slate-300 flex items-center justify-center font-comic text-xl text-slate-300 shadow-[2px_2px_0px_#000000]">
                  2
                </div>
              </div>
              <span className="font-tech font-bold text-xs truncate max-w-[80px]">
                {top3[1].username}
              </span>
              <span className="font-tech text-[10px] text-[#FFD60A]">
                {top3[1].score.toLocaleString()}
              </span>
              <div className="w-full h-14 bg-slate-400/20 border-t-2 border-slate-300 rounded-t-lg mt-1" />
            </div>
          )}

          {/* 1st Place (Center, Tallest) */}
          {top3[0] && (
            <div className="flex-1 flex flex-col items-center">
              <div className="relative mb-1">
                <Trophy className="w-5 h-5 text-[#FFD60A] mx-auto mb-0.5 fill-[#FFD60A] animate-bounce" />
                <div className="w-14 h-14 rounded-xl bg-[#16213E] border-2 border-[#FFD60A] flex items-center justify-center font-comic text-2xl text-[#FFD60A] shadow-[0_0_12px_rgba(255,214,10,0.5)]">
                  1
                </div>
              </div>
              <span className="font-tech font-bold text-xs truncate max-w-[90px] text-[#FFD60A]">
                {top3[0].username}
              </span>
              <span className="font-tech text-xs text-[#FFD60A] font-bold">
                {top3[0].score.toLocaleString()}
              </span>
              <div className="w-full h-20 bg-[#FFD60A]/20 border-t-2 border-[#FFD60A] rounded-t-lg mt-1" />
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="flex-1 flex flex-col items-center">
              <div className="relative mb-1">
                <div className="w-12 h-12 rounded-xl bg-[#16213E] border-2 border-amber-600 flex items-center justify-center font-comic text-xl text-amber-600 shadow-[2px_2px_0px_#000000]">
                  3
                </div>
              </div>
              <span className="font-tech font-bold text-xs truncate max-w-[80px]">
                {top3[2].username}
              </span>
              <span className="font-tech text-[10px] text-[#FFD60A]">
                {top3[2].score.toLocaleString()}
              </span>
              <div className="w-full h-10 bg-amber-700/20 border-t-2 border-amber-600 rounded-t-lg mt-1" />
            </div>
          )}
        </div>

        {/* Scrollable Ranked Rows */}
        <div className="space-y-2 flex-1 overflow-y-auto">
          {remaining.map((entry) => (
            <div
              key={entry.rank}
              className="bg-[#16213E] p-3 rounded-xl border border-white/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="font-comic text-base text-white/50 w-5 text-center">
                  #{entry.rank}
                </span>
                <div>
                  <span className="font-tech font-bold text-sm text-white block">
                    {entry.username}
                  </span>
                  <span className="font-tech text-[10px] text-white/50">
                    {entry.stagesCleared} Stages Cleared • Best Boss: {entry.bestBossTime}
                  </span>
                </div>
              </div>
              <span className="font-tech font-bold text-sm text-[#FFD60A]">
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Current User Fixed Row at Bottom */}
        <div className="sticky bottom-16 bg-[#1A1A2E] p-3 rounded-xl border-2 border-[#FFD60A] flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2.5">
            <span className="font-comic text-lg text-[#FFD60A]">#142</span>
            <div>
              <span className="font-tech font-bold text-sm text-white block">
                {player.username} (You)
              </span>
              <span className="font-tech text-[10px] text-[#06D6A0]">
                {player.stagesCleared} Stages Cleared • {player.rank}
              </span>
            </div>
          </div>
          <span className="font-tech font-bold text-sm text-[#FFD60A]">
            {(player.stagesCleared * 1250).toLocaleString()} PTS
          </span>
        </div>
      </main>
    </div>
  );
};
