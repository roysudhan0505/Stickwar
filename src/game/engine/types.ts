export type StickmanState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'attack1'
  | 'attack2'
  | 'attack3'
  | 'special'
  | 'hurt';

export interface Vector2D {
  x: number;
  y: number;
}

export interface InputControls {
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  special: boolean;
}

export interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
  damage: number;
  knockbackX: number;
  knockbackY: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'circle' | 'spark' | 'smoke' | 'slash';
  rotation?: number;
  length?: number;
}

export interface FloatingNumber {
  id: number;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  fontSize: number;
  life: number;
  maxLife: number;
}

export interface PlayerEntity {
  id: string;
  name: string;
  silhouetteType: 'basic' | 'ninja' | 'mage' | 'tank' | 'sky';
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  grounded: boolean;
  state: StickmanState;
  stateTime: number;
  animFrame: number;
  
  // Stats
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  jumpForce: number;

  // Combat system
  comboStep: 1 | 2 | 3;
  comboResetTimer: number;
  attackDuration: number;
  isAttacking: boolean;
  hitbox: Hitbox | null;
  hasHitInCurrentAttack: boolean;

  // Special ability
  specialCooldown: number;
  maxSpecialCooldown: number;
  specialDuration: number;
  isSpecialActive: boolean;

  // Status & Buffs
  invulnerableTimer: number;
  speedBuffTimer: number;
  damageBuffTimer: number;
  shieldBuffTimer: number;
  dashTrail: Array<{ x: number; y: number; facing: 'left' | 'right'; state: StickmanState; alpha: number }>;
}

export type PowerUpType = 'health_orb' | 'speed_boost' | 'damage_multiplier' | 'shield_orb';

export interface CollectiblePowerUp {
  id: number;
  type: PowerUpType;
  x: number;
  y: number;
  vy: number;
  groundY: number;
  bobTimer: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}

export type EnemyType = 'grunt' | 'shield_bearer' | 'archer' | 'boss';
export type EnemyAIState = 'idle' | 'patrol' | 'chase' | 'windup' | 'attack' | 'hurt' | 'death';

export interface EnemyEntity {
  id: string;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  grounded: boolean;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;

  // AI & States
  aiState: EnemyAIState;
  stateTimer: number;
  patrolOriginX: number;
  patrolDistance: number;
  detectRadius: number;
  attackRange: number;
  attackCooldown: number;
  maxAttackCooldown: number;
  windupDuration: number;
  attackDuration: number;
  isAttacking: boolean;
  attackHitbox: Hitbox | null;
  hasDealtDamageInAttack: boolean;

  // Shield Bearer
  isShielding: boolean;
  shieldBrokenTimer: number;

  // Archer
  shootCooldown: number;

  // Boss
  isBoss?: boolean;
  bossPhase?: 1 | 2;
  specialMoveTimer?: number;
  bossAttackType?: 'cleave' | 'ground_slam' | 'rage_charge';

  // Combat Feedback
  hurtTimer: number;
  deathTimer: number;
  isDead: boolean;
  goldReward: number;
  scoreReward: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  fromPlayer: boolean;
  type: 'arrow' | 'arcane_bolt' | 'kunai' | 'earth_shockwave';
  radius: number;
  life: number;
  maxLife: number;
  rotation: number;
  color: string;
}

export interface WaveConfig {
  waveNumber: number;
  enemies: Array<{
    type: EnemyType;
    count: number;
    spawnDelay: number;
  }>;
}

export interface WaveState {
  currentWave: number;
  totalWaves: number;
  announcement: string;
  announcementTimer: number;
  isWaveActive: boolean;
  isAllWavesCleared: boolean;
}

export interface TrainingTarget {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  grounded: boolean;
  hurtTimer: number;
  facing: 'left' | 'right';
  isBoss?: boolean;
}

export interface CameraState {
  x: number;
  y: number;
  targetX: number;
  shakeIntensity: number;
  shakeTime: number;
}

export interface StageEnvironment {
  worldId: number;
  worldName: string;
  stageId: number;
  stageName: string;
  stageWidth: number;
  groundY: number;
  theme: 'stone' | 'forest' | 'lava' | 'sky';
  platforms: Array<{ x: number; y: number; width: number; height: number }>;
}
