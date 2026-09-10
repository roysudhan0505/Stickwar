import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Star, ChevronRight, Mountain, Trees, Flame, ShieldAlert } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { TopHeader } from '../components/layout/TopHeader';
import { sound } from '../utils/audio';

export const WorldsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useGame();
  const { worlds } = state;

  const worldIcons: Record<number, React.ReactNode> = {
    1: <Mountain className="w-7 h-7 text-[#FFD60A]" />,
    2: <Trees className="w-7 h-7 text-[#06D6A0]" />,
    3: <Flame className="w-7 h-7 text-[#E63946]" />,
    4: <ShieldAlert className="w-7 h-7 text-[#60A5FA]" />,
  };

  const handleWorldClick = (worldId: number, unlocked: boolean) => {
    sound.playClick();
    if (unlocked) {
      navigate(`/worlds/${worldId}/stages`);
    } else {
      sound.playHit();
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#F1F1F1] flex flex-col pb-24">
      <TopHeader title="SELECT WORLD" showBackButton onBack={() => navigate('/home')} />

      <main className="max-w-md w-full mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-tech text-xs text-[#F1F1F1]/70 tracking-wider uppercase">
            Campaign Worlds (4 Territories)
          </p>
          <span className="font-tech text-xs font-bold text-[#FFD60A]">
            {worlds.filter((w) => w.unlocked).length} / {worlds.length} Unlocked
          </span>
        </div>

        <div className="space-y-3.5">
          {worlds.map((world, idx) => {
            const totalStars = world.stages.reduce((acc, s) => acc + s.stars, 0);
            const maxStars = world.stages.length * 3;

            return (
              <motion.div
                key={world.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => handleWorldClick(world.id, world.unlocked)}
                className={`relative rounded-2xl p-4 border-2 transition-all select-none ${
                  world.unlocked
                    ? 'bg-[#16213E] border-[#FFD60A]/80 shadow-[4px_4px_0px_#000000] cursor-pointer hover:border-[#FFD60A] active:scale-[0.98]'
                    : 'bg-[#121B2F]/60 border-white/10 opacity-70 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left World Info */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 ${
                        world.unlocked
                          ? 'bg-[#1A1A2E] border-[#FFD60A] shadow-[2px_2px_0px_#000000]'
                          : 'bg-[#0F172A] border-white/20'
                      }`}
                    >
                      {world.unlocked ? worldIcons[world.id] : <Lock className="w-6 h-6 text-white/40" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-tech text-xs uppercase font-bold text-[#FFD60A]/80 tracking-wider">
                          World {world.id}
                        </span>
                        {world.unlocked && (
                          <div className="flex items-center gap-1 text-[11px] font-tech text-[#FFD60A] font-bold">
                            <Star className="w-3 h-3 fill-[#FFD60A]" />
                            <span>
                              {totalStars}/{maxStars}
                            </span>
                          </div>
                        )}
                      </div>
                      <h2 className="font-comic text-2xl text-[#F1F1F1] tracking-wide">
                        {world.name}
                      </h2>
                      <p className="font-tech text-xs text-[#F1F1F1]/70 line-clamp-1">
                        {world.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Status / Arrow */}
                  <div className="flex items-center pt-2">
                    {world.unlocked ? (
                      <div className="w-8 h-8 rounded-lg bg-[#E63946] flex items-center justify-center text-white shadow-[2px_2px_0px_#000000]">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    ) : (
                      <span className="font-tech text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded-md uppercase font-semibold">
                        Stage 5 Req.
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar inside world card */}
                {world.unlocked && (
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-tech text-[#F1F1F1]/70">
                    <span>Stages 1 – 5</span>
                    <span className="text-[#06D6A0] font-bold">
                      {world.stages.filter((s) => s.stars > 0).length} / 5 Cleared
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
