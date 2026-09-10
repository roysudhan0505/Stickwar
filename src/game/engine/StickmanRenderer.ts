import { PlayerEntity, StickmanState } from './types';

export class StickmanRenderer {
  /**
   * Render a stickman character onto the canvas context
   */
  public static drawStickman(
    ctx: CanvasRenderingContext2D,
    player: PlayerEntity,
    color: string = '#FFD60A',
    overrideState?: StickmanState
  ): void {
    const state = overrideState || player.state;
    const facing = player.facing;
    const isFacingLeft = facing === 'left';
    const t = player.stateTime;

    ctx.save();
    ctx.translate(player.x, player.y);

    // Apply horizontal flip if facing left
    if (isFacingLeft) {
      ctx.scale(-1, 1);
    }

    // Hurt flash
    const isFlashing = player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer * 20) % 2 === 0;
    const mainColor = isFlashing ? '#FFFFFF' : color;
    const strokeColor = mainColor;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Calculate joint angles based on state
    let headY = -58;
    let spineTilt = 0;
    let leftLegAngle = 0;
    let rightLegAngle = 0;
    let leftArmAngle = 0;
    let rightArmAngle = 0;
    let weaponAngle = 0;
    let weaponOffset = { x: 0, y: 0 };

    switch (state) {
      case 'idle': {
        const bob = Math.sin(t * 5) * 2;
        headY += bob;
        leftLegAngle = 0.15;
        rightLegAngle = -0.15;
        leftArmAngle = 0.4 + Math.sin(t * 3) * 0.05;
        rightArmAngle = -0.3 + Math.cos(t * 3) * 0.05;
        weaponAngle = 0.6;
        break;
      }

      case 'run': {
        const runCycle = Math.sin(t * 16);
        const bob = Math.abs(Math.cos(t * 16)) * 4;
        headY += bob - 2;
        spineTilt = 0.25; // Lean forward
        leftLegAngle = runCycle * 0.85;
        rightLegAngle = -runCycle * 0.85;
        leftArmAngle = -runCycle * 0.9;
        rightArmAngle = runCycle * 0.9;
        weaponAngle = 0.3 + runCycle * 0.3;
        break;
      }

      case 'jump': {
        headY -= 4;
        spineTilt = 0.1;
        leftLegAngle = 0.6; // Tucked knees
        rightLegAngle = -0.4;
        leftArmAngle = -1.2; // Arms raised for momentum
        rightArmAngle = -0.8;
        weaponAngle = -0.5;
        break;
      }

      case 'fall': {
        headY -= 2;
        leftLegAngle = -0.3;
        rightLegAngle = 0.5;
        leftArmAngle = -0.8;
        rightArmAngle = 0.5;
        weaponAngle = 0.2;
        break;
      }

      case 'attack1': {
        // Quick horizontal slash
        spineTilt = 0.3;
        leftLegAngle = 0.4;
        rightLegAngle = -0.5;
        const progress = Math.min(t / 0.22, 1);
        rightArmAngle = -1.4 + progress * 2.8;
        leftArmAngle = 0.6;
        weaponAngle = rightArmAngle + 0.4;
        break;
      }

      case 'attack2': {
        // Upward rising uppercut slash
        spineTilt = -0.2;
        leftLegAngle = -0.3;
        rightLegAngle = 0.4;
        const progress = Math.min(t / 0.25, 1);
        rightArmAngle = 1.2 - progress * 2.6;
        leftArmAngle = -0.7;
        weaponAngle = rightArmAngle - 0.5;
        break;
      }

      case 'attack3': {
        // Heavy 360 jumping whirlwind spin
        const progress = Math.min(t / 0.35, 1);
        const spin = progress * Math.PI * 2;
        spineTilt = Math.sin(spin) * 0.3;
        leftLegAngle = Math.cos(spin) * 0.6;
        rightLegAngle = -Math.cos(spin) * 0.6;
        rightArmAngle = spin;
        leftArmAngle = spin + Math.PI;
        weaponAngle = spin + 0.8;
        break;
      }

      case 'special': {
        // Heroic special pose / dash
        spineTilt = 0.5;
        leftLegAngle = 0.7;
        rightLegAngle = -0.7;
        const spin = t * 25;
        rightArmAngle = Math.sin(spin) * 2;
        leftArmAngle = -Math.sin(spin) * 2;
        weaponAngle = spin;
        break;
      }

      case 'hurt': {
        spineTilt = -0.4; // Reeling backward
        headY -= 4;
        leftLegAngle = -0.6;
        rightLegAngle = 0.2;
        leftArmAngle = -1.4;
        rightArmAngle = -1.2;
        weaponAngle = -1.0;
        break;
      }
    }

    // Draw Spine / Torso
    const hipY = -24;
    const neckY = headY + 14;
    const neckX = Math.sin(spineTilt) * 18;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Legs
    // Left Leg (Behind)
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    const knee1X = Math.sin(leftLegAngle) * 16;
    const knee1Y = hipY + Math.cos(leftLegAngle) * 16;
    const foot1X = knee1X + Math.sin(leftLegAngle + 0.2) * 15;
    const foot1Y = knee1Y + Math.cos(leftLegAngle + 0.2) * 15;
    ctx.lineTo(knee1X, knee1Y);
    ctx.lineTo(foot1X, Math.min(foot1Y, 0));
    ctx.stroke();

    // Right Leg (Front)
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    const knee2X = Math.sin(rightLegAngle) * 16;
    const knee2Y = hipY + Math.cos(rightLegAngle) * 16;
    const foot2X = knee2X + Math.sin(rightLegAngle - 0.2) * 15;
    const foot2Y = knee2Y + Math.cos(rightLegAngle - 0.2) * 15;
    ctx.lineTo(knee2X, knee2Y);
    ctx.lineTo(foot2X, Math.min(foot2Y, 0));
    ctx.stroke();

    // Torso
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(neckX, neckY);
    ctx.stroke();

    // Left Arm (Behind)
    const shoulderX = neckX;
    const shoulderY = neckY + 4;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    const elbow1X = shoulderX + Math.sin(leftArmAngle) * 14;
    const elbow1Y = shoulderY + Math.cos(leftArmAngle) * 14;
    const hand1X = elbow1X + Math.sin(leftArmAngle + 0.4) * 13;
    const hand1Y = elbow1Y + Math.cos(leftArmAngle + 0.4) * 13;
    ctx.lineTo(elbow1X, elbow1Y);
    ctx.lineTo(hand1X, hand1Y);
    ctx.stroke();

    // Right Arm (Front - Holding Weapon)
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    const elbow2X = shoulderX + Math.sin(rightArmAngle) * 15;
    const elbow2Y = shoulderY + Math.cos(rightArmAngle) * 15;
    const hand2X = elbow2X + Math.sin(rightArmAngle + 0.3) * 14;
    const hand2Y = elbow2Y + Math.cos(rightArmAngle + 0.3) * 14;
    ctx.lineTo(elbow2X, elbow2Y);
    ctx.lineTo(hand2X, hand2Y);
    ctx.stroke();

    // Head
    const headCenterX = neckX;
    const headCenterY = headY;
    ctx.fillStyle = '#1A1A2E';
    ctx.beginPath();
    ctx.arc(headCenterX, headCenterY, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Character-specific headgear / features
    this.drawHeadgear(ctx, player.silhouetteType, headCenterX, headCenterY, t, facing);

    // Weapon
    this.drawWeapon(
      ctx,
      player.silhouetteType,
      hand2X,
      hand2Y,
      weaponAngle,
      state,
      player.stateTime
    );

    // Slash Arc effect if attacking
    if (state.startsWith('attack') || state === 'special') {
      this.drawSlashArc(ctx, state, shoulderX, shoulderY, t, player.silhouetteType);
    }

    ctx.restore();
  }

  private static drawHeadgear(
    ctx: CanvasRenderingContext2D,
    type: 'basic' | 'ninja' | 'mage' | 'tank' | 'sky',
    x: number,
    y: number,
    t: number,
    facing: 'left' | 'right'
  ) {
    if (type === 'ninja') {
      // Crimson Headband & fluttering ribbon
      ctx.strokeStyle = '#E63946';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 13, -Math.PI * 0.8, -Math.PI * 0.1);
      ctx.stroke();

      // Fluttering ribbons behind head
      const ribbonWave = Math.sin(t * 12) * 5;
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 2);
      ctx.quadraticCurveTo(x - 22, y - 5 + ribbonWave, x - 32, y + ribbonWave);
      ctx.moveTo(x - 12, y);
      ctx.quadraticCurveTo(x - 20, y + 5 + ribbonWave, x - 28, y + 10 + ribbonWave);
      ctx.stroke();

      // Glowing Ninja Eye Slit
      ctx.fillStyle = '#FFD60A';
      ctx.beginPath();
      ctx.ellipse(x + 5, y - 2, 4, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'mage') {
      // Wizard Hat / Arcane Runes
      ctx.fillStyle = '#3B82F6';
      ctx.beginPath();
      ctx.moveTo(x - 14, y - 6);
      ctx.lineTo(x + 14, y - 6);
      ctx.lineTo(x - 2, y - 28);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pulsing magic orb in hat
      ctx.fillStyle = '#FFD60A';
      ctx.beginPath();
      ctx.arc(x - 2, y - 28, 3 + Math.sin(t * 8) * 1, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'tank') {
      // Spiked heavy iron helmet
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y - 2, 14, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.stroke();

      // Horn / Crest
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.moveTo(x, y - 16);
      ctx.lineTo(x - 4, y - 26);
      ctx.lineTo(x + 4, y - 26);
      ctx.closePath();
      ctx.fill();

      // Slit eyes
      ctx.fillStyle = '#E63946';
      ctx.fillRect(x + 3, y - 2, 6, 2);
    } else if (type === 'sky') {
      // Golden Celestial Halo & Crown
      ctx.strokeStyle = '#FFD60A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(x, y - 18, 14, 5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Eye
      ctx.fillStyle = '#FFD60A';
      ctx.beginPath();
      ctx.arc(x + 5, y - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Basic Stickman headband
      ctx.strokeStyle = '#E63946';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 13, -Math.PI * 0.8, -Math.PI * 0.2);
      ctx.stroke();

      // Eye
      ctx.fillStyle = '#FFD60A';
      ctx.beginPath();
      ctx.arc(x + 5, y - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private static drawWeapon(
    ctx: CanvasRenderingContext2D,
    type: 'basic' | 'ninja' | 'mage' | 'tank' | 'sky',
    hx: number,
    hy: number,
    angle: number,
    state: StickmanState,
    t: number
  ) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);

    if (type === 'ninja') {
      // Sleek Katana with Blood Red edge
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 10); // Handle
      ctx.stroke();

      // Guard
      ctx.strokeStyle = '#FFD60A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();

      // Blade with curve
      ctx.strokeStyle = '#F1F1F1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-2, -22, -6, -42);
      ctx.stroke();

      // Katana Edge highlight
      ctx.strokeStyle = '#E63946';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(1, 0);
      ctx.quadraticCurveTo(-1, -22, -5, -42);
      ctx.stroke();
    } else if (type === 'mage') {
      // Mystic Crystal Staff
      ctx.strokeStyle = '#854D0E';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(0, -32);
      ctx.stroke();

      // Magic Crystal Orb
      const pulse = Math.sin(t * 10) * 2;
      ctx.fillStyle = '#3B82F6';
      ctx.shadowColor = '#60A5FA';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, -36, 7 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (type === 'tank') {
      // Giant War Hammer
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(0, -30);
      ctx.stroke();

      // Heavy Hammer Head
      ctx.fillStyle = '#64748B';
      ctx.strokeStyle = '#FFD60A';
      ctx.lineWidth = 2;
      ctx.fillRect(-14, -42, 28, 16);
      ctx.strokeRect(-14, -42, 28, 16);
    } else if (type === 'sky') {
      // Celestial Stormblade
      ctx.strokeStyle = '#FFD60A';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#FFD60A';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(0, -38);
      ctx.stroke();

      // Energy Crossguard
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Basic Broadsword
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 10);
      ctx.stroke();

      // Crossguard
      ctx.strokeStyle = '#FFD60A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();

      // Blade
      ctx.strokeStyle = '#F1F1F1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -36);
      ctx.stroke();
    }

    ctx.restore();
  }

  private static drawSlashArc(
    ctx: CanvasRenderingContext2D,
    state: StickmanState,
    sx: number,
    sy: number,
    t: number,
    type: 'basic' | 'ninja' | 'mage' | 'tank' | 'sky'
  ) {
    ctx.save();
    ctx.translate(sx, sy);

    const arcColor =
      type === 'ninja' ? '#E63946' : type === 'mage' ? '#3B82F6' : '#FFD60A';

    ctx.strokeStyle = arcColor;
    ctx.shadowColor = arcColor;
    ctx.shadowBlur = 12;
    ctx.lineCap = 'round';

    if (state === 'attack1') {
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(10, 0, 48, -0.6, 0.9);
      ctx.stroke();
    } else if (state === 'attack2') {
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(12, -10, 52, 1.2, -0.7, true);
      ctx.stroke();
    } else if (state === 'attack3') {
      // 360 wide vortex
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(0, 0, 58, 0, Math.PI * 2);
      ctx.stroke();
    } else if (state === 'special') {
      // Multi-layer shockwave
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(20, 0, 65, -1.2, 1.2);
      ctx.stroke();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    ctx.restore();
  }
}
