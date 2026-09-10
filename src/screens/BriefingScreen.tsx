import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Swords, CheckCircle2, Clock, Heart, Users, Play } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { TopHeader } from '../components/layout/TopHeader';
import { StickwarButton } from '../components/ui/StickwarButton';
import { StickmanFigure } from '../components/StickmanFigure';
import { sound } from '../utils/audio';

export const BriefingScreen: React.FC = () => {
  const { worldId, stageId } = useParams<{ worldId: string; stageId: string }>();
  const navigate = useNavigate();
  const { state } = useGame();
  const { worlds, player, characters } = state;

  const currentWorldId = Number(worldId) || 1;
  const currentStageId = Number(stageId) || 1;
  const world = worlds.find((w) => w.id === currentWorldId) || worlds[0];
  const stage = world.stages.find((s) => s.stageId === currentStageId) || world.stages[0];
  const activeChar = characters[player.activeCharacterId] || characters.basic_stick;

  const handleStartGame = () => {
    sound.playClick();
    navigate(`/game/${world.id}/${stage.stageId}`);
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#F1F1F1] flex flex-col pb-24">
      <TopHeader
        title="MISSION BRIEFING"
        showBackButton
        onBack={() => navigate(`/worlds/${world.id}/stages`)}
      />

      <main className="max-w-md w-full mx-auto px-4 py-3 flex-1 flex flex-col justify-between space-y-4">
        {/* Stage Overview Banner */}
        <div className="bg-[#16213E] border-2 border-[#E63946] rounded-2xl p-4 shadow-[4px_4px_0px_#000000]">
          <div className="flex items-center justify-between">
            <span className="font-tech text-xs text-[#FFD60A] font-bold uppercase tracking-wider">
              {world.name} • Stage {stage.stageId}
            </span>
            <span className="bg-[#E63946] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase font-tech">
              {stage.isBoss ? 'BOSS ENCOUNTER' : 'WAVE SURVIVAL'}
            </span>
          </div>
          <h2 className="font-comic text-3xl text-white mt-1">{stage.title}</h2>
          <p className="font-tech text-xs text-[#F1F1F1]/70 mt-1">
            Defeat all enemy stickman waves to claim territory control and unlock gold chests.
          </p>
        </div>

        {/* Objectives Box */}
        <div className="bg-[#16213E] border-2 border-white/10 rounded-2xl p-4 shadow-[3px_3px_0px_#000000]">
          <h3 className="font-tech text-xs font-bold text-[#FFD60A] uppercase tracking-wider mb-2.5">
            Mission Objectives
          </h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-xs font-tech">
              <CheckCircle2 className="w-4 h-4 text-[#06D6A0] flex-shrink-0" />
              <span className="text-[#F1F1F1]">Primary: Eliminate all incoming hostiles (1 Star)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-tech">
              <Clock className="w-4 h-4 text-[#FFD60A] flex-shrink-0" />
              <span className="text-[#F1F1F1]">Time Trial: Clear stage in under 75 seconds (2 Stars)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-tech">
              <Heart className="w-4 h-4 text-[#E63946] flex-shrink-0" />
              <span className="text-[#F1F1F1]">Flawless: Finish battle with &gt; 50% HP (3 Stars)</span>
            </div>
          </div>
        </div>

        {/* Selected Warrior Card */}
        <div className="bg-[#16213E] border-2 border-[#FFD60A] rounded-2xl p-4 shadow-[3px_3px_0px_#000000]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-tech text-xs font-bold text-[#FFD60A] uppercase tracking-wider">
              Deployed Warrior
            </span>
            <button
              onClick={() => {
                sound.playClick();
                navigate('/characters');
              }}
              className="text-xs font-tech font-bold text-[#06D6A0] flex items-center gap-1 hover:underline"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Change</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#1A1A2E] rounded-xl border border-white/20 flex items-center justify-center">
              <StickmanFigure
                type={activeChar.silhouetteType}
                color="#F1F1F1"
                size={70}
                animated={false}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-comic text-xl text-white">{activeChar.name}</span>
                <span className="text-[10px] font-tech font-bold bg-[#E63946] px-1.5 rounded text-white uppercase">
                  {activeChar.rarity}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs font-tech mt-1 text-[#F1F1F1]/80">
                <span>
                  ATK: <strong className="text-[#FFD60A]">{activeChar.currentStats.atk}</strong>
                </span>
                <span>
                  HP: <strong className="text-[#06D6A0]">{activeChar.currentStats.hp}</strong>
                </span>
                <span>
                  SPD: <strong className="text-blue-400">{activeChar.currentStats.spd}</strong>
                </span>
                <span>
                  ABILITY: <strong className="text-purple-400">{activeChar.currentStats.ability}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Deploy Button */}
        <div className="pt-2">
          <StickwarButton
            variant="blood"
            size="lg"
            fullWidth
            icon={<Play className="w-6 h-6 fill-white animate-pulse" />}
            onClick={handleStartGame}
            className="text-xl py-4"
          >
            ENTER BATTLE
          </StickwarButton>
        </div>
      </main>
    </div>
  );
};
