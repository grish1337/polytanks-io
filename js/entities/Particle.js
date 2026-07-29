import { Vector2D } from '../engine/Vector2D.js';

export class Particle {
  constructor(x, y, vx, vy, color, radius, life = 1.0) {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D(vx, vy);
    this.color = color;
    this.radius = radius;
    this.maxLife = life;
    this.life = life;
    this.dead = false;
  }

  update(dt = 1) {
    this.vel.mult(0.92);
    this.pos.add(Vector2D.mult(this.vel, dt));
    this.life -= 0.025 * dt;
    if (this.life <= 0) {
      this.dead = true;
    }
  }

  draw(ctx, camera) {
    const screen = camera.worldToScreen(this.pos.x, this.pos.y);
    const alpha = Math.max(0, this.life / this.maxLife);
    const renderRadius = Math.max(0.1, this.radius * alpha * camera.zoom);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, renderRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class ParticleManager {
  constructor() {
    this.particles = [];
  }

  spawnSparks(x, y, nx, ny, color, count = 4) {
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 1.5;
      const speed = 2 + Math.random() * 4;
      const vx = (-nx + spread) * speed;
      const vy = (-ny + spread) * speed;
      const r = 2 + Math.random() * 2.5;
      this.particles.push(new Particle(x, y, vx, vy, color, r, 0.3 + Math.random() * 0.3));
    }
  }

  spawnExplosion(x, y, color, count = 12, radiusMax = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const r = 2 + Math.random() * radiusMax;
      this.particles.push(new Particle(x, y, vx, vy, color, r, 0.4 + Math.random() * 0.4));
    }
  }

  update(dt = 1) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.dead) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx, camera) {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].draw(ctx, camera);
    }
  }
}
