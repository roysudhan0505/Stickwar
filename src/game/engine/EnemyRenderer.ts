import { EnemyEntity, Projectile } from './types';

export class EnemyRenderer {
  /**
   * Draw an enemy entity with distinctive visual styling and state animations
   */
  public static drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyEntity): void {
    if (enemy.isDead && enemy.deathTimer <= 0) return;

    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    // Death fade / sink
    if (enemy.isDead) {
      const deathProgress = 1 - enemy.deathTimer / 0.6;
      ctx.globalAlpha = Math.max(0, 1 - deathProgress);
      ctx.translate(0, deathProgress * 15);
    }

    // Apply facing direction
    if (enemy.facing === 'left') {
      ctx.scale(-1, 1);
    }

    // Boss scale
    const scale = enemy.isBoss ? 1.45 : enemy.type === 'shield_bearer' ? 1.15 : 1.0;
    const t = enemy.stateTimer;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 2, (enemy.isBoss ? 32 : 18) * scale, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flash white if hurt
    const isHurt = enemy.hurtTimer > 0;
    const mainColor = isHurt ? '#FFFFFF' : enemy.isBoss ? (enemy.bossPhase === 2 ? '#FF0055' : '#E63946') : '#94A3B8';
    const strokeColor = mainColor;

    // Windup Warning exclamation / glowing danger indicator
    if (enemy.aiState === 'windup') {
      ctx.save();
      const warningPulse = Math.sin(t * 20) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(230, 57, 70, ${warningPulse})`;
      ctx.font = `bold ${14 * scale}px 'Bangers', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -68 * scale);
      ctx.restore();
    }

    // Boss Enrage Aura
    if (enemy.isBoss && enemy.bossPhase === 2) {
      ctx.save();
      ctx.strokeStyle = 'rgba(230, 57, 70, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const auraPulse = Math.sin(t * 12) * 5;
      ctx.arc(0, -32 * scale, (36 + auraPulse) * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Calculate pose angles based on AI state
    let headY = -54 * scale;
    let spineTilt = 0;
    let leftLegAngle = 0;
    let rightLegAngle = 0;
    let leftArmAngle = 0;
    let rightArmAngle = 0;
    let weaponAngle = 0;

    switch (enemy.aiState) {
      case 'idle': {
        const bob = Math.sin(t * 4) * 2;
        headY += bob;
        leftLegAngle = 0.1;
        rightLegAngle = -0.1;
        leftArmAngle = 0.3;
        rightArmAngle = -0.3;
        weaponAngle = 0.4;
        break;
      }

      case 'patrol':
      case 'chase': {
        const runSpeed = enemy.aiState === 'chase' ? 14 : 9;
        const runCycle = Math.sin(t * runSpeed);
        const bob = Math.abs(Math.cos(t * runSpeed)) * 3;
        headY += bob - 2;
        spineTilt = 0.22; // Aggressive forward tilt
        leftLegAngle = runCycle * 0.75;
        rightLegAngle = -runCycle * 0.75;
        leftArmAngle = -runCycle * 0.8;
        rightArmAngle = runCycle * 0.8;
        weaponAngle = 0.2 + runCycle * 0.3;
        break;
      }

      case 'windup': {
        // Raising weapon overhead / drawing bow
        spineTilt = -0.15;
        leftLegAngle = -0.3;
        rightLegAngle = 0.3;
        if (enemy.type === 'archer') {
          // Drawing bow
          leftArmAngle = 1.4; // Front arm holds bow
          rightArmAngle = -1.1; // Back arm pulls string
          weaponAngle = 1.4;
        } else {
          // Overhead heavy windup
          rightArmAngle = -2.2;
          leftArmAngle = -1.8;
          weaponAngle = -2.4;
        }
        break;
      }

      case 'attack': {
        // Strike forward!
        spineTilt = 0.35;
        leftLegAngle = 0.4;
        rightLegAngle = -0.5;
        const prog = Math.min(t / enemy.attackDuration, 1);
        if (enemy.type === 'archer') {
          leftArmAngle = 1.4;
          rightArmAngle = 0.4;
          weaponAngle = 1.4;
        } else {
          rightArmAngle = -2.0 + prog * 3.4;
          leftArmAngle = 0.4;
          weaponAngle = rightArmAngle + 0.3;
        }
        break;
      }

      case 'hurt': {
        spineTilt = -0.35;
        headY -= 4;
        leftLegAngle = -0.5;
        rightLegAngle = 0.2;
        leftArmAngle = -1.2;
        rightArmAngle = -1.0;
        weaponAngle = -0.8;
        break;
      }

      case 'death': {
        spineTilt = -0.7;
        headY += 10;
        leftLegAngle = -0.8;
        rightLegAngle = 0.4;
        leftArmAngle = -1.5;
        rightArmAngle = -1.5;
        weaponAngle = -1.2;
        break;
      }
    }

    const hipY = -22 * scale;
    const neckY = headY + 14 * scale;
    const neckX = Math.sin(spineTilt) * 16 * scale;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = (enemy.isBoss ? 6 : 4) * (scale >= 1.2 ? 1.1 : 1.0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Legs
    // Left leg
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    const k1x = Math.sin(leftLegAngle) * 15 * scale;
    const k1y = hipY + Math.cos(leftLegAngle) * 15 * scale;
    const f1x = k1x + Math.sin(leftLegAngle + 0.2) * 14 * scale;
    const f1y = k1y + Math.cos(leftLegAngle + 0.2) * 14 * scale;
    ctx.lineTo(k1x, k1y);
    ctx.lineTo(f1x, Math.min(f1y, 0));
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    const k2x = Math.sin(rightLegAngle) * 15 * scale;
    const k2y = hipY + Math.cos(rightLegAngle) * 15 * scale;
    const f2x = k2x + Math.sin(rightLegAngle - 0.2) * 14 * scale;
    const f2y = k2y + Math.cos(rightLegAngle - 0.2) * 14 * scale;
    ctx.lineTo(k2x, k2y);
    ctx.lineTo(f2x, Math.min(f2y, 0));
    ctx.stroke();

    // 2. Spine / Torso
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(neckX, neckY);
    ctx.stroke();

    // 3. Left Arm
    const shoulderX = neckX;
    const shoulderY = neckY + 4 * scale;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    const e1x = shoulderX + Math.sin(leftArmAngle) * 13 * scale;
    const e1y = shoulderY + Math.cos(leftArmAngle) * 13 * scale;
    const h1x = e1x + Math.sin(leftArmAngle + 0.4) * 12 * scale;
    const h1y = e1y + Math.cos(leftArmAngle + 0.4) * 12 * scale;
    ctx.lineTo(e1x, e1y);
    ctx.lineTo(h1x, h1y);
    ctx.stroke();

    // 4. Right Arm (Weapon holding arm)
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    const e2x = shoulderX + Math.sin(rightArmAngle) * 14 * scale;
    const e2y = shoulderY + Math.cos(rightArmAngle) * 14 * scale;
    const h2x = e2x + Math.sin(rightArmAngle + 0.3) * 13 * scale;
    const h2y = e2y + Math.cos(rightArmAngle + 0.3) * 13 * scale;
    ctx.lineTo(e2x, e2y);
    ctx.lineTo(h2x, h2y);
    ctx.stroke();

    // 5. Head
    ctx.fillStyle = '#1A1A2E';
    ctx.beginPath();
    ctx.arc(neckX, headY, 12 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Headgear & Enemy Specific Gear
    this.drawEnemyGear(ctx, enemy, neckX, headY, scale, t, h1x, h1y, h2x, h2y, weaponAngle);

    // 6. Floating In-World Health Bar (shown for non-bosses, or mini-bars)
    if (!enemy.isBoss && !enemy.isDead) {
      this.drawEnemyHealthBar(ctx, enemy, scale, headY);
    }

    ctx.restore();
  }

  private static drawEnemyGear(
    ctx: CanvasRenderingContext2D,
    enemy: EnemyEntity,
    headX: number,
    headY: number,
    scale: number,
    t: number,
    h1x: number,
    h1y: number,
    h2x: number,
    h2y: number,
    weaponAngle: number
  ) {
    // Boss Horned Crown & Evil Visor
    if (enemy.isBoss) {
      // Demon Horns
      ctx.fillStyle = enemy.bossPhase === 2 ? '#FF0055' : '#E63946';
      ctx.beginPath();
      // Left Horn
      ctx.moveTo(headX - 6 * scale, headY - 10 * scale);
      ctx.quadraticCurveTo(headX - 16 * scale, headY - 26 * scale, headX - 12 * scale, headY - 32 * scale);
      ctx.lineTo(headX - 4 * scale, headY - 14 * scale);
      // Right Horn
      ctx.moveTo(headX + 6 * scale, headY - 10 * scale);
      ctx.quadraticCurveTo(headX + 16 * scale, headY - 26 * scale, headX + 12 * scale, headY - 32 * scale);
      ctx.lineTo(headX + 4 * scale, headY - 14 * scale);
      ctx.fill();

      // Glowing Eyes
      ctx.fillStyle = enemy.bossPhase === 2 ? '#FFD60A' : '#FF0055';
      ctx.fillRect(headX + 2 * scale, headY - 2 * scale, 6 * scale, 3 * scale);

      // Colossal Warlord Greatsword / Axe
      ctx.save();
      ctx.translate(h2x, h2y);
      ctx.rotate(weaponAngle);
      ctx.strokeStyle = '#E63946';
      ctx.lineWidth = 6 * scale;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -48 * scale);
      ctx.stroke();

      // Giant Axe Blade
      ctx.fillStyle = enemy.bossPhase === 2 ? '#E63946' : '#94A3B8';
      ctx.beginPath();
      ctx.moveTo(0, -22 * scale);
      ctx.quadraticCurveTo(24 * scale, -32 * scale, 0, -48 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // Shield Bearer
    else if (enemy.type === 'shield_bearer') {
      // Iron helmet
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(headX, headY - 2, 13 * scale, -Math.PI * 0.8, -Math.PI * 0.2);
      ctx.stroke();

      // Red eye slit
      ctx.fillStyle = '#E63946';
      ctx.fillRect(headX + 3 * scale, headY - 2 * scale, 4 * scale, 2 * scale);

      // Tower Shield (held in front left arm)
      ctx.save();
      ctx.translate(h1x + 6, h1y - 6);
      if (enemy.isShielding && enemy.shieldBrokenTimer <= 0) {
        // Reinforced Spiked Tower Shield
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#FFD60A';
        ctx.lineWidth = 2.5;
        ctx.fillRect(-6, -24 * scale, 16 * scale, 46 * scale);
        ctx.strokeRect(-6, -24 * scale, 16 * scale, 46 * scale);

        // Iron Shield Boss / Spikes
        ctx.fillStyle = '#E63946';
        ctx.beginPath();
        ctx.arc(2 * scale, -1 * scale, 5 * scale, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Broken shield dangling / sparking
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(-4, -10 * scale, 12 * scale, 26 * scale);
      }
      ctx.restore();

      // Short Mace in right hand
      ctx.save();
      ctx.translate(h2x, h2y);
      ctx.rotate(weaponAngle);
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -28 * scale);
      ctx.stroke();
      ctx.fillStyle = '#FFD60A';
      ctx.fillRect(-5, -34 * scale, 10, 8);
      ctx.restore();
    }
    // Archer
    else if (enemy.type === 'archer') {
      // Archer Hood
      ctx.fillStyle = '#164E63';
      ctx.beginPath();
      ctx.moveTo(headX - 12 * scale, headY - 2);
      ctx.lineTo(headX, headY - 18 * scale);
      ctx.lineTo(headX + 12 * scale, headY - 2);
      ctx.closePath();
      ctx.fill();

      // Sharp Green Eye
      ctx.fillStyle = '#06D6A0';
      ctx.fillRect(headX + 3 * scale, headY - 2 * scale, 4 * scale, 2 * scale);

      // Curved Composite Longbow
      ctx.save();
      ctx.translate(h1x, h1y);
      ctx.rotate(weaponAngle);
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 24 * scale, -1.2, 1.2);
      ctx.stroke();

      // Bowstring
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const bowRadius = 24 * scale;
      const topX = Math.cos(-1.2) * bowRadius;
      const topY = Math.sin(-1.2) * bowRadius;
      const botX = Math.cos(1.2) * bowRadius;
      const botY = Math.sin(1.2) * bowRadius;

      if (enemy.aiState === 'windup') {
        // Pulled back to hand
        ctx.moveTo(topX, topY);
        ctx.lineTo(-8 * scale, 0);
        ctx.lineTo(botX, botY);

        // Arrow nocked
        ctx.strokeStyle = '#F1F1F1';
        ctx.lineWidth = 2;
        ctx.moveTo(-10 * scale, 0);
        ctx.lineTo(24 * scale, 0);
        ctx.stroke();
      } else {
        ctx.moveTo(topX, topY);
        ctx.lineTo(botX, botY);
      }
      ctx.stroke();
      ctx.restore();
    }
    // Standard Grunt
    else {
      // Crimson Headband
      ctx.strokeStyle = '#E63946';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(headX, headY, 12 * scale, -Math.PI * 0.8, -Math.PI * 0.2);
      ctx.stroke();

      // Red glowing eyes
      ctx.fillStyle = '#E63946';
      ctx.fillRect(headX + 2 * scale, headY - 2 * scale, 4 * scale, 2 * scale);

      // Serrated Machete
      ctx.save();
      ctx.translate(h2x, h2y);
      ctx.rotate(weaponAngle);
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -32 * scale);
      ctx.stroke();
      // Serration notches
      ctx.strokeStyle = '#E63946';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -14 * scale);
      ctx.lineTo(4, -18 * scale);
      ctx.moveTo(0, -22 * scale);
      ctx.lineTo(4, -26 * scale);
      ctx.stroke();
      ctx.restore();
    }
  }

  private static drawEnemyHealthBar(
    ctx: CanvasRenderingContext2D,
    enemy: EnemyEntity,
    scale: number,
    headY: number
  ) {
    const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
    const barWidth = 36 * scale;
    const barHeight = 5;
    const barY = headY - 18 * scale;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

    // HP Fill
    ctx.fillStyle = enemy.type === 'shield_bearer' ? '#FFD60A' : '#E63946';
    ctx.fillRect(-barWidth / 2, barY, barWidth * hpPercent, barHeight);

    // If shield bearer is active, show small shield icon / indicator
    if (enemy.type === 'shield_bearer' && enemy.isShielding && enemy.shieldBrokenTimer <= 0) {
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(-barWidth / 2 - 6, barY, 4, barHeight);
    }
  }

  /**
   * Draw Projectiles (Arrows, Arcane Bolts, Kunai, Earth Shockwaves)
   */
  public static drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile): void {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    if (p.type === 'arrow') {
      // Arrow shaft
      ctx.strokeStyle = '#854D0E';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(12, 0);
      ctx.stroke();

      // Arrowhead
      ctx.fillStyle = '#E63946';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(10, -4);
      ctx.lineTo(10, 4);
      ctx.closePath();
      ctx.fill();

      // Fletching / Feathers
      ctx.strokeStyle = '#F1F1F1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-20, -4);
      ctx.moveTo(-16, 0);
      ctx.lineTo(-20, 4);
      ctx.stroke();
    } else if (p.type === 'arcane_bolt') {
      // Pulsing magic bolt
      ctx.fillStyle = p.color || '#3B82F6';
      ctx.shadowColor = p.color || '#60A5FA';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Energy comet tail
      ctx.strokeStyle = '#93C5FD';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-18, 0);
      ctx.stroke();
    } else if (p.type === 'kunai') {
      // Spinning ninja kunai
      ctx.fillStyle = '#94A3B8';
      ctx.strokeStyle = '#E63946';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(0, -4);
      ctx.lineTo(-8, 0);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (p.type === 'earth_shockwave') {
      // Expanding ground shockwave rock spikes
      ctx.fillStyle = '#FFD60A';
      ctx.strokeStyle = '#E63946';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(0, -18);
      ctx.lineTo(14, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}
