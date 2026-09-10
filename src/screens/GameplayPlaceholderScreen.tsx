import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Swords, Shield, Heart, Trophy, ArrowRight, RotateCcw } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { StickwarButton } from '../components/ui/StickwarButton';
import { StickmanFigure } from '../components/StickmanFigure';
import { sound } from '../utils/audio';

export const GameplayPlaceholderScreen: React.FC = () => {
  const { worldId, stageId } = useParams<{ worldId: string; stageId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { worlds, characters, player } = state;

  const currentWorldId = Number(worldId) || 1;
  const currentStageId = Number(stageId) || 1;
  const world = worlds.find((w) => w.id === currentWorldId) || worlds[0];
  const stage = world.stages.find((s) => s.stageId === currentStageId) || world.stages[0];
  const activeChar = characters[player.activeCharacterId] || characters.basic_stick;

  const [isPaused, setIsPaused] = useState(false);
  const [stageCleared, setStageCleared] = useState(false);

  const handleSimulateVictory = () => {
    sound.playUpgrade();
    setStageCleared(true);
    dispatch({
      type: 'COMPLETE_STAGE',
      worldId: currentWorldId,
      stageId: currentStageId,
      stars: 3,
      score: 12500,
      timeSeconds: 42,
      coinsEarned: 150,
      killsCount: 12,
    });
  };

  return (
    <div className="relative w-full h-screen bg-[#1A1A2E] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Top HUD */}
      <header className="p-3 bg-black/60 backdrop-blur flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E63946] flex items-center justify-center font-comic text-sm">
            HP
          </div>
          <div>
            <div className="w-28 xs:w-36 h-3 bg-black/50 rounded-full border border-white/20 overflow-hidden">
              <div className="w-full h-full bg-[#E63946] rounded-full" />
            </div>
            <span className="font-tech text-[10px] text-white/70 block mt-0.5">
              {activeChar.currentStats.hp} / {activeChar.currentStats.hp}
            </span>
          </div>
        </div>

        {/* Wave Indicator */}
        <div className="text-center">
          <span className="font-comic text-xs text-[#FFD60A] uppercase block">Wave 1 / 3</span>
          <span className="font-tech text-xs text-white/80">Stage {stage.globalStageNumber}</span>
        </div>

        {/* Pause Button */}
        <button
          onClick={() => {
            sound.playClick();
            setIsPaused(true);
          }}
          className="p-2 bg-[#16213E] rounded-xl border border-white/20 text-[#FFD60A] active:scale-95"
        >
          <Pause className="w-4 h-4" />
        </button>
      </header>

      {/* Battle Canvas Area Placeholder (Connecting in Phase 3) */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
        {/* Background battlefield scene */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600 via-[#1A1A2E] to-[#1A1A2E]" />

        <div className="z-10 text-center space-y-4 max-w-sm">
          <div className="flex items-center justify-center gap-6">
            {/* Player Stickman */}
            <div className="flex flex-col items-center">
              <StickmanFigure type={activeChar.silhouetteType} size={110} animated={true} />
              <span className="font-tech text-xs text-[#FFD60A] font-bold mt-1">
                {activeChar.name}
              </span>
            </div>

            <Swords className="w-8 h-8 text-[#E63946] animate-pulse" />

            {/* Enemy Stickman */}
            <div className="flex flex-col items-center">
              <StickmanFigure type={stage.isBoss ? 'tank' : 'basic'} color="#E63946" size={110} animated={true} />
              <span className="font-tech text-xs text-[#E63946] font-bold mt-1">
                {stage.isBoss ? 'Boss Titan' : 'Shadow Grunt'}
              </span>
            </div>
          </div>

          <div className="bg-[#16213E] p-3 rounded-xl border border-white/10 text-xs font-tech text-white/70">
            Phase 1 UI Foundation active. The Canvas Combat Engine is scheduled in Phase 3.
          </div>

          {!stageCleared ? (
            <StickwarButton
              variant="accent"
              fullWidth
              size="md"
              icon={<Trophy className="w-4 h-4" />}
              onClick={handleSimulateVictory}
            >
              SIMULATE STAGE CLEAR (3 STARS)
            </StickwarButton>
          ) : (
            <div className="space-y-2">
              <div className="bg-[#06D6A0]/20 border border-[#06D6A0] p-2.5 rounded-xl font-comic text-xl text-[#06D6A0]">
                STAGE CLEAR! +150 COINS
              </div>
              <StickwarButton
                variant="blood"
                fullWidth
                size="md"
                onClick={() => navigate(`/worlds/${world.id}/stages`)}
              >
                RETURN TO STAGE MAP
              </StickwarButton>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Virtual Controls Layout */}
      <footer className="p-4 flex items-end justify-between bg-black/40 backdrop-blur z-20">
        {/* Left: D-Pad */}
        <div className="flex items-center gap-2">
          <button
            onPointerDown={() => sound.playClick()}
            className="w-14 h-14 rounded-2xl bg-[#16213E]/80 border-2 border-white/20 font-comic text-2xl text-white active:bg-[#FFD60A] active:text-black flex items-center justify-center active:scale-95"
          >
            ◀
          </button>
          <button
            onPointerDown={() => sound.playClick()}
            className="w-14 h-14 rounded-2xl bg-[#16213E]/80 border-2 border-white/20 font-comic text-2xl text-white active:bg-[#FFD60A] active:text-black flex items-center justify-center active:scale-95"
          >
            ▶
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-end gap-2.5">
          {/* Ability */}
          <button
            onPointerDown={() => sound.playUpgrade()}
            className="w-12 h-12 rounded-xl bg-[#FFD60A]/80 border-2 border-white text-black font-comic text-xs flex items-center justify-center active:scale-95 shadow-[2px_2px_0px_#000000]"
          >
            SPECIAL
          </button>

          {/* Jump */}
          <button
            onPointerDown={() => sound.playClick()}
            className="w-14 h-14 rounded-2xl bg-[#3B82F6]/80 border-2 border-white text-white font-comic text-sm flex items-center justify-center active:scale-95 shadow-[2px_2px_0px_#000000]"
          >
            JUMP
          </button>

          {/* Attack */}
          <button
            onPointerDown={() => sound.playSlash(1)}
            className="w-16 h-16 rounded-2xl bg-[#E63946] border-2 border-white text-white font-comic text-xl flex items-center justify-center active:scale-95 shadow-[3px_3px_0px_#000000]"
          >
            SLASH
          </button>
        </div>
      </footer>

      {/* Pause Modal */}
      {isPaused && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16213E] border-2 border-[#FFD60A] rounded-2xl p-6 w-full max-w-sm text-center space-y-4 shadow-[6px_6px_0px_#000000]">
            <h2 className="font-comic text-4xl text-[#FFD60A]">GAME PAUSED</h2>

            <div className="space-y-2.5">
              <StickwarButton
                variant="accent"
                fullWidth
                size="md"
                onClick={() => {
                  sound.playClick();
                  setIsPaused(false);
                }}
              >
                RESUME COMBAT
              </StickwarButton>

              <StickwarButton
                variant="slate"
                fullWidth
                size="md"
                onClick={() => {
                  sound.playClick();
                  navigate(`/worlds/${world.id}/stages`);
                }}
              >
                QUIT TO STAGE MAP
              </StickwarButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
