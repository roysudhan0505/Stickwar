import {
  EnemyEntity,
  EnemyType,
  PlayerEntity,
  Projectile,
  StageEnvironment,
  WaveState,
  Hitbox,
} from './types';
import { ParticleSystem } from './particles';
import { sound } from '../../utils/audio';

export class EnemyManager {
  public enemies: EnemyEntity[] = [];
  public projectiles: Projectile[] = [];
  public wave: WaveState;
  
  private nextEnemyId = 1;
  private nextProjectileId = 1;
  private stage: StageEnvironment;
  private particles: ParticleSystem;

  public onPlayerDamaged?: (damage: number, currentHp: number, attackerName?: string) => void;
  public onEnemyKilled?: (enemy: EnemyEntity) => void;
  public onWaveComplete?: (waveNum: number) => void;
  public onAllWavesCleared?: () => void;
  public onBossSpawned?: (boss: EnemyEntity) => void;

  constructor(stage: StageEnvironment, particles: ParticleSystem) {
    this.stage = stage;
    this.particles = particles;
    this.wave = {
      currentWave: 1,
      totalWaves: 3,
      announcement: 'WAVE 1/3 — INCOMING!',
      announcementTimer: 2.5,
      isWaveActive: true,
      isAllWavesCleared: false,
    };

    // Spawn initial wave
    this.spawnWave(1);
  }

  /**
   * Spawn enemies according to current wave and stage difficulty across all 20 stages
   */
  public spawnWave(waveNum: number): void {
    this.wave.currentWave = waveNum;
    this.wave.isWaveActive = true;

    const worldId = this.stage.worldId;
    const stageId = this.stage.stageId;
    const globalStage = (worldId - 1) * 5 + stageId;
    const isWorldBoss = stageId === 5;
    const diffScale = 0.85 + (globalStage - 1) * 0.16;

    // Platform references for elevated sniper positioning
    const platforms = this.stage.platforms;
    const p1 = platforms[0] || { x: 450, y: 300 };
    const p2 = platforms[1] || { x: 850, y: 240 };
    const p3 = platforms[2] || { x: 1300, y: 280 };

    if (waveNum === 1) {
      this.wave.announcement = `WAVE 1/3 — ADVANCING PATROL!`;
      this.wave.announcementTimer = 2.4;
      sound.playClick();

      // Scaled wave composition based on world
      if (worldId === 1) {
        // Stone Valley early patrol
        this.addEnemy('grunt', 650, this.stage.groundY, diffScale, 'Valley Bandit');
        this.addEnemy('grunt', 920, this.stage.groundY, diffScale, 'Valley Bandit');
        if (stageId >= 2) {
          this.addEnemy('archer', p1.x + 60, p1.y, diffScale, 'Ledge Sniper');
        }
      } else if (worldId === 2) {
        // Dark Forest nimble ambush
        this.addEnemy('grunt', 600, this.stage.groundY, diffScale, 'Shadow Stalker');
        this.addEnemy('archer', p1.x + 40, p1.y, diffScale, 'Canopy Archer');
        this.addEnemy('grunt', 950, this.stage.groundY, diffScale, 'Shadow Stalker');
        if (stageId >= 3) {
          this.addEnemy('shield_bearer', 1200, this.stage.groundY, diffScale, 'Bramble Guard');
        }
      } else if (worldId === 3) {
        // Lava Caves fiery vanguard
        this.addEnemy('grunt', 620, this.stage.groundY, diffScale, 'Molten Berserker');
        this.addEnemy('shield_bearer', 880, this.stage.groundY, diffScale, 'Obsidian Ward');
        this.addEnemy('archer', p2.x + 50, p2.y, diffScale, 'Hellfire Archer');
        this.addEnemy('grunt', 1250, this.stage.groundY, diffScale, 'Molten Berserker');
      } else {
        // Sky Fortress elite champions
        this.addEnemy('grunt', 600, this.stage.groundY, diffScale, 'Sky Knight');
        this.addEnemy('shield_bearer', 850, this.stage.groundY, diffScale, 'Gilded Vanguard');
        this.addEnemy('archer', p1.x + 50, p1.y, diffScale, 'Cloud Marksman');
        this.addEnemy('grunt', 1150, this.stage.groundY, diffScale, 'Sky Knight');
      }
    } else if (waveNum === 2) {
      this.wave.announcement = `WAVE 2/3 — REINFORCEMENTS!`;
      this.wave.announcementTimer = 2.4;
      sound.playUpgrade();

      if (worldId === 1) {
        this.addEnemy('shield_bearer', 700, this.stage.groundY, diffScale, 'Stone Shieldman');
        this.addEnemy('grunt', 980, this.stage.groundY, diffScale, 'Valley Raider');
        this.addEnemy('archer', p2.x + 60, p2.y, diffScale, 'Echo Archer');
        if (stageId >= 3) {
          this.addEnemy('grunt', 1350, this.stage.groundY, diffScale, 'Valley Raider');
        }
      } else if (worldId === 2) {
        this.addEnemy('shield_bearer', 680, this.stage.groundY, diffScale, 'Darkwood Guardian');
        this.addEnemy('archer', p1.x + 50, p1.y, diffScale, 'Canopy Archer');
        this.addEnemy('grunt', 1050, this.stage.groundY, diffScale, 'Shadow Assassin');
        this.addEnemy('archer', p2.x + 50, p2.y, diffScale, 'Night Ranger');
      } else if (worldId === 3) {
        this.addEnemy('shield_bearer', 660, this.stage.groundY, diffScale, 'Obsidian Ward');
        this.addEnemy('grunt', 950, this.stage.groundY, diffScale, 'Magma Slasher');
        this.addEnemy('shield_bearer', 1250, this.stage.groundY, diffScale, 'Obsidian Ward');
        this.addEnemy('archer', p3.x + 40, p3.y, diffScale, 'Hellfire Archer');
      } else {
        this.addEnemy('shield_bearer', 650, this.stage.groundY, diffScale, 'Gilded Paladin');
        this.addEnemy('grunt', 950, this.stage.groundY, diffScale, 'Stormblade Warrior');
        this.addEnemy('archer', p2.x + 50, p2.y, diffScale, 'Aether Archer');
        this.addEnemy('shield_bearer', 1300, this.stage.groundY, diffScale, 'Gilded Paladin');
      }
    } else if (waveNum === 3) {
      // Wave 3: World Boss or Sector Warden
      sound.playBossRoar();

      if (isWorldBoss) {
        // The 4 Legendary World Bosses
        if (worldId === 1) {
          // World 1 Boss: Stone Titan
          const bossName = 'Stone Titan';
          this.wave.announcement = 'WORLD 1 TITAN: STONE TITAN!';
          this.wave.announcementTimer = 3.5;
          const boss = this.addEnemy('boss', 1550, this.stage.groundY, diffScale * 1.5, bossName);
          this.addEnemy('grunt', 1150, this.stage.groundY, diffScale, 'Stone Minion');
          this.addEnemy('archer', p2.x + 50, p2.y, diffScale, 'Crag Archer');
          if (this.onBossSpawned && boss) this.onBossSpawned(boss);
        } else if (worldId === 2) {
          // World 2 Boss: Shadow Berserker
          const bossName = 'Shadow Berserker';
          this.wave.announcement = 'WORLD 2 TITAN: SHADOW BERSERKER!';
          this.wave.announcementTimer = 3.5;
          const boss = this.addEnemy('boss', 1500, this.stage.groundY, diffScale * 1.7, bossName);
          this.addEnemy('grunt', 1100, this.stage.groundY, diffScale, 'Shadow Acolyte');
          this.addEnemy('archer', p2.x + 50, p2.y, diffScale, 'Grave Archer');
          if (this.onBossSpawned && boss) this.onBossSpawned(boss);
        } else if (worldId === 3) {
          // World 3 Boss: Infernal Overlord
          const bossName = 'Infernal Overlord';
          this.wave.announcement = 'WORLD 3 TITAN: INFERNAL OVERLORD!';
          this.wave.announcementTimer = 3.5;
          const boss = this.addEnemy('boss', 1600, this.stage.groundY, diffScale * 1.9, bossName);
          this.addEnemy('shield_bearer', 1150, this.stage.groundY, diffScale, 'Fireforged Guard');
          this.addEnemy('archer', p2.x + 50, p2.y, diffScale, 'Molten Marksman');
          if (this.onBossSpawned && boss) this.onBossSpawned(boss);
        } else {
          // World 4 Final Campaign Boss: Sky Sovereign
          const bossName = 'Sky Sovereign';
          this.wave.announcement = 'FINAL CAMPAIGN TITAN: SKY SOVEREIGN!';
          this.wave.announcementTimer = 4.0;
          const boss = this.addEnemy('boss', 1650, this.stage.groundY, diffScale * 2.3, bossName);
          this.addEnemy('shield_bearer', 1100, this.stage.groundY, diffScale, 'Royal Guardian');
          this.addEnemy('grunt', 1300, this.stage.groundY, diffScale, 'High Templar');
          this.addEnemy('archer', p2.x + 50, p2.y, diffScale, 'Celeste Marksman');
          if (this.onBossSpawned && boss) this.onBossSpawned(boss);
        }
      } else {
        // Non-boss stage: Elite Sector Warden
        const wardenNames = [
          'Valley Marauder Captain',
          'Boulder Crusher',
          'Ridge Vanguard',
          'Canyon Chieftain',
          'Darkwood Phantom',
          'Spear Warlord',
          'Moonlit Slayer',
          'Silent Assassin Prime',
          'Ash Chasm Behemoth',
          'Obsidian Champion',
          'Magma Ravager',
          'Foundry Warden',
          'Cloud Gate Sentinel',
          'Battlement Commander',
          'Windshear Master',
          'Antechamber Marshal',
        ];
        const wardenTitle = wardenNames[(globalStage - 1) % wardenNames.length] || 'Sector Warden';
        this.wave.announcement = `FINAL ASSAULT: ${wardenTitle.toUpperCase()}!`;
        this.wave.announcementTimer = 3.0;

        const boss = this.addEnemy('boss', 1450, this.stage.groundY, diffScale * 1.15, wardenTitle);
        this.addEnemy('grunt', 1100, this.stage.groundY, diffScale, 'Sector Minion');
        if (stageId >= 2) {
          this.addEnemy('archer', p1.x + 60, p1.y, diffScale, 'Sector Sniper');
        }
        if (this.onBossSpawned && boss) this.onBossSpawned(boss);
      }
    }
  }

  /**
   * Factory to create typed EnemyEntity
   */
  public addEnemy(
    type: EnemyType,
    x: number,
    y: number,
    statScale: number = 1.0,
    customName?: string
  ): EnemyEntity {
    const id = `enemy_${this.nextEnemyId++}`;
    let enemy: EnemyEntity;

    if (type === 'boss') {
      const isTitan = this.stage.stageId === 5;
      const baseHp = isTitan ? 1400 : 750;
      const maxHp = Math.round(baseHp * statScale);
      const baseAtk = isTitan ? 36 : 24;
      const goldReward = isTitan ? (this.stage.worldId === 4 ? 1000 : 350 * this.stage.worldId) : 180;
      const scoreReward = isTitan ? 10000 : 4000;

      enemy = {
        id,
        type: 'boss',
        name: customName || 'Sector Warden',
        x,
        y,
        vx: 0,
        vy: 0,
        width: 48,
        height: 76,
        facing: 'left',
        grounded: true,
        hp: maxHp,
        maxHp,
        atk: Math.round(baseAtk * statScale),
        speed: isTitan ? (this.stage.worldId === 2 ? 165 : 125) : 135,
        aiState: 'patrol',
        stateTimer: 0,
        patrolOriginX: x,
        patrolDistance: 250,
        detectRadius: 680,
        attackRange: 84,
        attackCooldown: 0,
        maxAttackCooldown: 2.0,
        windupDuration: 0.5,
        attackDuration: 0.45,
        isAttacking: false,
        attackHitbox: null,
        hasDealtDamageInAttack: false,
        isShielding: false,
        shieldBrokenTimer: 0,
        shootCooldown: 0,
        isBoss: true,
        bossPhase: 1,
        specialMoveTimer: 3.8,
        bossAttackType: 'cleave',
        hurtTimer: 0,
        deathTimer: 0.9,
        isDead: false,
        goldReward,
        scoreReward,
      };
    } else if (type === 'shield_bearer') {
      const maxHp = Math.round(220 * statScale);
      enemy = {
        id,
        type: 'shield_bearer',
        name: 'Shield Bearer',
        x,
        y,
        vx: 0,
        vy: 0,
        width: 36,
        height: 64,
        facing: 'left',
        grounded: true,
        hp: maxHp,
        maxHp,
        atk: Math.round(18 * statScale),
        speed: 110,
        aiState: 'patrol',
        stateTimer: 0,
        patrolOriginX: x,
        patrolDistance: 160,
        detectRadius: 400,
        attackRange: 55,
        attackCooldown: 0,
        maxAttackCooldown: 2.0,
        windupDuration: 0.45,
        attackDuration: 0.35,
        isAttacking: false,
        attackHitbox: null,
        hasDealtDamageInAttack: false,
        isShielding: true,
        shieldBrokenTimer: 0,
        shootCooldown: 0,
        hurtTimer: 0,
        deathTimer: 0.6,
        isDead: false,
        goldReward: 45,
        scoreReward: 800,
      };
    } else if (type === 'archer') {
      const maxHp = Math.round(110 * statScale);
      enemy = {
        id,
        type: 'archer',
        name: 'Shadow Archer',
        x,
        y,
        vx: 0,
        vy: 0,
        width: 30,
        height: 60,
        facing: 'left',
        grounded: true,
        hp: maxHp,
        maxHp,
        atk: Math.round(16 * statScale),
        speed: 150,
        aiState: 'patrol',
        stateTimer: 0,
        patrolOriginX: x,
        patrolDistance: 180,
        detectRadius: 600,
        attackRange: 380,
        attackCooldown: 0,
        maxAttackCooldown: 2.5,
        windupDuration: 0.6,
        attackDuration: 0.25,
        isAttacking: false,
        attackHitbox: null,
        hasDealtDamageInAttack: false,
        isShielding: false,
        shieldBrokenTimer: 0,
        shootCooldown: 1.5,
        hurtTimer: 0,
        deathTimer: 0.6,
        isDead: false,
        goldReward: 35,
        scoreReward: 600,
      };
    } else {
      // Grunt
      const maxHp = Math.round(140 * statScale);
      enemy = {
        id,
        type: 'grunt',
        name: 'Shadow Grunt',
        x,
        y,
        vx: 0,
        vy: 0,
        width: 32,
        height: 60,
        facing: 'left',
        grounded: true,
        hp: maxHp,
        maxHp,
        atk: Math.round(14 * statScale),
        speed: 170,
        aiState: 'patrol',
        stateTimer: 0,
        patrolOriginX: x,
        patrolDistance: 220,
        detectRadius: 450,
        attackRange: 50,
        attackCooldown: 0,
        maxAttackCooldown: 1.6,
        windupDuration: 0.35,
        attackDuration: 0.3,
        isAttacking: false,
        attackHitbox: null,
        hasDealtDamageInAttack: false,
        isShielding: false,
        shieldBrokenTimer: 0,
        shootCooldown: 0,
        hurtTimer: 0,
        deathTimer: 0.6,
        isDead: false,
        goldReward: 25,
        scoreReward: 400,
      };
    }

    this.enemies.push(enemy);
    return enemy;
  }

  /**
   * Main Enemy Manager frame update: AI states, physics, attacks, and wave progression
   */
  public update(dt: number, player: PlayerEntity): void {
    // Wave announcement timer
    if (this.wave.announcementTimer > 0) {
      this.wave.announcementTimer -= dt;
    }

    // Update active enemies
    for (const enemy of this.enemies) {
      this.updateEnemy(dt, enemy, player);
    }

    // Update projectiles
    this.updateProjectiles(dt, player);

    // Filter out completely dead enemies after death timer
    const livingEnemies = this.enemies.filter((e) => !e.isDead || e.deathTimer > 0);
    this.enemies = livingEnemies;

    // Check Wave Completion
    const activeEnemies = this.enemies.filter((e) => !e.isDead);
    if (activeEnemies.length === 0 && this.wave.isWaveActive) {
      this.wave.isWaveActive = false;

      if (this.wave.currentWave < this.wave.totalWaves) {
        if (this.onWaveComplete) {
          this.onWaveComplete(this.wave.currentWave);
        }
        // Spawn next wave after small dramatic pause
        setTimeout(() => {
          this.spawnWave(this.wave.currentWave + 1);
        }, 1500);
      } else {
        // All 3 waves defeated!
        this.wave.isAllWavesCleared = true;
        if (this.onAllWavesCleared) {
          this.onAllWavesCleared();
        }
      }
    }
  }

  /**
   * Individual Enemy State Machine & Behavior
   */
  private updateEnemy(dt: number, enemy: EnemyEntity, player: PlayerEntity): void {
    enemy.stateTimer += dt;

    if (enemy.isDead) {
      enemy.deathTimer -= dt;
      return;
    }

    // Decrement timers
    if (enemy.hurtTimer > 0) enemy.hurtTimer -= dt;
    if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;
    if (enemy.shieldBrokenTimer > 0) {
      enemy.shieldBrokenTimer -= dt;
      if (enemy.shieldBrokenTimer <= 0) {
        enemy.isShielding = true;
      }
    }

    // Boss Phase 2 Check (below 50% HP)
    if (enemy.isBoss && enemy.hp < enemy.maxHp * 0.5 && enemy.bossPhase === 1) {
      enemy.bossPhase = 2;
      enemy.speed *= 1.35;
      enemy.atk = Math.round(enemy.atk * 1.3);
      sound.playBossRoar();
      this.particles.createSpecialShockwave(enemy.x, enemy.y - 30, '#FF0055');
      this.particles.addFloatingNumber(enemy.x, enemy.y - 65, 'ENRAGED!', '#FF0055', true);
    }

    // Distance to player
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);
    const absX = Math.abs(dx);

    // AI State Processing if not in hurt recovery
    if (enemy.hurtTimer > 0) {
      enemy.aiState = 'hurt';
      // Hurt friction
      enemy.vx *= 0.82;
    } else if (enemy.isAttacking) {
      // Currently executing an attack or windup
      if (enemy.aiState === 'windup') {
        enemy.vx = 0;
        if (enemy.stateTimer >= enemy.windupDuration) {
          // Transition to active strike
          enemy.aiState = 'attack';
          enemy.stateTimer = 0;
          this.executeEnemyAttack(enemy, player);
        }
      } else if (enemy.aiState === 'attack') {
        enemy.vx *= 0.8;
        if (enemy.stateTimer >= enemy.attackDuration) {
          // Attack completed
          enemy.isAttacking = false;
          enemy.attackHitbox = null;
          enemy.aiState = 'idle';
          enemy.stateTimer = 0;
          enemy.attackCooldown = enemy.maxAttackCooldown;
        }
      }
    } else {
      // Idle / Patrol / Chase logic
      // Face toward player if engaged
      if (distToPlayer <= enemy.detectRadius) {
        enemy.facing = dx > 0 ? 'right' : 'left';

        // Check if within attack range
        if (absX <= enemy.attackRange && enemy.attackCooldown <= 0 && Math.abs(dy) < 70) {
          // Start Attack Windup
          enemy.isAttacking = true;
          enemy.aiState = 'windup';
          enemy.stateTimer = 0;
          enemy.hasDealtDamageInAttack = false;
          sound.playClick();
        } else if (enemy.type === 'archer') {
          // Archer AI: keep distance
          if (absX < 200) {
            // Player is too close, retreat!
            enemy.aiState = 'patrol';
            enemy.vx = dx > 0 ? -enemy.speed : enemy.speed;
          } else if (absX > enemy.attackRange) {
            // Player is too far, advance closer
            enemy.aiState = 'chase';
            enemy.vx = dx > 0 ? enemy.speed : -enemy.speed;
          } else {
            // Ideal distance, hold position
            enemy.aiState = 'idle';
            enemy.vx = 0;
          }
        } else {
          // Chase Player
          enemy.aiState = 'chase';
          enemy.vx = dx > 0 ? enemy.speed : -enemy.speed;
        }
      } else {
        // Patrol around original spawn point
        enemy.aiState = 'patrol';
        const distFromOrigin = enemy.x - enemy.patrolOriginX;
        if (Math.abs(distFromOrigin) >= enemy.patrolDistance) {
          enemy.facing = distFromOrigin > 0 ? 'left' : 'right';
        }
        enemy.vx = enemy.facing === 'right' ? enemy.speed * 0.55 : -enemy.speed * 0.55;
      }
    }

    // Apply Gravity
    if (!enemy.grounded) {
      enemy.vy += 1400 * dt;
    }

    // Move Enemy
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;

    // Platform & Ground Collision
    if (enemy.y >= this.stage.groundY) {
      enemy.y = this.stage.groundY;
      enemy.vy = 0;
      enemy.grounded = true;
    }

    // Keep within stage boundaries
    enemy.x = Math.max(30, Math.min(this.stage.stageWidth - 30, enemy.x));

    // Check collision of enemy attack hitbox with player
    this.checkEnemyAttackCollision(enemy, player);
  }

  /**
   * Trigger the active strike of an enemy
   */
  private executeEnemyAttack(enemy: EnemyEntity, player: PlayerEntity): void {
    if (enemy.type === 'archer') {
      // Fire Arrow Projectile
      sound.playBowShoot();
      const dirX = enemy.facing === 'right' ? 1 : -1;
      const arrowSpeed = 520;
      const angle = dirX > 0 ? 0 : Math.PI;

      this.projectiles.push({
        id: this.nextProjectileId++,
        x: enemy.x + dirX * 18,
        y: enemy.y - 32,
        vx: dirX * arrowSpeed,
        vy: -20,
        damage: enemy.atk,
        fromPlayer: false,
        type: 'arrow',
        radius: 6,
        life: 2.2,
        maxLife: 2.2,
        rotation: angle,
        color: '#E63946',
      });
    } else if (enemy.isBoss) {
      // Boss Cleave / Ground Slam
      sound.playBossRoar();
      sound.vibrate(60);

      const isRight = enemy.facing === 'right';
      enemy.attackHitbox = {
        x: enemy.x + (isRight ? 10 : -95),
        y: enemy.y - 70,
        width: 85,
        height: 70,
        damage: enemy.atk,
        knockbackX: isRight ? 380 : -380,
        knockbackY: -220,
      };

      // Create ground shockwave in Phase 2
      if (enemy.bossPhase === 2) {
        this.particles.createSpecialShockwave(enemy.x, enemy.y - 5, '#FF0055');
        this.projectiles.push({
          id: this.nextProjectileId++,
          x: enemy.x + (isRight ? 35 : -35),
          y: enemy.y - 5,
          vx: isRight ? 340 : -340,
          vy: 0,
          damage: Math.round(enemy.atk * 0.75),
          fromPlayer: false,
          type: 'earth_shockwave',
          radius: 16,
          life: 1.4,
          maxLife: 1.4,
          rotation: 0,
          color: '#FFD60A',
        });
      }
    } else {
      // Standard Melee / Shield Bash
      sound.playSlash(1);
      const isRight = enemy.facing === 'right';
      enemy.attackHitbox = {
        x: enemy.x + (isRight ? 10 : -55),
        y: enemy.y - 45,
        width: 48,
        height: 44,
        damage: enemy.atk,
        knockbackX: isRight ? 240 : -240,
        knockbackY: -150,
      };
    }
  }

  /**
   * Check if an active enemy strike connects with the player
   */
  private checkEnemyAttackCollision(enemy: EnemyEntity, player: PlayerEntity): void {
    if (!enemy.attackHitbox || enemy.hasDealtDamageInAttack || player.hp <= 0) return;
    if (player.invulnerableTimer > 0) return;

    const hb = enemy.attackHitbox;
    const playerBox = {
      x: player.x - player.width / 2,
      y: player.y - player.height,
      width: player.width,
      height: player.height,
    };

    if (
      hb.x < playerBox.x + playerBox.width &&
      hb.x + hb.width > playerBox.x &&
      hb.y < playerBox.y + playerBox.height &&
      hb.y + hb.height > playerBox.y
    ) {
      // Player hit!
      enemy.hasDealtDamageInAttack = true;
      this.damagePlayer(player, hb.damage, hb.knockbackX, hb.knockbackY, enemy.name);
    }
  }

  /**
   * Update all active projectiles
   */
  private updateProjectiles(dt: number, player: PlayerEntity): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Small gravity on arrows
      if (p.type === 'arrow') {
        p.vy += 120 * dt;
        p.rotation = Math.atan2(p.vy, p.vx);
      }

      // Expire on lifetime or ground hit
      if (p.life <= 0 || p.y >= this.stage.groundY + 10) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with player if from enemy
      if (!p.fromPlayer && player.hp > 0 && player.invulnerableTimer <= 0) {
        const pDist = Math.hypot(p.x - player.x, p.y - (player.y - 30));
        if (pDist < p.radius + 18) {
          // Projectile hit player!
          const projectileSource = p.type === 'arrow' ? 'Archer Arrow' : 'Shockwave Blast';
          this.particles.createHitSparks(p.x, p.y, '#E63946', 10);
          this.damagePlayer(player, p.damage, p.vx > 0 ? 200 : -200, -120, projectileSource);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Check collision with enemies if from player
      if (p.fromPlayer) {
        for (const enemy of this.enemies) {
          if (enemy.isDead) continue;
          const eDist = Math.hypot(p.x - enemy.x, p.y - (enemy.y - 30));
          if (eDist < p.radius + 20) {
            this.particles.createHitSparks(p.x, p.y, p.color, 12);
            this.damageEnemy(enemy, p.damage, p.vx > 0 ? 180 : -180, -140, player);
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  /**
   * Damage the player and trigger hurt states & feedback
   */
  public damagePlayer(
    player: PlayerEntity,
    damage: number,
    knockbackX: number,
    knockbackY: number,
    attackerName: string = 'Enemy Hostile'
  ): void {
    player.hp = Math.max(0, player.hp - damage);
    player.vx = knockbackX;
    player.vy = knockbackY;
    player.grounded = false;
    player.state = 'hurt';
    player.stateTime = 0;
    player.invulnerableTimer = 0.55;

    sound.playPlayerHurt();
    sound.vibrate([40, 20, 50]);

    this.particles.createHitSparks(player.x, player.y - 30, '#E63946', 14);
    this.particles.addFloatingNumber(player.x, player.y - 48, `-${damage}`, '#E63946', true);

    if (this.onPlayerDamaged) {
      this.onPlayerDamaged(damage, player.hp, attackerName);
    }
  }

  /**
   * Damage an enemy from player attacks with Shield Bearer mechanics
   */
  public damageEnemy(
    enemy: EnemyEntity,
    rawDamage: number,
    knockbackX: number,
    knockbackY: number,
    player: PlayerEntity
  ): { damageDealt: number; isCrit: boolean; isBlocked: boolean; isShieldBreak: boolean } {
    const isPlayerFacingRight = player.facing === 'right';
    const isAttackingFromFront =
      (isPlayerFacingRight && enemy.x > player.x && enemy.facing === 'left') ||
      (!isPlayerFacingRight && enemy.x < player.x && enemy.facing === 'right');

    let damage = rawDamage;
    let isBlocked = false;
    let isShieldBreak = false;
    const isHeavyFinisher = player.comboStep === 1 || player.isSpecialActive; // 3rd hit or special

    // Shield Bearer blocking mechanic
    if (enemy.type === 'shield_bearer' && enemy.isShielding && enemy.shieldBrokenTimer <= 0 && isAttackingFromFront) {
      if (isHeavyFinisher) {
        // Shield broken!
        isShieldBreak = true;
        enemy.shieldBrokenTimer = 2.8;
        enemy.isShielding = false;
        sound.playShieldBlock();
        sound.playHit();
        this.particles.createHitSparks(enemy.x, enemy.y - 30, '#FFD60A', 22);
        this.particles.addFloatingNumber(enemy.x, enemy.y - 55, 'GUARD BREAK!', '#FFD60A', true);
      } else {
        // Frontal normal attack blocked!
        isBlocked = true;
        damage = Math.round(damage * 0.15); // 85% damage reduction
        sound.playShieldBlock();
        this.particles.createHitSparks(enemy.x + (isPlayerFacingRight ? -10 : 10), enemy.y - 30, '#94A3B8', 8);
        this.particles.addFloatingNumber(enemy.x, enemy.y - 45, 'BLOCKED!', '#94A3B8');
        return { damageDealt: damage, isCrit: false, isBlocked: true, isShieldBreak: false };
      }
    }

    const isCrit = isHeavyFinisher || isShieldBreak;
    enemy.hp = Math.max(0, enemy.hp - damage);
    enemy.vx = knockbackX * (enemy.isBoss ? 0.35 : 1.0);
    enemy.vy = knockbackY * (enemy.isBoss ? 0.4 : 1.0);
    enemy.grounded = false;
    enemy.hurtTimer = enemy.isBoss ? 0.2 : 0.4;

    // Visual feedback
    this.particles.createHitSparks(enemy.x, enemy.y - 30, isCrit ? '#FFD60A' : '#F1F1F1', isCrit ? 16 : 10);
    this.particles.addFloatingNumber(
      enemy.x,
      enemy.y - 48,
      `-${damage}${isCrit ? ' CRIT!' : ''}`,
      isCrit ? '#FFD60A' : '#F1F1F1',
      isCrit
    );

    // Death check
    if (enemy.hp <= 0 && !enemy.isDead) {
      enemy.isDead = true;
      enemy.aiState = 'death';
      enemy.deathTimer = 0.6;
      sound.playUpgrade();
      this.particles.createHitSparks(enemy.x, enemy.y - 30, '#E63946', 25);
      this.particles.addFloatingNumber(enemy.x, enemy.y - 65, `+${enemy.goldReward} GOLD`, '#FFD60A', true);

      if (this.onEnemyKilled) {
        this.onEnemyKilled(enemy);
      }
    }

    return { damageDealt: damage, isCrit, isBlocked: false, isShieldBreak };
  }
}
