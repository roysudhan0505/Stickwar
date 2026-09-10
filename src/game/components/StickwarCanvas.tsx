import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { StickmanRenderer } from '../engine/StickmanRenderer';
import { EnemyRenderer } from '../engine/EnemyRenderer';

interface StickwarCanvasProps {
  engine: GameEngine;
  className?: string;
}

export const StickwarCanvas: React.FC<StickwarCanvasProps> = ({ engine, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Responsive Canvas setup with Retina devicePixelRatio support
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = container.clientWidth;
      const height = container.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Main render pass invoked by parent game loop
  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = parseFloat(canvas.style.width) || canvas.width;
    const height = parseFloat(canvas.style.height) || canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Apply Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (engine.camera.shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * engine.camera.shakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * engine.camera.shakeIntensity * 2;
    }

    // Camera view offset: center vertically around player's ground level
    const camX = engine.camera.x;
    const camY = engine.stage.groundY - height * 0.65;

    // 1. Draw Parallax Background (Sky, Moon, Distant Mountains)
    drawBackground(ctx, width, height, camX, engine.stage.theme);

    // 2. World Space Transform
    ctx.save();
    ctx.translate(-camX + width / 2 + shakeX, -camY + shakeY);

    // 3. Draw Stage Platforms & Ground
    drawStageEnvironment(ctx, engine, width);

    // 4. Draw Dash Shadow Trails
    for (const trail of engine.player.dashTrail) {
      ctx.save();
      ctx.globalAlpha = trail.alpha * 0.4;
      StickmanRenderer.drawStickman(
        ctx,
        { ...engine.player, x: trail.x, y: trail.y, facing: trail.facing },
        '#E63946',
        trail.state
      );
      ctx.restore();
    }

    // 5. Draw In-Stage Collectibles / Power-Ups
    drawCollectibles(ctx, engine);

    // 6. Draw Enemies with distinct animations, shields, and weapons
    for (const enemy of engine.enemyManager.enemies) {
      EnemyRenderer.drawEnemy(ctx, enemy);
    }

    // 7. Draw Combat Projectiles (Arrows, Kunais, Arcane Bolts, Shockwaves)
    for (const proj of engine.enemyManager.projectiles) {
      EnemyRenderer.drawProjectile(ctx, proj);
    }

    // 8. Draw Main Player Stickman and Active Buff Auras
    drawPlayerBuffAuras(ctx, engine.player);
    StickmanRenderer.drawStickman(ctx, engine.player, '#FFD60A');

    // 9. Draw Particles & Floating Damage Numbers
    engine.particles.draw(ctx);

    ctx.restore();

    // 9. Screen-Space Wave Announcement Overlay
    if (engine.enemyManager.wave.announcement && engine.enemyManager.wave.announcementTimer > 0) {
      const alpha = Math.min(1, engine.enemyManager.wave.announcementTimer * 1.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, height * 0.28, width, 56);

      ctx.fillStyle = '#FFD60A';
      ctx.font = "bold 28px 'Bangers', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#FFD60A';
      ctx.shadowBlur = 12;
      ctx.fillText(engine.enemyManager.wave.announcement, width / 2, height * 0.28 + 28);
      ctx.restore();
    }
  };

  // Expose render function through canvas ref property
  useEffect(() => {
    if (canvasRef.current) {
      (canvasRef.current as unknown as { renderFrame: () => void }).renderFrame = renderFrame;
    }
  });

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full touch-none select-none" />
    </div>
  );
};

// Helper to draw comic-style parallax background
function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camX: number,
  theme: 'stone' | 'forest' | 'lava' | 'sky'
) {
  // Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (theme === 'lava') {
    skyGrad.addColorStop(0, '#2D0A14');
    skyGrad.addColorStop(1, '#1A1A2E');
  } else if (theme === 'forest') {
    skyGrad.addColorStop(0, '#0F1E24');
    skyGrad.addColorStop(1, '#1A1A2E');
  } else if (theme === 'sky') {
    skyGrad.addColorStop(0, '#1E293B');
    skyGrad.addColorStop(1, '#0F172A');
  } else {
    // Stone Valley
    skyGrad.addColorStop(0, '#16213E');
    skyGrad.addColorStop(1, '#1A1A2E');
  }

  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Distant Moon / Sun
  ctx.save();
  ctx.fillStyle = theme === 'lava' ? '#E63946' : '#FFD60A';
  ctx.shadowColor = theme === 'lava' ? '#E63946' : '#FFD60A';
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(width * 0.78 - (camX * 0.02) % 300, height * 0.22, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Distant Silhouette Mountains (0.15x parallax)
  const mountainOffset = (camX * 0.15) % 600;
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = -200; x < width + 300; x += 180) {
    const rx = x - mountainOffset;
    ctx.lineTo(rx, height * 0.55);
    ctx.lineTo(rx + 90, height * 0.42);
    ctx.lineTo(rx + 180, height * 0.55);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Midground Ridge / Ruins (0.35x parallax)
  const ridgeOffset = (camX * 0.35) % 400;
  ctx.fillStyle = '#0B0F19';
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = -200; x < width + 300; x += 120) {
    const rx = x - ridgeOffset;
    ctx.lineTo(rx, height * 0.68);
    ctx.lineTo(rx + 60, height * 0.58);
    ctx.lineTo(rx + 120, height * 0.68);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();
}

// Helper to draw platforms, ground line, and boundaries
function drawStageEnvironment(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  viewportWidth: number
) {
  const { groundY, stageWidth, platforms, theme } = engine.stage;

  // 1. Draw Platforms
  for (const plat of platforms) {
    // Platform Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(plat.x + 4, plat.y + 4, plat.width, plat.height);

    // Platform Body
    ctx.fillStyle = '#16213E';
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

    // Platform Outline
    ctx.strokeStyle = '#FFD60A';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);

    // Tech/Runic edge indicators
    ctx.fillStyle = '#E63946';
    ctx.fillRect(plat.x + 6, plat.y + 3, 8, plat.height - 6);
    ctx.fillRect(plat.x + plat.width - 14, plat.y + 3, 8, plat.height - 6);
  }

  // 2. Draw Main Ground
  // Ground Top Accent Line
  ctx.strokeStyle = theme === 'lava' ? '#E63946' : '#FFD60A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(stageWidth, groundY);
  ctx.stroke();

  // Deep Ground Soil / Floor Fill
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, groundY, stageWidth, 400);

  // Ground Grid / Texture notches
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 2;
  for (let gx = 0; gx <= stageWidth; gx += 80) {
    ctx.beginPath();
    ctx.moveTo(gx, groundY);
    ctx.lineTo(gx, groundY + 140);
    ctx.stroke();
  }

  // 3. Stage Boundaries
  ctx.strokeStyle = 'rgba(230, 57, 70, 0.4)';
  ctx.lineWidth = 6;
  ctx.setLineDash([12, 8]);
  ctx.strokeRect(10, 0, stageWidth - 20, groundY);
  ctx.setLineDash([]);
}

// Draw hostile / training target stickmen
function drawTarget(ctx: CanvasRenderingContext2D, target: any) {
  if (target.hp <= 0) return;

  ctx.save();
  ctx.translate(target.x, target.y);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 2, target.isBoss ? 28 : 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hurt flash color
  const isHurt = target.hurtTimer > 0;
  const bodyColor = isHurt ? '#FFFFFF' : target.isBoss ? '#E63946' : '#94A3B8';

  // Stickman Target Figure
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = target.isBoss ? 6 : 4;
  ctx.lineCap = 'round';

  const scale = target.isBoss ? 1.25 : 1.0;
  const headY = -52 * scale;
  const hipY = -22 * scale;

  // Legs
  ctx.beginPath();
  ctx.moveTo(0, hipY);
  ctx.lineTo(-12 * scale, 0);
  ctx.moveTo(0, hipY);
  ctx.lineTo(12 * scale, 0);
  ctx.stroke();

  // Torso
  ctx.beginPath();
  ctx.moveTo(0, hipY);
  ctx.lineTo(0, headY + 12 * scale);
  ctx.stroke();

  // Arms
  ctx.beginPath();
  ctx.moveTo(0, headY + 16 * scale);
  ctx.lineTo(-16 * scale, -28 * scale);
  ctx.moveTo(0, headY + 16 * scale);
  ctx.lineTo(16 * scale, -28 * scale);
  ctx.stroke();

  // Head
  ctx.fillStyle = '#1A1A2E';
  ctx.beginPath();
  ctx.arc(0, headY, 12 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Evil Eye Glow
  ctx.fillStyle = target.isBoss ? '#FFD60A' : '#E63946';
  ctx.fillRect(-6 * scale, headY - 2, 5 * scale, 2);

  // Floating Health Bar above target
  const hpPercent = Math.max(0, target.hp / target.maxHp);
  const barWidth = target.isBoss ? 64 : 44;
  const barHeight = 6;
  const barY = headY - 24;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

  ctx.fillStyle = target.isBoss ? '#FFD60A' : '#E63946';
  ctx.fillRect(-barWidth / 2, barY, barWidth * hpPercent, barHeight);

  // Target Name Tag
  ctx.font = "bold 10px 'Rajdhani', sans-serif";
  ctx.fillStyle = '#F1F1F1';
  ctx.textAlign = 'center';
  ctx.fillText(target.name, 0, barY - 4);

  ctx.restore();
}

/**
 * Draw in-stage power-up orbs with floating bobbing animations and glow
 */
function drawCollectibles(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
  for (const c of engine.collectibles) {
    const floatY = Math.sin(c.bobTimer) * 6;
    const drawY = c.y + floatY;

    ctx.save();

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.groundY, c.radius * 0.9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer Glow Aura
    ctx.shadowColor = c.color;
    ctx.shadowBlur = 12;

    // Outer Pulsing Ring
    const pulse = Math.sin(c.bobTimer * 2) * 2;
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, drawY, c.radius + pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Glowing Orb
    const grad = ctx.createRadialGradient(c.x, drawY, 2, c.x, drawY, c.radius);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.5, c.color);
    grad.addColorStop(1, '#1A1A2E');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, drawY, c.radius, 0, Math.PI * 2);
    ctx.fill();

    // Central Icon Symbol
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const symbol =
      c.type === 'health_orb'
        ? '+'
        : c.type === 'speed_boost'
        ? '⚡'
        : c.type === 'damage_multiplier'
        ? '⚔'
        : '🛡';

    ctx.fillText(symbol, c.x, drawY + 1);

    ctx.restore();
  }
}

/**
 * Draw active power-up visual auras around player
 */
function drawPlayerBuffAuras(ctx: CanvasRenderingContext2D, player: GameEngine['player']): void {
  const centerY = player.y - 32;

  // 1. Shield Bubble
  if (player.shieldBuffTimer > 0) {
    ctx.save();
    ctx.shadowColor = '#FFD60A';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = '#FFD60A';
    ctx.lineWidth = 2.5;

    // Glowing energy sphere
    ctx.fillStyle = 'rgba(255, 214, 10, 0.12)';
    ctx.beginPath();
    ctx.arc(player.x, centerY, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Shimmering Hexagon / Ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, centerY, 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Damage Boost Fire Flame Aura
  if (player.damageBuffTimer > 0) {
    ctx.save();
    ctx.shadowColor = '#FF5400';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#FF5400';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, centerY, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Speed Boost Aura
  if (player.speedBuffTimer > 0) {
    ctx.save();
    ctx.shadowColor = '#00F5D4';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#00F5D4';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(player.x - 18, player.y - 56, 36, 56);
    ctx.restore();
  }
}
