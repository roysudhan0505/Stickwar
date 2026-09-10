import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Coins,
  Swords,
  Shield,
  Star,
  ArrowRight,
  Home,
  CheckCircle,
  Gift,
  Skull,
  Share2,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GameEngine } from '../game/engine/GameEngine';
import { InputControls } from '../game/engine/types';
import { StickwarCanvas } from '../game/components/StickwarCanvas';
import { VirtualControls } from '../game/components/VirtualControls';
import { useGameLoop } from '../game/useGameLoop';
import { StickwarButton } from '../components/ui/StickwarButton';
import { sound } from '../utils/audio';

export const GameplayScreen: React.FC = () => {
  const { worldId, stageId } = useParams<{ worldId: string; stageId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { worlds, characters, player } = state;

  const currentWorldId = Number(worldId) || 1;
  const currentStageId = Number(stageId) || 1;
  const world = worlds.find((w) => w.id === currentWorldId) || worlds[0];
  const stage = world.stages.find((s) => s.stageId === currentStageId) || world.stages[0];
  const activeChar = characters[player.activeCharacterId] || characters.basic_stick;

  // Active Game State
  const [isPaused, setIsPaused] = useState(false);
  const [isStageWon, setIsStageWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [causeOfDeath, setCauseOfDeath] = useState('Defeated in Combat');
  const [chestOpened, setChestOpened] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Stats gathered during run
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [killsCount, setKillsCount] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentWave, setCurrentWave] = useState(1);
  const [totalWaves, setTotalWaves] = useState(3);
  const [activeBoss, setActiveBoss] = useState<any>(null);
  const [starsEarned, setStarsEarned] = useState(1);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [lastPowerUpToast, setLastPowerUpToast] = useState<string | null>(null);
  const [awardedShards, setAwardedShards] = useState<{ characterId: string; count: number; name: string } | null>(null);

  // Active buff seconds display
  const [buffTimers, setBuffTimers] = useState({ shield: 0, damage: 0, speed: 0 });

  // Random tips for Game Over
  const gameOverTips = [
    'Tip: Shield Bearers can only be struck from behind while their shield is up!',
    'Tip: Use your special ability when surrounded by swarms to clear space.',
    'Tip: Upgrade your Attack & Defense at the Warriors screen with looted coins.',
    'Tip: Watch for archers on elevated ledges—jump attack to eliminate them early!',
    'Tip: Keep combos alive to multiply your final stage combat score!',
  ];
  const [randomTip, setRandomTip] = useState(gameOverTips[0]);

  // Input Controls State
  const controlsRef = useRef<InputControls>({
    left: false,
    right: false,
    jump: false,
    attack: false,
    special: false,
  });

  // Target canvas reference for rendering
  const canvasComponentRef = useRef<any>(null);

  // Initialize Game Engine
  const engine = useMemo(() => {
    const eng = new GameEngine(
      {
        silhouetteType: activeChar.silhouetteType,
        hp: activeChar.currentStats.hp,
        atk: activeChar.currentStats.atk,
        speed: activeChar.currentStats.spd,
        name: activeChar.name,
      },
      currentWorldId,
      currentStageId
    );

    eng.onScoreUpdate = (pts, gold) => {
      setScore((prev) => prev + pts);
      setCoinsCollected((prev) => prev + gold);
      setKillsCount((prev) => prev + 1);
    };

    eng.onGameOver = (cause) => {
      setCauseOfDeath(cause);
      setRandomTip(gameOverTips[Math.floor(Math.random() * gameOverTips.length)]);
      setIsGameOver(true);
      sound.playGameOver();
      sound.vibrate(200);
    };

    eng.onStageWon = () => {
      handleStageVictory();
    };

    eng.onPowerUpCollected = (_type, title) => {
      setLastPowerUpToast(title);
      setTimeout(() => setLastPowerUpToast((curr) => (curr === title ? null : curr)), 2200);
    };

    setTotalWaves(eng.enemyManager.wave.totalWaves);

    return eng;
  }, [activeChar, currentWorldId, currentStageId]);

  // Handle Controls update from VirtualControls or Keyboard
  const handleControlsChange = (nextControls: InputControls) => {
    controlsRef.current = nextControls;
  };

  // Main 60 FPS Game Loop
  useGameLoop({
    isRunning: !isPaused && !isStageWon && !isGameOver,
    onTick: (dt) => {
      // 1. Update Game Physics & Combat Simulation
      engine.update(dt, controlsRef.current);

      // Track max combo
      if (engine.comboCount > maxCombo) {
        setMaxCombo(engine.comboCount);
      }

      setElapsedTime((prev) => prev + dt);
      setCurrentWave(engine.enemyManager.wave.currentWave);
      setActiveBoss(engine.getActiveBoss());

      // Update HUD buff countdowns
      setBuffTimers({
        shield: Math.ceil(engine.player.shieldBuffTimer),
        damage: Math.ceil(engine.player.damageBuffTimer),
        speed: Math.ceil(engine.player.speedBuffTimer),
      });

      // 2. Trigger Render Frame on Canvas
      const canvasEl = document.querySelector('canvas') as any;
      if (canvasEl && canvasEl.renderFrame) {
        canvasEl.renderFrame();
      }
    },
  });

  const handleStageVictory = () => {
    setIsStageWon(true);
    sound.playUpgrade();
    sound.vibrate(100);

    // 3-Star Criteria:
    // Star 1: Waves cleared (always awarded on victory)
    // Star 2: Time trial: under 75 seconds
    // Star 3: Iron defense: final health >= 50%
    const timeTrialMet = elapsedTime <= 75;
    const flawlessMet = engine.player.hp >= engine.player.maxHp * 0.5;
    const calculatedStars = 1 + (timeTrialMet ? 1 : 0) + (flawlessMet ? 1 : 0);
    setStarsEarned(calculatedStars);

    const finalCoins = coinsCollected + 150;
    const finalScore = score + 5000 + calculatedStars * 1500;

    if (finalScore > (stage.bestScore || 0)) {
      setIsNewHighScore(true);
    }

    // Determine Character Shards Reward
    let shardReward: { characterId: string; count: number; name: string } | null = null;
    if (currentStageId === 5) {
      if (currentWorldId === 1) shardReward = { characterId: 'ninja_stick', count: 6, name: 'Shadow Ninja' };
      else if (currentWorldId === 2) shardReward = { characterId: 'mage_stick', count: 8, name: 'Arcane Mage' };
      else if (currentWorldId === 3) shardReward = { characterId: 'tank_stick', count: 10, name: 'Iron Juggernaut' };
      else if (currentWorldId === 4) shardReward = { characterId: 'sky_stick', count: 15, name: 'Sky Sovereign' };
    } else if (currentStageId >= 3) {
      const targetChar =
        currentWorldId === 1
          ? 'ninja_stick'
          : currentWorldId === 2
          ? 'mage_stick'
          : currentWorldId === 3
          ? 'tank_stick'
          : 'sky_stick';
      const charName =
        currentWorldId === 1
          ? 'Shadow Ninja'
          : currentWorldId === 2
          ? 'Arcane Mage'
          : currentWorldId === 3
          ? 'Iron Juggernaut'
          : 'Sky Sovereign';
      shardReward = { characterId: targetChar, count: 2, name: charName };
    }
    setAwardedShards(shardReward);

    dispatch({
      type: 'COMPLETE_STAGE',
      worldId: currentWorldId,
      stageId: currentStageId,
      stars: calculatedStars,
      score: finalScore,
      timeSeconds: Math.round(elapsedTime),
      coinsEarned: finalCoins,
      killsCount: killsCount + 1,
      shardsAwarded: shardReward ? { characterId: shardReward.characterId, count: shardReward.count } : undefined,
    });
  };

  const handleRestart = () => {
    sound.playClick();
    setIsPaused(false);
    setIsStageWon(false);
    setIsGameOver(false);
    setScore(0);
    setCoinsCollected(0);
    setElapsedTime(0);
    setKillsCount(0);
    setIsNewHighScore(false);
    setChestOpened(false);
    setAwardedShards(null);
    setLastPowerUpToast(null);

    // Reset player position, buffs, and health
    engine.collectibles = [];
    engine.player.shieldBuffTimer = 0;
    engine.player.damageBuffTimer = 0;
    engine.player.speedBuffTimer = 0;
    engine.player.x = 180;
    engine.player.y = engine.stage.groundY;
    engine.player.vx = 0;
    engine.player.vy = 0;
    engine.player.hp = engine.player.maxHp;
    engine.player.state = 'idle';
    engine.player.specialCooldown = 0;
    engine.enemyManager.enemies = [];
    engine.enemyManager.spawnWave(1);
  };

  const handleShareScore = async () => {
    sound.playClick();
    const shareText = `⚔️ I conquered ${world.name} — Stage ${stage.stageId} in Stickwar with ${score + 5000} PTS and ${starsEarned} Stars! Can you beat my score?`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Stickwar — Stickman Adventure PWA',
          text: shareText,
          url: window.location.origin,
        });
        setShareFeedback('Shared successfully!');
      } catch (err) {
        // user dismissed or share error
      }
    } else {
      navigator.clipboard?.writeText(shareText);
      setShareFeedback('Score copied to clipboard!');
      setTimeout(() => setShareFeedback(null), 2500);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#1A1A2E] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* 1. TOP COMBAT HUD */}
      <header className="p-3 bg-gradient-to-b from-[#16213E]/95 to-transparent backdrop-blur-sm flex items-center justify-between z-20 pointer-events-auto">
        {/* Left: Player HP & Character Icon */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#E63946] border-2 border-white flex items-center justify-center font-comic text-xl shadow-[2px_2px_0px_#000000]">
            HP
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px] font-tech font-bold text-white/90 mb-0.5">
              <span>{activeChar.name.toUpperCase()}</span>
              <span className="text-[#FFD60A]">
                {engine.player.hp} / {engine.player.maxHp}
              </span>
            </div>
            <div className="w-32 sm:w-44 h-3 bg-black/60 rounded-full border border-white/20 overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#E63946] to-[#FFD60A] rounded-full transition-all duration-150"
                style={{
                  width: `${Math.max(0, (engine.player.hp / engine.player.maxHp) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Center: Stage Info, Wave & Score */}
        <div className="text-center">
          <div className="font-comic text-sm text-[#FFD60A] uppercase tracking-wider flex items-center justify-center gap-1.5">
            <span>{world.name}</span>
            <span className="text-white/40">•</span>
            <span>WAVE {currentWave}/{totalWaves}</span>
          </div>
          <div className="font-tech text-xs text-white/80 font-bold tracking-wider">
            SCORE: <span className="text-[#06D6A0]">{score}</span>
          </div>
        </div>

        {/* Right: Coins & Pause Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#16213E] px-2.5 py-1 rounded-xl border border-white/20 shadow-[2px_2px_0px_#000000]">
            <Coins className="w-4 h-4 text-[#FFD60A]" />
            <span className="font-tech text-xs text-[#FFD60A] font-bold">
              {player.goldCoins + coinsCollected}
            </span>
          </div>

          <button
            id="btn-pause-game"
            onClick={() => {
              sound.playClick();
              setIsPaused(true);
            }}
            className="w-10 h-10 rounded-xl bg-[#16213E] border-2 border-white/30 flex items-center justify-center text-white hover:border-[#FFD60A] active:scale-95 shadow-[2px_2px_0px_#000000]"
            aria-label="Pause Game"
          >
            <Pause className="w-5 h-5 fill-white" />
          </button>
        </div>
      </header>

      {/* Active Buff Badges */}
      {(buffTimers.shield > 0 || buffTimers.damage > 0 || buffTimers.speed > 0) && (
        <div className="absolute top-16 left-4 z-20 flex gap-1.5 pointer-events-none animate-in fade-in duration-150">
          {buffTimers.shield > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#FFD60A]/20 border border-[#FFD60A] text-[#FFD60A] text-[10px] font-tech font-bold flex items-center gap-1 shadow">
              🛡 Shield {buffTimers.shield}s
            </span>
          )}
          {buffTimers.damage > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#FF5400]/20 border border-[#FF5400] text-[#FF5400] text-[10px] font-tech font-bold flex items-center gap-1 shadow">
              ⚔ Dmg 1.5x {buffTimers.damage}s
            </span>
          )}
          {buffTimers.speed > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] text-[10px] font-tech font-bold flex items-center gap-1 shadow">
              ⚡ Spd +40% {buffTimers.speed}s
            </span>
          )}
        </div>
      )}

      {/* Power-up Collection Toast Banner */}
      {lastPowerUpToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in slide-in-from-top duration-200">
          <div className="bg-[#16213E]/90 border border-[#06D6A0] px-3.5 py-1 rounded-full text-xs font-tech font-bold text-[#06D6A0] shadow-[0_4px_12px_rgba(6,214,160,0.3)]">
            ✨ {lastPowerUpToast}
          </div>
        </div>
      )}

      {/* BOSS HEALTH BAR (Appears during Boss encounters) */}
      {activeBoss && !activeBoss.isDead && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-11/12 max-w-md z-30 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-[#16213E]/95 backdrop-blur-md border-2 border-[#E63946] rounded-2xl p-2.5 shadow-[4px_4px_0px_#000000]">
            <div className="flex justify-between items-center mb-1">
              <span className="font-comic text-sm text-[#FFD60A] tracking-wider flex items-center gap-1.5">
                <Skull className="w-4 h-4 text-[#E63946]" />
                BOSS: {activeBoss.name.toUpperCase()}
              </span>
              <span className="font-tech text-xs text-white/90 font-bold">
                {activeBoss.hp} / {activeBoss.maxHp}
              </span>
            </div>
            <div className="w-full h-3.5 bg-black/70 rounded-full border border-white/20 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#E63946] via-[#FFD60A] to-[#E63946] rounded-full transition-all duration-100"
                style={{ width: `${Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. COMBO ANNOUNCEMENT BANNER */}
      {engine.comboCount >= 2 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center animate-bounce">
          <span className="font-comic text-3xl sm:text-4xl text-[#FFD60A] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] tracking-wider">
            COMBO x{engine.comboCount}!
          </span>
        </div>
      )}

      {/* 3. CANVAS GAMEPLAY VIEWPORT */}
      <div className="relative flex-1 w-full h-full">
        <StickwarCanvas engine={engine} className="w-full h-full" />
      </div>

      {/* 4. VIRTUAL CONTROLS OVERLAY */}
      {!isPaused && !isStageWon && !isGameOver && (
        <VirtualControls
          onControlsChange={handleControlsChange}
          specialCooldownPercent={engine.player.specialCooldown / engine.player.maxSpecialCooldown}
          specialCooldownSeconds={engine.player.specialCooldown}
          comboStep={engine.player.comboStep}
        />
      )}

      {/* 5. PAUSE MODAL OVERLAY */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-[#16213E] border-3 border-[#FFD60A] p-6 shadow-[8px_8px_0px_#000000] text-center space-y-5">
            <h2 className="font-comic text-4xl text-[#FFD60A] tracking-wider">
              GAME PAUSED
            </h2>

            <div className="bg-[#1A1A2E] p-4 rounded-2xl border border-white/10 space-y-2 text-left font-tech">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Current Stage:</span>
                <span className="text-[#FFD60A] font-bold">{world.name} - Stage {stage.stageId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Enemies Defeated:</span>
                <span className="text-white font-bold">{killsCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Gold Looted:</span>
                <span className="text-[#FFD60A] font-bold">+{coinsCollected} G</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <StickwarButton
                variant="accent"
                fullWidth
                size="lg"
                icon={<Play className="w-5 h-5 fill-current" />}
                onClick={() => {
                  sound.playClick();
                  setIsPaused(false);
                }}
              >
                RESUME COMBAT
              </StickwarButton>

              <StickwarButton
                variant="secondary"
                fullWidth
                size="md"
                icon={<RotateCcw className="w-5 h-5" />}
                onClick={handleRestart}
              >
                RESTART STAGE
              </StickwarButton>

              <StickwarButton
                variant="ghost"
                fullWidth
                size="md"
                icon={<Home className="w-5 h-5" />}
                onClick={() => {
                  sound.playClick();
                  navigate(`/worlds/${currentWorldId}/stages`);
                }}
              >
                QUIT TO STAGES
              </StickwarButton>
            </div>
          </div>
        </div>
      )}

      {/* 6. STAGE RESULTS MODAL OVERLAY */}
      {isStageWon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-[#16213E] border-3 border-[#FFD60A] p-5 shadow-[8px_8px_0px_#000000] text-center space-y-4 my-auto">
            {/* Victory Banner */}
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="inline-block bg-[#06D6A0] text-[#1A1A2E] font-tech font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                  VICTORY ACHIEVED
                </span>
                {isNewHighScore && (
                  <span className="inline-block bg-[#FFD60A] text-[#1A1A2E] font-tech font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                    NEW RECORD!
                  </span>
                )}
              </div>
              <h2 className="font-comic text-4xl text-[#FFD60A] tracking-wider drop-shadow-[2px_2px_0px_#000]">
                STAGE CLEAR!
              </h2>
            </div>

            {/* 3-Star Rating Animation */}
            <div className="flex items-center justify-center gap-3 py-1">
              {[1, 2, 3].map((starIndex) => {
                const isEarned = starIndex <= starsEarned;
                return (
                  <Star
                    key={starIndex}
                    className={`w-11 h-11 transition-all duration-300 ${
                      isEarned
                        ? 'fill-[#FFD60A] text-[#FFD60A] animate-bounce drop-shadow-[0_0_8px_#FFD60A]'
                        : 'text-white/20 fill-white/5'
                    }`}
                  />
                );
              })}
            </div>

            {/* Star Objectives Breakdown */}
            <div className="bg-[#1A1A2E]/80 p-3 rounded-xl border border-white/10 text-xs font-tech space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-white/80 flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-[#FFD60A] text-[#FFD60A]" /> Primary: Defeat All Waves
                </span>
                <span className="text-[#06D6A0] font-bold">COMPLETED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80 flex items-center gap-1.5">
                  <Star className={`w-3 h-3 ${elapsedTime <= 75 ? 'fill-[#FFD60A] text-[#FFD60A]' : 'text-white/30'}`} /> Speed: Clear in &lt; 75s ({Math.round(elapsedTime)}s)
                </span>
                <span className={elapsedTime <= 75 ? 'text-[#06D6A0] font-bold' : 'text-white/40'}>
                  {elapsedTime <= 75 ? 'COMPLETED' : 'MISSED'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80 flex items-center gap-1.5">
                  <Star className={`w-3 h-3 ${engine.player.hp >= engine.player.maxHp * 0.5 ? 'fill-[#FFD60A] text-[#FFD60A]' : 'text-white/30'}`} /> Flawless: Finish with &gt; 50% HP
                </span>
                <span className={engine.player.hp >= engine.player.maxHp * 0.5 ? 'text-[#06D6A0] font-bold' : 'text-white/40'}>
                  {engine.player.hp >= engine.player.maxHp * 0.5 ? 'COMPLETED' : 'MISSED'}
                </span>
              </div>
            </div>

            {/* Performance Breakdown Card */}
            <div className="bg-[#1A1A2E] p-3.5 rounded-2xl border border-white/10 space-y-1.5 text-xs font-tech">
              <div className="flex justify-between">
                <span className="text-white/60">Time Taken:</span>
                <span className="text-white font-bold">{Math.round(elapsedTime)} seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Enemies Defeated:</span>
                <span className="text-[#06D6A0] font-bold">{killsCount} stickmen</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Highest Combo:</span>
                <span className="text-[#FFD60A] font-bold">x{maxCombo} hits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Total Combat Score:</span>
                <span className="text-[#FFD60A] font-bold">+{score + 5000 + starsEarned * 1500} PTS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Gold Earned:</span>
                <span className="text-[#FFD60A] font-bold">+{coinsCollected + 150} COINS</span>
              </div>
            </div>

            {/* Chest Reward Box */}
            <div
              onClick={() => {
                if (!chestOpened) {
                  sound.playUpgrade();
                  setChestOpened(true);
                }
              }}
              className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                chestOpened
                  ? 'bg-[#06D6A0]/15 border-[#06D6A0]'
                  : 'bg-[#FFD60A]/10 border-[#FFD60A] hover:scale-102 active:scale-98 animate-pulse'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-1 text-center">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#FFD60A]" />
                  <span className="font-comic text-base text-[#FFD60A]">
                    {chestOpened ? 'CHEST REWARD UNLOCKED!' : 'TAP TO OPEN STAGE CHEST!'}
                  </span>
                </div>
                {chestOpened && (
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-tech font-bold mt-0.5">
                    <span className="text-[#06D6A0] bg-[#06D6A0]/10 px-2 py-0.5 rounded-lg border border-[#06D6A0]/30">
                      +150 GOLD
                    </span>
                    {awardedShards && (
                      <span className="text-[#FFD60A] bg-[#FFD60A]/10 px-2 py-0.5 rounded-lg border border-[#FFD60A]/30">
                        +{awardedShards.count} {awardedShards.name.toUpperCase()} SHARDS
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Share Feedback Toast */}
            {shareFeedback && (
              <div className="bg-[#06D6A0] text-[#1A1A2E] text-xs font-tech font-bold py-1.5 px-3 rounded-lg animate-in fade-in duration-200">
                {shareFeedback}
              </div>
            )}

            {/* Next Stage & Menu Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <StickwarButton
                variant="secondary"
                size="md"
                onClick={() => navigate(`/worlds/${currentWorldId}/stages`)}
              >
                STAGES MAP
              </StickwarButton>

              <StickwarButton
                variant="blood"
                size="md"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => {
                  sound.playClick();
                  const nextStageNum = currentStageId + 1;
                  if (nextStageNum <= 5) {
                    navigate(`/worlds/${currentWorldId}/stages/${nextStageNum}/briefing`);
                  } else {
                    navigate('/worlds');
                  }
                }}
              >
                NEXT STAGE
              </StickwarButton>
            </div>

            {/* Replay & Share Row */}
            <div className="grid grid-cols-2 gap-2">
              <StickwarButton
                variant="ghost"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={handleRestart}
              >
                RETRY STAGE
              </StickwarButton>

              <StickwarButton
                variant="ghost"
                size="sm"
                icon={<Share2 className="w-3.5 h-3.5" />}
                onClick={handleShareScore}
              >
                SHARE SCORE
              </StickwarButton>
            </div>
          </div>
        </div>
      )}

      {/* 7. GAME OVER MODAL OVERLAY */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#16213E] border-3 border-[#E63946] p-6 shadow-[8px_8px_0px_#000000] text-center space-y-4">
            <div>
              <span className="inline-block bg-[#E63946] text-white font-tech font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                COMBAT DEFEAT
              </span>
              <h2 className="font-comic text-4xl text-[#E63946] tracking-wider drop-shadow-[2px_2px_0px_#000]">
                YOU DIED
              </h2>
              <p className="font-tech text-sm text-white/80 mt-1 font-semibold">{causeOfDeath}</p>
            </div>

            {/* Progress this run */}
            <div className="bg-[#1A1A2E] p-3.5 rounded-2xl border border-white/10 space-y-1.5 text-xs font-tech text-left">
              <div className="flex justify-between">
                <span className="text-white/60">Stage Waves:</span>
                <span className="text-[#FFD60A] font-bold">Wave {currentWave}/{totalWaves}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Enemies Defeated:</span>
                <span className="text-white font-bold">{killsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Gold Salvaged:</span>
                <span className="text-[#FFD60A] font-bold">+{Math.floor(coinsCollected * 0.5)} G</span>
              </div>
            </div>

            {/* Random Gameplay Hint */}
            <div className="bg-[#1A1A2E]/60 p-2.5 rounded-xl border border-white/5 text-[11px] font-tech text-[#FFD60A]/90 italic">
              {randomTip}
            </div>

            <div className="space-y-2.5 pt-1">
              <StickwarButton
                variant="blood"
                fullWidth
                size="lg"
                icon={<RotateCcw className="w-5 h-5" />}
                onClick={handleRestart}
              >
                TRY AGAIN
              </StickwarButton>

              <StickwarButton
                variant="secondary"
                fullWidth
                size="md"
                icon={<Home className="w-5 h-5" />}
                onClick={() => navigate(`/worlds/${currentWorldId}/stages`)}
              >
                RETURN TO MENU
              </StickwarButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
