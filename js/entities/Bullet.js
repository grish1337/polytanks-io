import { Entity } from './Entity.js';

export class Bullet extends Entity {
  constructor(x, y, vx, vy, radius, damage, penetration, speed, owner, color = '#00b2e7') {
    super(x, y, radius, 0.5);
    this.type = 'bullet';
    this.vel.set(vx, vy);
    this.damage = damage;
    this.penetration = penetration;
    this.speed = speed;
    this.owner = owner;
    this.color = color;
    
    this.maxHealth = penetration;
    this.health = penetration;
    this.bodyDamage = damage;
    
    this.lifespan = 2.5;
    this.elasticity = 0.3;
  }

  update(dt = 1) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    this.lifespan -= 0.016 * dt;
    if (this.lifespan <= 0 || this.health <= 0) {
      this.dead = true;
    }
  }

  draw(ctx, camera) {
    const screen = camera.worldToScreen(this.pos.x, this.pos.y);
    const renderRadius = this.radius * camera.zoom;

    // Viewport culling
    if (
      screen.x < -50 || screen.x > camera.viewportWidth + 50 ||
      screen.y < -50 || screen.y > camera.viewportHeight + 50
    ) {
      return;
    }

    ctx.save();
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = Math.max(2.5, renderRadius * 0.2);

    ctx.beginPath();
    ctx.arc(screen.x, screen.y, renderRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
