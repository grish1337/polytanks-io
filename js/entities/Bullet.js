import { Entity } from './Entity.js';

export class Bullet extends Entity {
  constructor(x, y, vx, vy, radius = 8, damage = 20, penetration = 20, speed = 10, owner = null, color = '#00b2e7') {
    super(x, y, radius, radius * 0.5);
    this.type = 'bullet';
    this.vel.x = vx;
    this.vel.y = vy;
    this.damage = damage;
    this.penetration = penetration;
    this.speed = speed;
    this.owner = owner;
    this.color = color;

    // Bullet Health Pool (Allows piercing through multiple shapes!)
    this.maxHealth = Math.max(10, penetration * 2.0);
    this.health = this.maxHealth;

    this.life = 80; // Lifespan frames
    this.maxLife = 80;
  }

  update(dt = 1) {
    super.update(dt);
    this.life -= 1 * dt;
    if (this.life <= 0 || this.health <= 0) {
      this.dead = true;
    }
  }

  draw(ctx, camera) {
    const screen = camera.worldToScreen(this.pos.x, this.pos.y);
    const renderRadius = this.radius * camera.zoom;

    if (
      screen.x < -50 || screen.x > camera.viewportWidth + 50 ||
      screen.y < -50 || screen.y > camera.viewportHeight + 50
    ) {
      return;
    }

    ctx.save();
    ctx.translate(screen.x, screen.y);

    // Fade out as life decreases
    const alpha = Math.min(1.0, this.life / 10);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = Math.max(2, renderRadius * 0.2);

    ctx.beginPath();
    ctx.arc(0, 0, renderRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
