export type CharacterRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface CharacterStats {
  hp: number;
  atk: number;
  spd: number;
  ability: number;
}

export interface CharacterUpgradeTiers {
  atk: number;
  def: number;
  spd: number;
  ability: number;
}

export interface Character {
  id: string;
  name: string;
  rarity: CharacterRarity;
  description: string;
  silhouetteType: 'basic' | 'ninja' | 'mage' | 'tank' | 'sky';
  baseStats: CharacterStats;
  currentStats: CharacterStats;
  specialAbility: {
    name: string;
    description: string;
    cooldown: number; // in seconds
    damageMultiplier: number;
  };
  unlocked: boolean;
  shards: number;
  shardsRequired: number;
  upgradeTiers: CharacterUpgradeTiers;
}

export interface Stage {
  worldId: number;
  stageId: number; // 1 to 5 per world
  globalStageNumber: number; // 1 to 20
  title: string;
  isBoss: boolean;
  unlocked: boolean;
  stars: number; // 0 to 3
  bestScore: number;
  bestTime: number; // seconds
  recommendedStats: {
    atk: number;
    hp: number;
  };
}

export interface World {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  unlocked: boolean;
  stages: Stage[];
}

export type AchievementCategory = 'All' | 'Combat' | 'Exploration' | 'Collection' | 'Completed';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'Combat' | 'Exploration' | 'Collection';
  icon: string;
  progress: number;
  target: number;
  claimed: boolean;
  rewardCoins: number;
  rewardShards?: {
    characterId: string;
    amount: number;
  };
}

export interface DailyRewardItem {
  day: number;
  coins: number;
  shards?: number;
  characterId?: string;
  claimed: boolean;
}

export interface PlayerProfile {
  isGuest: boolean;
  username: string;
  email?: string;
  avatar: string;
  goldCoins: number;
  totalKills: number;
  stagesCleared: number;
  rank: string;
  activeCharacterId: string;
  lastDailyClaimDate: string | null;
  dailyStreak: number;
}

export interface SettingsState {
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  sfxVolume: number;
  bgmVolume: number;
  vibrationEnabled: boolean;
  buttonSize: 'Small' | 'Medium' | 'Large';
  dailyReminderPush: boolean;
  weeklyChallengeAlert: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  score: number;
  stagesCleared: number;
  bestBossTime: string;
  isCurrentUser?: boolean;
}

export interface GameState {
  player: PlayerProfile;
  characters: Record<string, Character>;
  worlds: World[];
  achievements: Achievement[];
  dailyRewards: DailyRewardItem[];
  settings: SettingsState;
  showDailyRewardModal: boolean;
}
