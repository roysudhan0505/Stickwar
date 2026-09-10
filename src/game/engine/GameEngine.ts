import {
  PlayerEntity,
  InputControls,
  CameraState,
  StageEnvironment,
  Hitbox,
  StickmanState,
  EnemyEntity,
  CollectiblePowerUp,
  PowerUpType,
} from './types';
import { ParticleSystem } from './particles';
import { EnemyManager } from './EnemyManager';
import { sound } from '../../utils/audio';

export class GameEngine {
  public player: PlayerEntity;
  public camera: CameraState;
  public stage: StageEnvironment;
  public enemyManager: EnemyManager;
  public particles: ParticleSystem;
  public collectibles: CollectiblePowerUp[] = [];
  private nextCollectibleId = 1;

  private gravity = 1400;
  private comboMaxWindow = 0.65; // Time window to continue combo
  public comboCount = 0;
  public comboTimeout = 0;
  public totalDamageReceived = 0;
  public enemiesKilledCount = 0;
  
  public onScoreUpdate?: (score: number, coins: number) => void;
  public onGameOver?: (causeOfDeath: string) => void;
  public onStageWon?: () => void;
  public onPowerUpCollected?: (type: PowerUpType, name: string) => void;

  constructor(
    charStats: {
      silhouetteType: 'basic' | 'ninja' | 'mage' | 'tank' | 'sky';
      hp: number;
      atk: number;
      speed: number;
      name: string;
    },
    worldId: number = 1,
    stageId: number = 1
  ) {
    // Generate theme and platforms based on world
    const worldName =
      worldId === 1 ? 'Stone Valley' : worldId === 2 ? 'Dark Forest' : worldId === 3 ? 'Lava Caves' : 'Sky Fortress';
    const theme: 'stone' | 'forest' | 'lava' | 'sky' =
      worldId === 1 ? 'stone' : worldId === 2 ? 'forest' : worldId === 3 ? 'lava' : 'sky';

    // Tailored platform layouts per world
    let platforms = [
      { x: 400, y: 320, width: 230, height: 16 },
      { x: 800, y: 260, width: 260, height: 16 },
      { x: 1260, y: 310, width: 240, height: 16 },
      { x: 1720, y: 250, width: 280, height: 16 },
    ];

    if (worldId === 2) {
      // Dark Forest: stepped canopies and tree boughs
      platforms = [
        { x: 340, y: 330, width: 190, height: 16 },
        { x: 620, y: 240, width: 230, height: 16 },
        { x: 960, y: 300, width: 210, height: 16 },
        { x: 1260, y: 220, width: 250, height: 16 },
        { x: 1620, y: 290, width: 240, height: 16 },
        { x: 1960, y: 230, width: 220, height: 16 },
      ];
    } else if (worldId === 3) {
      // Lava Caves: obsidian bridges over volcanic vents
      platforms = [
        { x: 380, y: 300, width: 260, height: 18 },
        { x: 760, y: 230, width: 240, height: 18 },
        { x: 1140, y: 310, width: 270, height: 18 },
        { x: 1540, y: 220, width: 280, height: 18 },
        { x: 1940, y: 290, width: 240, height: 18 },
      ];
    } else if (worldId === 4) {
      // Sky Fortress: lofty floating marble battlements
      platforms = [
        { x: 360, y: 320, width: 240, height: 18 },
        { x: 700, y: 220, width: 270, height: 18 },
        { x: 1080, y: 160, width: 290, height: 18 },
        { x: 1480, y: 230, width: 270, height: 18 },
        { x: 1860, y: 170, width: 310, height: 18 },
      ];
    }

    this.stage = {
      worldId,
      worldName,
      stageId,
      stageName: `Stage ${stageId} • ${worldName}`,
      stageWidth: 2400,
      groundY: 420,
      theme,
      platforms,
    };

    // Calculate jump force from speed/character archetypes
    const jumpForce =
      charStats.silhouetteType === 'ninja' || charStats.silhouetteType === 'sky'
        ? 570
        : charStats.silhouetteType === 'tank'
        ? 490
        : 530;

    this.player = {
      id: 'player_1',
      name: charStats.name,
      silhouetteType: charStats.silhouetteType,
      x: 180,
      y: this.stage.groundY,
      vx: 0,
      vy: 0,
      width: 32,
      height: 64,
      facing: 'right',
      grounded: true,
      state: 'idle',
      stateTime: 0,
      animFrame: 0,
      hp: charStats.hp,
      maxHp: charStats.hp,
      atk: charStats.atk,
      speed: 240 + charStats.speed * 2.8,
      jumpForce,
      comboStep: 1,
      comboResetTimer: 0,
      attackDuration: 0,
      isAttacking: false,
      hitbox: null,
      hasHitInCurrentAttack: false,
      specialCooldown: 0,
      maxSpecialCooldown:
        charStats.silhouetteType === 'mage'
          ? 6
          : charStats.silhouetteType === 'ninja' || charStats.silhouetteType === 'sky'
          ? 7
          : 8,
      specialDuration: 0,
      isSpecialActive: false,
      invulnerableTimer: 0,
      speedBuffTimer: 0,
      damageBuffTimer: 0,
      shieldBuffTimer: 0,
      dashTrail: [],
    };

    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      shakeIntensity: 0,
      shakeTime: 0,
    };

    this.particles = new ParticleSystem();
    this.enemyManager = new EnemyManager(this.stage, this.particles);

    // Setup Enemy Manager callbacks
    this.enemyManager.onEnemyKilled = (enemy) => {
      this.enemiesKilledCount++;
      if (this.onScoreUpdate) {
        this.onScoreUpdate(enemy.scoreReward, enemy.goldReward);
      }
      // Drop in-stage power-up (35% regular, 100% bosses)
      if (Math.random() < (enemy.isBoss ? 1.0 : 0.35)) {
        this.spawnPowerUp(enemy.x, enemy.y - 15);
      }
    };

    this.enemyManager.onPlayerDamaged = (damage, currentHp, attackerName) => {
      // Shield Orb Absorption
      if (this.player.shieldBuffTimer > 0) {
        this.player.shieldBuffTimer = 0; // Shield consumed
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + damage); // Absorb full damage
        sound.playShieldBlock();
        sound.vibrate(40);
        this.particles.createSpecialShockwave(this.player.x, this.player.y - 30, '#FFD60A');
        this.particles.addFloatingNumber(this.player.x, this.player.y - 50, 'SHIELD ABSORBED!', '#FFD60A', true);
        return;
      }

      this.totalDamageReceived += damage;
      this.addCameraShake(8, 0.25);
      if (currentHp <= 0 && this.onGameOver) {
        this.onGameOver(`Defeated by ${attackerName || 'Enemy Forces'}`);
      }
    };

    this.enemyManager.onAllWavesCleared = () => {
      if (this.onStageWon) {
        this.onStageWon();
      }
    };
  }

  public getActiveBoss(): EnemyEntity | undefined {
    return this.enemyManager.enemies.find((e) => e.isBoss && !e.isDead);
  }

  public update(dt: number, controls: InputControls): void {
    this.updatePlayer(dt, controls);
    this.enemyManager.update(dt, this.player);
    this.updateCollectibles(dt);
    this.checkCollisions();
    this.updateCamera(dt);
    this.particles.update(dt);

    // Update combo timer
    if (this.comboTimeout > 0) {
      this.comboTimeout -= dt;
      if (this.comboTimeout <= 0) {
        this.comboCount = 0;
      }
    }
  }

  private updatePlayer(dt: number, controls: InputControls): void {
    const p = this.player;
    p.stateTime += dt;

    // Cooldowns
    if (p.specialCooldown > 0) {
      p.specialCooldown = Math.max(0, p.specialCooldown - dt);
    }
    if (p.comboResetTimer > 0) {
      p.comboResetTimer -= dt;
      if (p.comboResetTimer <= 0) {
        p.comboStep = 1;
      }
    }
    if (p.invulnerableTimer > 0) {
      p.invulnerableTimer = Math.max(0, p.invulnerableTimer - dt);
    }

    // Active In-Stage Buffs
    if (p.speedBuffTimer > 0) {
      p.speedBuffTimer = Math.max(0, p.speedBuffTimer - dt);
    }
    if (p.damageBuffTimer > 0) {
      p.damageBuffTimer = Math.max(0, p.damageBuffTimer - dt);
    }
    if (p.shieldBuffTimer > 0) {
      p.shieldBuffTimer = Math.max(0, p.shieldBuffTimer - dt);
    }

    const currentSpeed = p.speedBuffTimer > 0 ? p.speed * 1.4 : p.speed;

    // Special Ability State
    if (p.isSpecialActive) {
      p.specialDuration -= dt;
      // High speed dash
      p.vx = p.facing === 'right' ? p.speed * 2.3 : -p.speed * 2.3;
      p.vy = 0;

      // Add shadow trail
      if (Math.random() < 0.45) {
        p.dashTrail.push({
          x: p.x,
          y: p.y,
          facing: p.facing,
          state: p.state,
          alpha: 0.65,
        });
      }

      if (p.specialDuration <= 0) {
        p.isSpecialActive = false;
        p.isAttacking = false;
        p.hitbox = null;
        p.state = 'idle';
        p.stateTime = 0;
      }
    }
    // Normal Attack State
    else if (p.isAttacking) {
      p.attackDuration -= dt;
      // Slight movement deceleration during attack
      p.vx *= 0.82;

      if (p.attackDuration <= 0) {
        p.isAttacking = false;
        p.hitbox = null;
        p.state = p.grounded ? 'idle' : 'fall';
        p.stateTime = 0;
      }
    }
    // Free Movement & Control Handling
    else {
      // Horizontal Input
      if (controls.left) {
        p.vx = -currentSpeed;
        p.facing = 'left';
        if (p.grounded) {
          p.state = 'run';
        }
      } else if (controls.right) {
        p.vx = currentSpeed;
        p.facing = 'right';
        if (p.grounded) {
          p.state = 'run';
        }
      } else {
        // Friction
        p.vx *= 0.7;
        if (Math.abs(p.vx) < 10) p.vx = 0;
        if (p.grounded) {
          p.state = 'idle';
        }
      }

      // Jump Input
      if (controls.jump && p.grounded) {
        p.vy = -p.jumpForce;
        p.grounded = false;
        p.state = 'jump';
        p.stateTime = 0;
        this.particles.createDust(p.x, p.y, 6);
        sound.playClick();
      }

      // Attack Input
      if (controls.attack) {
        this.triggerAttack();
      }

      // Special Ability Input
      if (controls.special && p.specialCooldown <= 0) {
        this.triggerSpecial();
      }
    }

    // Apply Gravity if airborne
    if (!p.grounded && !p.isSpecialActive) {
      p.vy += this.gravity * dt;
      if (p.vy > 0 && !p.isAttacking) {
        p.state = 'fall';
      }
    }

    // Move Player X
    p.x += p.vx * dt;
    // Boundary clamps
    p.x = Math.max(20, Math.min(this.stage.stageWidth - 20, p.x));

    // Move Player Y
    const prevY = p.y;
    p.y += p.vy * dt;

    // Platform Collisions (one-way pass through when falling down)
    let onPlatform = false;
    if (p.vy >= 0) {
      for (const plat of this.stage.platforms) {
        const platTop = plat.y;
        if (
          p.x >= plat.x - 10 &&
          p.x <= plat.x + plat.width + 10 &&
          prevY <= platTop &&
          p.y >= platTop
        ) {
          p.y = platTop;
          p.vy = 0;
          p.grounded = true;
          onPlatform = true;
          break;
        }
      }
    }

    // Main Ground Collision
    if (!onPlatform) {
      if (p.y >= this.stage.groundY) {
        if (!p.grounded && p.vy > 200) {
          // Landing dust
          this.particles.createDust(p.x, this.stage.groundY, 6);
        }
        p.y = this.stage.groundY;
        p.vy = 0;
        p.grounded = true;
      } else {
        p.grounded = false;
      }
    }

    // Update Hitbox Position with Player
    if (p.hitbox) {
      const offsetX = p.facing === 'right' ? 15 : -65;
      p.hitbox.x = p.x + offsetX;
      p.hitbox.y = p.y - 45;
    }

    // Update Dash Trail Alpha
    for (let i = p.dashTrail.length - 1; i >= 0; i--) {
      p.dashTrail[i].alpha -= dt * 2.5;
      if (p.dashTrail[i].alpha <= 0) {
        p.dashTrail.splice(i, 1);
      }
    }
  }

  private triggerAttack(): void {
    const p = this.player;
    p.isAttacking = true;
    p.hasHitInCurrentAttack = false;
    p.stateTime = 0;

    // Determine Combo step
    const currentStep = p.comboStep;
    if (currentStep === 1) {
      p.state = 'attack1';
      p.attackDuration = 0.22;
      p.comboStep = 2;
    } else if (currentStep === 2) {
      p.state = 'attack2';
      p.attackDuration = 0.25;
      p.comboStep = 3;
    } else {
      p.state = 'attack3';
      p.attackDuration = 0.35;
      p.comboStep = 1;
    }
    p.comboResetTimer = this.comboMaxWindow;

    // Slight forward impulse on attack
    p.vx += p.facing === 'right' ? 140 : -140;

    // Play Sound & Trigger Hitbox
    sound.playSlash(currentStep);

    const buffMultiplier = p.damageBuffTimer > 0 ? 1.5 : 1.0;
    const damageMultiplier = (currentStep === 1 ? 1.0 : currentStep === 2 ? 1.45 : 2.3) * buffMultiplier;
    const baseDamage = Math.round(p.atk * damageMultiplier);
    const knockbackX = p.facing === 'right' ? (currentStep === 3 ? 340 : 180) : (currentStep === 3 ? -340 : -180);
    const knockbackY = currentStep === 3 ? -240 : -120;

    p.hitbox = {
      x: p.x + (p.facing === 'right' ? 15 : -65),
      y: p.y - 45,
      width: currentStep === 3 ? 80 : 58,
      height: 52,
      damage: baseDamage,
      knockbackX,
      knockbackY,
    };

    // Character Archetype Ranged Combat: Mage fires arcane bolts!
    if (p.silhouetteType === 'mage') {
      const dirX = p.facing === 'right' ? 1 : -1;
      this.enemyManager.projectiles.push({
        id: Math.floor(Math.random() * 100000),
        x: p.x + dirX * 24,
        y: p.y - 34,
        vx: dirX * 580,
        vy: (Math.random() - 0.5) * 30,
        damage: Math.round(p.atk * 1.1),
        fromPlayer: true,
        type: 'arcane_bolt',
        radius: 8,
        life: 1.8,
        maxLife: 1.8,
        rotation: dirX > 0 ? 0 : Math.PI,
        color: '#3B82F6',
      });
      sound.playBowShoot();
    }
    // Ninja throws Kunai on step 2
    else if (p.silhouetteType === 'ninja' && currentStep === 2) {
      const dirX = p.facing === 'right' ? 1 : -1;
      this.enemyManager.projectiles.push({
        id: Math.floor(Math.random() * 100000),
        x: p.x + dirX * 20,
        y: p.y - 30,
        vx: dirX * 640,
        vy: 0,
        damage: Math.round(p.atk * 0.95),
        fromPlayer: true,
        type: 'kunai',
        radius: 6,
        life: 1.5,
        maxLife: 1.5,
        rotation: dirX > 0 ? 0 : Math.PI,
        color: '#94A3B8',
      });
    }
    // Tank has heavier camera shake on 3rd hit
    else if (p.silhouetteType === 'tank' && currentStep === 3) {
      this.addCameraShake(8, 0.25);
    }
  }

  private triggerSpecial(): void {
    const p = this.player;
    p.specialCooldown = p.maxSpecialCooldown;
    p.isSpecialActive = true;
    p.isAttacking = true;
    p.hasHitInCurrentAttack = false;
    p.state = 'special';
    p.stateTime = 0;
    p.specialDuration = 0.45;
    p.invulnerableTimer = 0.55;

    sound.playUpgrade();
    sound.vibrate(80);
    this.addCameraShake(14, 0.4);

    const dirX = p.facing === 'right' ? 1 : -1;

    // Character Archetype Special Abilities
    if (p.silhouetteType === 'mage') {
      // Arcane Nova & Comet Barrage
      this.particles.createSpecialShockwave(p.x, p.y - 30, '#3B82F6');
      for (let i = -1; i <= 1; i++) {
        this.enemyManager.projectiles.push({
          id: Math.floor(Math.random() * 100000),
          x: p.x + dirX * 20,
          y: p.y - 32,
          vx: dirX * 520,
          vy: i * 90,
          damage: Math.round(p.atk * 1.8),
          fromPlayer: true,
          type: 'arcane_bolt',
          radius: 10,
          life: 2.0,
          maxLife: 2.0,
          rotation: Math.atan2(i * 90, dirX * 520),
          color: '#60A5FA',
        });
      }
    } else if (p.silhouetteType === 'tank') {
      // Earthquake Ground Slam Shockwave
      this.particles.createSpecialShockwave(p.x, p.y - 10, '#FFD60A');
      this.enemyManager.projectiles.push({
        id: Math.floor(Math.random() * 100000),
        x: p.x + dirX * 30,
        y: this.stage.groundY - 5,
        vx: dirX * 420,
        vy: 0,
        damage: Math.round(p.atk * 2.8),
        fromPlayer: true,
        type: 'earth_shockwave',
        radius: 18,
        life: 1.6,
        maxLife: 1.6,
        rotation: 0,
        color: '#FFD60A',
      });
    } else if (p.silhouetteType === 'ninja') {
      // Shadow Dash Teleport Strike
      this.particles.createSpecialShockwave(p.x, p.y - 30, '#E63946');
    } else if (p.silhouetteType === 'sky') {
      // Celestial Storm: Golden lightning strikes & celestial energy bolts
      this.particles.createSpecialShockwave(p.x, p.y - 30, '#FFD60A');
      for (let i = -2; i <= 2; i++) {
        this.enemyManager.projectiles.push({
          id: Math.floor(Math.random() * 100000),
          x: p.x + i * 70,
          y: p.y - 120,
          vx: dirX * 360 + i * 40,
          vy: 280,
          damage: Math.round(p.atk * 3.6),
          fromPlayer: true,
          type: 'arcane_bolt',
          radius: 12,
          life: 1.5,
          maxLife: 1.5,
          rotation: Math.PI / 4,
          color: '#FFD60A',
        });
      }
    } else {
      // Basic Stick Whirlwind
      this.particles.createSpecialShockwave(p.x, p.y - 30, '#FFD60A');
    }

    // Special damage hitbox
    p.hitbox = {
      x: p.x - 45,
      y: p.y - 60,
      width: 120,
      height: 70,
      damage: Math.round(p.atk * 3.4),
      knockbackX: p.facing === 'right' ? 480 : -480,
      knockbackY: -290,
    };
  }

  private checkCollisions(): void {
    const p = this.player;
    if (!p.hitbox || p.hasHitInCurrentAttack) return;

    const hb = p.hitbox;

    for (const enemy of this.enemyManager.enemies) {
      if (enemy.isDead) continue;

      // Enemy Bounding Box
      const enemyBox = {
        x: enemy.x - enemy.width / 2,
        y: enemy.y - enemy.height,
        width: enemy.width,
        height: enemy.height,
      };

      if (
        hb.x < enemyBox.x + enemyBox.width &&
        hb.x + hb.width > enemyBox.x &&
        hb.y < enemyBox.y + enemyBox.height &&
        hb.y + hb.height > enemyBox.y
      ) {
        // Hit successfully!
        p.hasHitInCurrentAttack = true;

        const { isCrit, isBlocked, isShieldBreak } = this.enemyManager.damageEnemy(
          enemy,
          hb.damage,
          hb.knockbackX,
          hb.knockbackY,
          p
        );

        // Update Combo count
        if (!isBlocked) {
          this.comboCount += 1;
          this.comboTimeout = 2.2;

          if (this.comboCount >= 3) {
            this.particles.addFloatingNumber(
              p.x,
              p.y - 68,
              `COMBO x${this.comboCount}!`,
              '#06D6A0',
              true
            );
          }
        }

        const shakeIntensity = isShieldBreak ? 12 : isCrit ? 8 : 4;
        this.addCameraShake(shakeIntensity, 0.22);
        sound.vibrate(isCrit ? 50 : 25);

        break;
      }
    }
  }

  private updateCamera(dt: number): void {
    // Center camera on player with lead offset based on facing
    const leadOffset = this.player.facing === 'right' ? 80 : -80;
    this.camera.targetX = this.player.x + leadOffset;

    // Smooth Lerp
    this.camera.x += (this.camera.targetX - this.camera.x) * 0.12;

    // Decay camera shake
    if (this.camera.shakeTime > 0) {
      this.camera.shakeTime -= dt;
      if (this.camera.shakeTime <= 0) {
        this.camera.shakeIntensity = 0;
      }
    }
  }

  public addCameraShake(intensity: number, duration: number): void {
    this.camera.shakeIntensity = intensity;
    this.camera.shakeTime = duration;
  }

  public spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['health_orb', 'speed_boost', 'damage_multiplier', 'shield_orb'];
    const weights = [0.35, 0.25, 0.25, 0.15]; // Health orb most common, shield rarest
    const rand = Math.random();
    let cumulative = 0;
    let selectedType: PowerUpType = 'health_orb';

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand <= cumulative) {
        selectedType = types[i];
        break;
      }
    }

    const color =
      selectedType === 'health_orb'
        ? '#06D6A0'
        : selectedType === 'speed_boost'
        ? '#00F5D4'
        : selectedType === 'damage_multiplier'
        ? '#FF5400'
        : '#FFD60A';

    this.collectibles.push({
      id: this.nextCollectibleId++,
      type: selectedType,
      x: Math.max(40, Math.min(this.stage.stageWidth - 40, x)),
      y,
      vy: -180, // initial pop up
      groundY: this.stage.groundY,
      bobTimer: Math.random() * Math.PI,
      life: 18.0, // remains on stage for 18 seconds
      maxLife: 18.0,
      radius: selectedType === 'shield_orb' ? 14 : 12,
      color,
    });
  }

  private updateCollectibles(dt: number): void {
    const p = this.player;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      c.life -= dt;
      c.bobTimer += dt * 3.5;

      // Apply gravity until hovering just above ground
      if (c.y < c.groundY - 14) {
        c.vy += 650 * dt;
        c.y += c.vy * dt;
        if (c.y >= c.groundY - 14) {
          c.y = c.groundY - 14;
          c.vy = 0;
        }
      }

      // Check distance to player
      const dx = p.x - c.x;
      const dy = p.y - 30 - c.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 46) {
        // Collect!
        if (c.type === 'health_orb') {
          const heal = Math.min(35, p.maxHp - p.hp);
          p.hp = Math.min(p.maxHp, p.hp + 35);
          sound.playUpgrade();
          this.particles.createHitSparks(c.x, c.y, '#06D6A0', 16);
          this.particles.addFloatingNumber(p.x, p.y - 50, `+${heal} HP`, '#06D6A0', true);
          this.onPowerUpCollected?.('health_orb', 'Health Orb (+35 HP)');
        } else if (c.type === 'speed_boost') {
          p.speedBuffTimer = 8.0;
          sound.playUpgrade();
          this.particles.createHitSparks(c.x, c.y, '#00F5D4', 16);
          this.particles.addFloatingNumber(p.x, p.y - 50, 'SPEED BOOST!', '#00F5D4', true);
          this.onPowerUpCollected?.('speed_boost', 'Speed Boost (+40% Spd)');
        } else if (c.type === 'damage_multiplier') {
          p.damageBuffTimer = 8.0;
          sound.playUpgrade();
          this.particles.createHitSparks(c.x, c.y, '#FF5400', 16);
          this.particles.addFloatingNumber(p.x, p.y - 50, 'DAMAGE x1.5!', '#FF5400', true);
          this.onPowerUpCollected?.('damage_multiplier', 'Damage Multiplier (1.5x)');
        } else if (c.type === 'shield_orb') {
          p.shieldBuffTimer = 8.0;
          sound.playShieldBlock();
          this.particles.createSpecialShockwave(p.x, p.y - 30, '#FFD60A');
          this.particles.addFloatingNumber(p.x, p.y - 50, 'SHIELD ACTIVE!', '#FFD60A', true);
          this.onPowerUpCollected?.('shield_orb', 'Energy Shield (Protected)');
        }

        sound.vibrate(30);
        this.collectibles.splice(i, 1);
        continue;
      }

      // Expire if life depleted
      if (c.life <= 0) {
        this.collectibles.splice(i, 1);
      }
    }
  }
}
