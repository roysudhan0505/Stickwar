import { Particle, FloatingNumber } from './types';

export class ParticleSystem {
  private particles: Particle[] = [];
  private floatingNumbers: FloatingNumber[] = [];
  private nextId = 1;

  public update(dt: number): void {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt; // gravity for sparks/debris
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating numbers
    for (let i = this.floatingNumbers.length - 1; i >= 0; i--) {
      const fn = this.floatingNumbers[i];
      fn.y += fn.vy * dt;
      fn.life -= dt;
      if (fn.life <= 0) {
        this.floatingNumbers.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // Draw particles
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.shape === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        ctx.stroke();
      } else if (p.shape === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (2 - alpha), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw Floating Damage Numbers
    for (const fn of this.floatingNumbers) {
      const alpha = Math.max(0, fn.life / fn.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${fn.fontSize}px 'Bangers', cursive, sans-serif`;
      ctx.fillStyle = fn.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(fn.text, fn.x, fn.y);
      ctx.fillText(fn.text, fn.x, fn.y);
      ctx.restore();
    }
  }

  public createHitSparks(x: number, y: number, color: string = '#FFD60A', count = 12): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 260;
      this.particles.push({
        id: this.nextId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25 + Math.random() * 0.25,
        maxLife: 0.45,
        size: 2 + Math.random() * 2.5,
        color,
        shape: 'spark',
      });
    }
  }

  public createDust(x: number, y: number, count = 5): void {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 80;
      const vy = -15 - Math.random() * 30;
      this.particles.push({
        id: this.nextId++,
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx,
        vy,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
        size: 3 + Math.random() * 4,
        color: 'rgba(241, 241, 241, 0.3)',
        shape: 'smoke',
      });
    }
  }

  public createSpecialShockwave(x: number, y: number, color: string = '#E63946'): void {
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const speed = 250 + Math.random() * 150;
      this.particles.push({
        id: this.nextId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.6,
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.5,
        size: 3 + Math.random() * 3,
        color,
        shape: 'spark',
      });
    }
  }

  public addFloatingNumber(
    x: number,
    y: number,
    text: string,
    color: string = '#FFD60A',
    isCrit = false
  ): void {
    this.floatingNumbers.push({
      id: this.nextId++,
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      vy: -75 - Math.random() * 35,
      text,
      color,
      fontSize: isCrit ? 26 : 20,
      life: 0.8,
      maxLife: 0.8,
    });
  }

  public clear(): void {
    this.particles = [];
    this.floatingNumbers = [];
  }
}
