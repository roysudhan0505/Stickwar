import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GameState, PlayerProfile, CharacterUpgradeTiers, SettingsState } from '../types/game';
import {
  INITIAL_CHARACTERS,
  INITIAL_WORLDS,
  INITIAL_ACHIEVEMENTS,
  INITIAL_DAILY_REWARDS,
  INITIAL_PROFILE,
  INITIAL_SETTINGS,
} from '../data/initialGameData';
import { sound } from '../utils/audio';

type GameAction =
  | { type: 'SELECT_CHARACTER'; characterId: string }
  | { type: 'UPGRADE_STAT'; characterId: string; statKey: keyof CharacterUpgradeTiers; cost: number }
  | { type: 'UNLOCK_CHARACTER'; characterId: string }
  | { type: 'ADD_SHARDS'; characterId: string; amount: number }
  | { type: 'ADD_GOLD'; amount: number }
  | { type: 'CLAIM_DAILY_REWARD'; day: number }
  | { type: 'CLAIM_ACHIEVEMENT'; achievementId: string }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<SettingsState> }
  | { type: 'UPDATE_PROFILE'; profile: Partial<PlayerProfile> }
  | { type: 'TOGGLE_DAILY_MODAL'; open: boolean }
  | {
      type: 'COMPLETE_STAGE';
      worldId: number;
      stageId: number;
      stars: number;
      score: number;
      timeSeconds: number;
      coinsEarned: number;
      killsCount: number;
      shardsAwarded?: { characterId: string; count: number };
    };

const STORAGE_KEY = 'stickwar_save_state_v1';

const loadSavedState = (): GameState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        showDailyRewardModal: false, // Don't auto open if dismissed
      };
    }
  } catch (err) {
    console.warn('Failed to load local state, using defaults', err);
  }

  return {
    player: INITIAL_PROFILE,
    characters: INITIAL_CHARACTERS,
    worlds: INITIAL_WORLDS,
    achievements: INITIAL_ACHIEVEMENTS,
    dailyRewards: INITIAL_DAILY_REWARDS,
    settings: INITIAL_SETTINGS,
    showDailyRewardModal: false,
  };
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_CHARACTER': {
      sound.playClick();
      return {
        ...state,
        player: {
          ...state.player,
          activeCharacterId: action.characterId,
        },
      };
    }

    case 'UPGRADE_STAT': {
      const char = state.characters[action.characterId];
      if (!char || state.player.goldCoins < action.cost) return state;

      const currentTier = char.upgradeTiers[action.statKey];
      if (currentTier >= 3) return state;

      const newTiers = {
        ...char.upgradeTiers,
        [action.statKey]: currentTier + 1,
      };

      // Stat multiplier calculation
      const updatedStats = {
        hp: Math.round(char.baseStats.hp + newTiers.def * 25),
        atk: Math.round(char.baseStats.atk + newTiers.atk * 6),
        spd: Number((char.baseStats.spd + newTiers.spd * 0.4).toFixed(1)),
        ability: Math.round(char.baseStats.ability + newTiers.ability * 12),
      };

      sound.playUpgrade();

      return {
        ...state,
        player: {
          ...state.player,
          goldCoins: state.player.goldCoins - action.cost,
        },
        characters: {
          ...state.characters,
          [action.characterId]: {
            ...char,
            upgradeTiers: newTiers,
            currentStats: updatedStats,
          },
        },
      };
    }

    case 'UNLOCK_CHARACTER': {
      const char = state.characters[action.characterId];
      if (!char || char.unlocked || char.shards < char.shardsRequired) return state;

      sound.playUpgrade();
      const updatedChars = {
        ...state.characters,
        [action.characterId]: {
          ...char,
          unlocked: true,
          shards: char.shards - char.shardsRequired,
        },
      };

      // Count unlocked characters for Collector I achievement
      const totalUnlocked = Object.values(updatedChars).filter((c) => c.unlocked).length;
      const updatedAchievements = state.achievements.map((ach) => {
        if (ach.id === 'collector_1') {
          return {
            ...ach,
            progress: Math.min(totalUnlocked, ach.target),
          };
        }
        return ach;
      });

      return {
        ...state,
        characters: updatedChars,
        achievements: updatedAchievements,
      };
    }

    case 'ADD_SHARDS': {
      const char = state.characters[action.characterId];
      if (!char) return state;
      sound.playUpgrade();
      return {
        ...state,
        characters: {
          ...state.characters,
          [action.characterId]: {
            ...char,
            shards: char.shards + action.amount,
          },
        },
      };
    }

    case 'ADD_GOLD': {
      sound.playCoin();
      return {
        ...state,
        player: {
          ...state.player,
          goldCoins: state.player.goldCoins + action.amount,
        },
      };
    }

    case 'CLAIM_DAILY_REWARD': {
      const reward = state.dailyRewards.find((r) => r.day === action.day);
      if (!reward || reward.claimed) return state;

      sound.playCoin();

      const updatedRewards = state.dailyRewards.map((r) =>
        r.day === action.day ? { ...r, claimed: true } : r
      );

      let updatedCharacters = { ...state.characters };
      if (reward.characterId && reward.shards) {
        const char = updatedCharacters[reward.characterId];
        if (char) {
          updatedCharacters[reward.characterId] = {
            ...char,
            shards: char.shards + reward.shards,
          };
        }
      }

      return {
        ...state,
        player: {
          ...state.player,
          goldCoins: state.player.goldCoins + reward.coins,
          dailyStreak: Math.min(state.player.dailyStreak + 1, 7),
          lastDailyClaimDate: new Date().toISOString().split('T')[0],
        },
        characters: updatedCharacters,
        dailyRewards: updatedRewards,
      };
    }

    case 'CLAIM_ACHIEVEMENT': {
      const ach = state.achievements.find((a) => a.id === action.achievementId);
      if (!ach || ach.claimed || ach.progress < ach.target) return state;

      sound.playCoin();

      let updatedCharacters = { ...state.characters };
      if (ach.rewardShards) {
        const char = updatedCharacters[ach.rewardShards.characterId];
        if (char) {
          updatedCharacters[ach.rewardShards.characterId] = {
            ...char,
            shards: char.shards + ach.rewardShards.amount,
          };
        }
      }

      return {
        ...state,
        player: {
          ...state.player,
          goldCoins: state.player.goldCoins + ach.rewardCoins,
        },
        characters: updatedCharacters,
        achievements: state.achievements.map((a) =>
          a.id === action.achievementId ? { ...a, claimed: true } : a
        ),
      };
    }

    case 'UPDATE_SETTINGS': {
      sound.playClick();
      const updated = { ...state.settings, ...action.settings };
      sound.updateSettings(
        updated.sfxEnabled,
        updated.bgmEnabled,
        updated.sfxVolume,
        updated.bgmVolume
      );
      return {
        ...state,
        settings: updated,
      };
    }

    case 'UPDATE_PROFILE': {
      sound.playClick();
      return {
        ...state,
        player: {
          ...state.player,
          ...action.profile,
        },
      };
    }

    case 'TOGGLE_DAILY_MODAL': {
      sound.playClick();
      return {
        ...state,
        showDailyRewardModal: action.open,
      };
    }

    case 'COMPLETE_STAGE': {
      sound.playUpgrade();
      const { worldId, stageId, stars, score, timeSeconds, coinsEarned, killsCount } = action;

      // Update worlds and stages
      const updatedWorlds = state.worlds.map((world) => {
        if (world.id !== worldId) return world;

        const updatedStages = world.stages.map((stage) => {
          if (stage.stageId === stageId) {
            return {
              ...stage,
              stars: Math.max(stage.stars, stars),
              bestScore: Math.max(stage.bestScore, score),
              bestTime: stage.bestTime === 0 ? timeSeconds : Math.min(stage.bestTime, timeSeconds),
            };
          }
          // Unlock next stage in current world
          if (stage.stageId === stageId + 1) {
            return { ...stage, unlocked: true };
          }
          return stage;
        });

        return { ...world, stages: updatedStages };
      });

      // If stage 5 of world is cleared, unlock the next world
      if (stageId === 5 && worldId < 4) {
        const nextWorld = updatedWorlds.find((w) => w.id === worldId + 1);
        if (nextWorld) {
          nextWorld.unlocked = true;
          if (nextWorld.stages[0]) {
            nextWorld.stages[0].unlocked = true;
          }
        }
      }

      // Optional Shards Awarded
      let updatedCharacters = state.characters;
      if (action.shardsAwarded) {
        const charId = action.shardsAwarded.characterId;
        const targetChar = state.characters[charId];
        if (targetChar) {
          updatedCharacters = {
            ...state.characters,
            [charId]: {
              ...targetChar,
              shards: targetChar.shards + action.shardsAwarded.count,
            },
          };
        }
      }

      return {
        ...state,
        player: {
          ...state.player,
          goldCoins: state.player.goldCoins + coinsEarned,
          totalKills: state.player.totalKills + killsCount,
          stagesCleared: state.player.stagesCleared + 1,
        },
        characters: updatedCharacters,
        worlds: updatedWorlds,
      };
    }

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadSavedState);

  // Sync state to localStorage on updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [state]);

  // Sync initial audio settings
  useEffect(() => {
    sound.updateSettings(
      state.settings.sfxEnabled,
      state.settings.bgmEnabled,
      state.settings.sfxVolume,
      state.settings.bgmVolume
    );
  }, []);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
