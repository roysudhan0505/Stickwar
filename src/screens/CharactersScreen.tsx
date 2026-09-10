import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, Swords, Sparkles, Check, Lock, ChevronLeft, ArrowUpCircle, Coins } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { TopHeader } from '../components/layout/TopHeader';
import { StickwarButton } from '../components/ui/StickwarButton';
import { StickmanFigure } from '../components/StickmanFigure';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Character, CharacterUpgradeTiers } from '../types/game';
import { sound } from '../utils/audio';

export const CharactersScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { characters, player } = state;

  const charList: Character[] = Object.values(characters);
  const [selectedCharId, setSelectedCharId] = useState<string>(player.activeCharacterId);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  const char = characters[selectedCharId] || characters.basic_stick;
  const isActive = player.activeCharacterId === char.id;

  const handleSelectActive = (charId: string) => {
    dispatch({ type: 'SELECT_CHARACTER', characterId: charId });
  };

  const handleUnlock = (charId: string) => {
    dispatch({ type: 'UNLOCK_CHARACTER', characterId: charId });
  };

  const handleUpgradeStat = (statKey: keyof CharacterUpgradeTiers, cost: number) => {
    dispatch({
      type: 'UPGRADE_STAT',
      characterId: char.id,
      statKey,
      cost,
    });
  };

  const getUpgradeCost = (tier: number) => {
    return 150 + tier * 150; // 150, 300, 450
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#F1F1F1] flex flex-col pb-24">
      <TopHeader
        title="WARRIORS"
        showBackButton
        onBack={() => navigate('/home')}
      />

      <main className="max-w-md w-full mx-auto px-4 py-3 flex-1 flex flex-col justify-between space-y-3">
        {/* Horizontal Character Carousel Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {charList.map((c) => {
            const isCardSelected = c.id === selectedCharId;
            const isEquipped = player.activeCharacterId === c.id;

            return (
              <button
                key={c.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedCharId(c.id);
                }}
                className={`flex-shrink-0 w-24 p-2.5 rounded-xl border-2 flex flex-col items-center transition-all select-none relative ${
                  isCardSelected
                    ? 'bg-[#16213E] border-[#FFD60A] shadow-[0_0_10px_rgba(255,214,10,0.4)] scale-102'
                    : 'bg-[#16213E]/60 border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                {/* Equipped Badge */}
                {isEquipped && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#06D6A0] text-black text-[9px] font-tech font-bold px-1.5 py-0.2 rounded-full uppercase">
                    ACTIVE
                  </span>
                )}

                {/* Character Icon / Stickman */}
                <div className="w-14 h-14 flex items-center justify-center">
                  <StickmanFigure
                    type={c.silhouetteType}
                    color="#F1F1F1"
                    size={56}
                    animated={false}
                  />
                </div>

                <span className="font-comic text-xs text-white text-center mt-1 truncate w-full">
                  {c.name}
                </span>

                {/* Lock or Rarity */}
                {!c.unlocked ? (
                  <div className="flex items-center gap-1 text-[9px] font-tech text-yellow-400 mt-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{c.shards}/{c.shardsRequired}</span>
                  </div>
                ) : (
                  <span className="text-[9px] font-tech text-white/60 uppercase">
                    {c.rarity}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Character Showcase Card */}
        <div className="bg-[#16213E] border-2 border-[#FFD60A] rounded-2xl p-4 shadow-[4px_4px_0px_#000000] relative overflow-hidden">
          {/* Background class effect */}
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none font-comic text-8xl">
            {char.silhouetteType.toUpperCase()}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-tech font-bold uppercase text-[#FFD60A]">
                  {char.rarity} Class
                </span>
                {isActive && (
                  <span className="bg-[#06D6A0] text-black text-[10px] font-tech font-bold px-2 py-0.2 rounded">
                    CURRENT WARRIOR
                  </span>
                )}
              </div>
              <h2 className="font-comic text-3xl text-white">{char.name}</h2>
            </div>
          </div>

          <p className="font-tech text-xs text-[#F1F1F1]/70 my-2">{char.description}</p>

          {/* Stickman Center Stage */}
          <div className="flex items-center justify-center my-2 bg-[#1A1A2E]/50 rounded-xl py-3 border border-white/5">
            <StickmanFigure
              type={char.silhouetteType}
              color="#F1F1F1"
              size={130}
              animated={true}
            />
          </div>

          {/* Stats Breakdown */}
          <div className="space-y-2 mt-2">
            <ProgressBar
              label="Attack Power"
              value={char.currentStats.atk}
              max={60}
              subLabel={`${char.currentStats.atk} ATK`}
              color="accent"
              height="sm"
            />
            <ProgressBar
              label="Health Pool"
              value={char.currentStats.hp}
              max={250}
              subLabel={`${char.currentStats.hp} HP`}
              color="neon"
              height="sm"
            />
            <ProgressBar
              label="Movement Agility"
              value={Math.round(char.currentStats.spd * 10)}
              max={100}
              subLabel={`${char.currentStats.spd} SPD`}
              color="blue"
              height="sm"
            />
            <ProgressBar
              label="Special Ability Power"
              value={char.currentStats.ability}
              max={80}
              subLabel={`${char.currentStats.ability} PWR`}
              color="blood"
              height="sm"
            />
          </div>

          {/* Special Ability Pill */}
          <div className="mt-3 bg-[#1A1A2E] p-2.5 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="font-tech text-[10px] text-[#FFD60A] uppercase font-bold block">
                SPECIAL ABILITY ({char.specialAbility.cooldown}s Cooldown)
              </span>
              <span className="font-comic text-base text-white">
                {char.specialAbility.name}
              </span>
              <p className="font-tech text-xs text-white/60">{char.specialAbility.description}</p>
            </div>
            <Zap className="w-6 h-6 text-[#FFD60A] flex-shrink-0 fill-[#FFD60A]/20" />
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2">
          {char.unlocked ? (
            <div className="grid grid-cols-2 gap-2">
              <StickwarButton
                variant={isActive ? 'slate' : 'accent'}
                size="md"
                onClick={() => handleSelectActive(char.id)}
                disabled={isActive}
              >
                {isActive ? 'EQUIPPED' : 'EQUIP WARRIOR'}
              </StickwarButton>

              <StickwarButton
                variant="blood"
                size="md"
                icon={<ArrowUpCircle className="w-4 h-4" />}
                onClick={() => {
                  sound.playClick();
                  setShowUpgradeModal(true);
                }}
              >
                UPGRADE TREE
              </StickwarButton>
            </div>
          ) : (
            <div className="space-y-2">
              <ProgressBar
                label="Character Shards"
                value={char.shards}
                max={char.shardsRequired}
                color="accent"
              />
              <StickwarButton
                variant="accent"
                fullWidth
                size="md"
                disabled={char.shards < char.shardsRequired}
                onClick={() => handleUnlock(char.id)}
              >
                {char.shards >= char.shardsRequired
                  ? 'UNLOCK WARRIOR'
                  : `COLLECT SHARDS (${char.shards}/${char.shardsRequired})`}
              </StickwarButton>
            </div>
          )}
        </div>
      </main>

      {/* Upgrade Tree Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#16213E] border-2 border-[#FFD60A] rounded-2xl p-5 w-full max-w-md shadow-[6px_6px_0px_#000000] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-comic text-2xl text-[#FFD60A]">UPGRADE {char.name}</h3>
                  <p className="font-tech text-xs text-white/70">
                    Enhance warrior attributes using earned gold coins.
                  </p>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="p-1 text-white/60 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Upgrade Categories */}
              <div className="space-y-2.5">
                {(
                  [
                    { key: 'atk', label: 'Attack Power', icon: Swords, color: '#FFD60A' },
                    { key: 'def', label: 'Defense / Health', icon: Shield, color: '#06D6A0' },
                    { key: 'spd', label: 'Agility / Speed', icon: Zap, color: '#3B82F6' },
                    { key: 'ability', label: 'Ability Burst', icon: Sparkles, color: '#E63946' },
                  ] as const
                ).map(({ key, label, icon: Icon, color }) => {
                  const currentTier = char.upgradeTiers[key];
                  const cost = getUpgradeCost(currentTier);
                  const isMax = currentTier >= 3;
                  const canAfford = player.goldCoins >= cost;

                  return (
                    <div
                      key={key}
                      className="bg-[#1A1A2E] p-3 rounded-xl border border-white/10 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center border"
                          style={{ backgroundColor: `${color}15`, borderColor: color }}
                        >
                          <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                        <div>
                          <span className="font-tech font-bold text-sm text-white block">
                            {label}
                          </span>
                          <div className="flex gap-1 mt-0.5">
                            {[1, 2, 3].map((tierIdx) => (
                              <span
                                key={tierIdx}
                                className={`w-3 h-1.5 rounded-sm ${
                                  tierIdx <= currentTier ? 'bg-[#FFD60A]' : 'bg-white/10'
                                }`}
                              />
                            ))}
                            <span className="text-[10px] font-tech text-white/50 ml-1">
                              {isMax ? 'MAX' : `Tier ${currentTier}/3`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isMax ? (
                        <span className="font-tech text-xs font-bold text-[#06D6A0] bg-[#06D6A0]/10 px-2 py-1 rounded">
                          MAXED
                        </span>
                      ) : (
                        <StickwarButton
                          variant="accent"
                          size="sm"
                          disabled={!canAfford}
                          onClick={() => handleUpgradeStat(key, cost)}
                        >
                          <div className="flex items-center gap-1 text-xs">
                            <Coins className="w-3.5 h-3.5" />
                            <span>{cost}</span>
                          </div>
                        </StickwarButton>
                      )}
                    </div>
                  );
                })}
              </div>

              <StickwarButton
                variant="slate"
                fullWidth
                size="md"
                onClick={() => setShowUpgradeModal(false)}
              >
                CLOSE TREE
              </StickwarButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
