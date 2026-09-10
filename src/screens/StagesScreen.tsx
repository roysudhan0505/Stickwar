import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, Lock, Skull, Swords, Play, Trophy } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { TopHeader } from '../components/layout/TopHeader';
import { StickwarButton } from '../components/ui/StickwarButton';
import { sound } from '../utils/audio';

export const StagesScreen: React.FC = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { state } = useGame();
  const { worlds, player, characters } = state;

  const currentWorldId = Number(worldId) || 1;
  const world = worlds.find((w) => w.id === currentWorldId) || worlds[0];
  const [selectedStageId, setSelectedStageId] = useState<number>(() => {
    // default to first unlocked stage that has not been beaten or first stage
    const uncompleted = world.stages.find((s) => s.unlocked && s.stars === 0);
    return uncompleted ? uncompleted.stageId : 1;
  });

  const selectedStage = world.stages.find((s) => s.stageId === selectedStageId) || world.stages[0];
  const activeChar = characters[player.activeCharacterId] || characters.basic_stick;

  const handleSelectStage = (stageId: number, unlocked: boolean) => {
    sound.playClick();
    if (unlocked) {
      setSelectedStageId(stageId);
    } else {
      sound.playHit();
    }
  };

  const handleStartBriefing = () => {
    sound.playClick();
    navigate(`/worlds/${world.id}/stages/${selectedStage.stageId}/briefing`);
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#F1F1F1] flex flex-col pb-24">
      <TopHeader
        title={world.name.toUpperCase()}
        showBackButton
        onBack={() => navigate('/worlds')}
      />

      <main className="max-w-md w-full mx-auto px-4 py-3 flex-1 flex flex-col justify-between">
        {/* Stages Node Strip */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-tech text-xs uppercase tracking-wider text-[#F1F1F1]/70">
              Select Combat Encounter
            </span>
            <span className="font-tech text-xs text-[#FFD60A] font-bold">
              {world.stages.filter((s) => s.unlocked).length} of 5 Stages Ready
            </span>
          </div>

          {/* 5 Stage Nodes in a Comic Row/Grid */}
          <div className="grid grid-cols-5 gap-2">
            {world.stages.map((stage) => {
              const isSelected = stage.stageId === selectedStageId;

              return (
                <button
                  key={stage.stageId}
                  onClick={() => handleSelectStage(stage.stageId, stage.unlocked)}
                  className={`relative flex flex-col items-center justify-between p-2 rounded-xl border-2 transition-all min-h-[76px] select-none ${
                    isSelected
                      ? 'bg-[#E63946] border-white shadow-[0_0_12px_#E63946] scale-105 z-10'
                      : stage.unlocked
                      ? 'bg-[#16213E] border-[#FFD60A]/60 shadow-[2px_2px_0px_#000000] hover:border-[#FFD60A]'
                      : 'bg-[#121B2F]/60 border-white/10 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Stage Number / Boss Skull */}
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-black/40 font-comic text-lg">
                    {stage.isBoss ? (
                      <Skull className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#E63946]'}`} />
                    ) : (
                      <span>{stage.stageId}</span>
                    )}
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-2.5 h-2.5 ${
                          starIdx <= stage.stars
                            ? 'fill-[#FFD60A] text-[#FFD60A]'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Lock Indicator */}
                  {!stage.unlocked && (
                    <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                      <Lock className="w-4 h-4 text-white/60" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Stage Detail Card */}
          <motion.div
            key={selectedStage.stageId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#16213E] border-2 border-[#FFD60A] rounded-2xl p-4 shadow-[4px_4px_0px_#000000]"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-tech text-xs uppercase font-bold text-[#FFD60A]">
                    Stage {selectedStage.globalStageNumber}
                  </span>
                  {selectedStage.isBoss && (
                    <span className="bg-[#E63946] text-white text-[10px] font-tech font-bold px-1.5 py-0.2 rounded uppercase">
                      BOSS BATTLE
                    </span>
                  )}
                </div>
                <h3 className="font-comic text-2xl text-[#F1F1F1] mt-0.5">
                  {selectedStage.title}
                </h3>
              </div>

              {/* 3 Stars Status */}
              <div className="flex items-center gap-1 bg-[#1A1A2E] px-2.5 py-1 rounded-xl border border-white/10">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= selectedStage.stars
                        ? 'fill-[#FFD60A] text-[#FFD60A]'
                        : 'text-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Combat Intel / Recommended Stats */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10 text-xs font-tech">
              <div className="bg-[#1A1A2E] p-2 rounded-xl border border-white/5">
                <span className="text-white/60 uppercase block">Recommended ATK</span>
                <span className="font-bold text-sm text-[#FFD60A]">
                  {selectedStage.recommendedStats.atk} ATK
                </span>
                <span className="text-[10px] block text-white/50">
                  Your ATK: {activeChar.currentStats.atk}
                </span>
              </div>

              <div className="bg-[#1A1A2E] p-2 rounded-xl border border-white/5">
                <span className="text-white/60 uppercase block">Recommended HP</span>
                <span className="font-bold text-sm text-[#06D6A0]">
                  {selectedStage.recommendedStats.hp} HP
                </span>
                <span className="text-[10px] block text-white/50">
                  Your HP: {activeChar.currentStats.hp}
                </span>
              </div>
            </div>

            {/* Best Record */}
            {selectedStage.bestScore > 0 && (
              <div className="flex items-center justify-between text-xs font-tech text-white/80 mt-3 bg-black/20 px-3 py-1.5 rounded-lg">
                <span className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-[#FFD60A]" />
                  Best Score: {selectedStage.bestScore.toLocaleString()}
                </span>
                <span>Best Time: {selectedStage.bestTime}s</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <StickwarButton
            variant="blood"
            size="lg"
            fullWidth
            icon={<Play className="w-5 h-5 fill-white" />}
            onClick={handleStartBriefing}
            disabled={!selectedStage.unlocked}
          >
            BATTLE BRIEFING
          </StickwarButton>
        </div>
      </main>
    </div>
  );
};
