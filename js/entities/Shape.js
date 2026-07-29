import { Entity } from './Entity.js';
import { Vector2D } from '../engine/Vector2D.js';

export class Shape extends Entity {
  constructor(x, y, type = 'square') {
    let radius = 16;
    let mass = 8;
    let health = 10;
    let xpValue = 10;
    let color = '#ffe869';

    if (type === 'triangle') {
      radius = 20;
      mass = 14;
      health = 30;
      xpValue = 25;
      color = '#fc5e5e';
    } else if (type === 'pentagon') {
      radius = 30;
      mass = 35;
      health = 100;
      xpValue = 130;
      color = '#5582ff';
    } else if (type === 'alpha_pentagon') {
      radius = 75;
      mass = 250;
      health = 1000;
      xpValue = 3000;
      color = '#5582ff';
    }

    super(x, y, radius, mass);
    this.type = 'shape';
    this.shapeType = type;
    this.health = health;
    this.maxHealth = health;
    this.xpValue = xpValue;
    this.color = color;
    this.bodyDamage = type === 'alpha_pentagon' ? 20 : (type === 'pentagon' ? 12 : (type === 'triangle' ? 8 : 5));

    this.angle = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.015;

    // Gentle ambient floating drift velocity (like Diep.io shapes)
    this.vel = new Vector2D((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4);
    this.friction = 0.995;
  }

  update(dt = 1) {
    super.update(dt);
    this.angle += this.rotSpeed * dt;
  }

  draw(ctx, camera) {
    const screen = camera.worldToScreen(this.pos.x, this.pos.y);
    const renderRadius = this.radius * camera.zoom;

    if (
      screen.x < -100 || screen.x > camera.viewportWidth + 100 ||
      screen.y < -100 || screen.y > camera.viewportHeight + 100
    ) {
      return;
    }

    ctx.save();
    ctx.translate(screen.x, screen.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : this.color;
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = Math.max(2.5, renderRadius * 0.15);

    ctx.beginPath();
    let sides = 4;
    if (this.shapeType === 'triangle') sides = 3;
    else if (this.shapeType === 'pentagon' || this.shapeType === 'alpha_pentagon') sides = 5;

    for (let i = 0; i < sides; i++) {
      const a = (i * Math.PI * 2) / sides;
      const vx = Math.cos(a) * renderRadius;
      const vy = Math.sin(a) * renderRadius;
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Health bar if damaged
    if (this.health < this.maxHealth) {
      const barW = renderRadius * 2.2;
      const barH = 4 * camera.zoom;
      const barX = screen.x - barW / 2;
      const barY = screen.y + renderRadius + 8 * camera.zoom;
      const hpPercent = Math.max(0, this.health / this.maxHealth);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#85e37d';
      ctx.fillRect(barX, barY, barW * hpPercent, barH);
    }
  }
}
