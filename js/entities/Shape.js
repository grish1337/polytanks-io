import { Entity } from './Entity.js';

export class Shape extends Entity {
  constructor(x, y, shapeType = 'square') {
    let radius = 16;
    let mass = 3;
    let hp = 30;
    let bodyDmg = 8;
    let xp = 10;
    let color = '#ffe869'; // Diep Yellow Square
    let sides = 4;

    if (shapeType === 'triangle') {
      radius = 20;
      mass = 6;
      hp = 60;
      bodyDmg = 12;
      xp = 25;
      color = '#fc5e5e'; // Diep Red Triangle
      sides = 3;
    } else if (shapeType === 'pentagon') {
      radius = 30;
      mass = 16;
      hp = 180;
      bodyDmg = 20;
      xp = 130;
      color = '#5582ff'; // Diep Blue Pentagon
      sides = 5;
    } else if (shapeType === 'alpha_pentagon') {
      radius = 75;
      mass = 80;
      hp = 3000;
      bodyDmg = 40;
      xp = 3000;
      color = '#5582ff'; // Diep Giant Pentagon
      sides = 5;
    }

    super(x, y, radius, mass);
    this.type = 'shape';
    this.shapeType = shapeType;
    this.maxHealth = hp;
    this.health = hp;
    this.bodyDamage = bodyDmg;
    this.xpValue = xp;
    this.color = color;
    this.sides = sides;

    this.angle = Math.random() * Math.PI * 2;
    this.angularVel = (Math.random() - 0.5) * 0.015;
    this.elasticity = 0.3;
  }

  onDeath(attacker) {
    if (attacker && attacker.addXP) {
      attacker.addXP(this.xpValue);
    }
  }

  draw(ctx, camera) {
    const screen = camera.worldToScreen(this.pos.x, this.pos.y);
    const renderRadius = this.radius * camera.zoom;

    // Viewport culling
    if (
      screen.x < -renderRadius * 2 ||
      screen.x > camera.viewportWidth + renderRadius * 2 ||
      screen.y < -renderRadius * 2 ||
      screen.y > camera.viewportHeight + renderRadius * 2
    ) {
      return;
    }

    ctx.save();
    ctx.translate(screen.x, screen.y);
    ctx.rotate(this.angle);

    // Diep.io Clean Flat Drawing (No Neon Glow)
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : this.color;
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = Math.max(3, renderRadius * 0.12);

    ctx.beginPath();
    for (let i = 0; i < this.sides; i++) {
      const a = (i * 2 * Math.PI) / this.sides;
      const px = Math.cos(a) * renderRadius;
      const py = Math.sin(a) * renderRadius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Diep.io Health Bar
    if (this.health < this.maxHealth) {
      const barW = renderRadius * 2.2;
      const barH = 5 * camera.zoom;
      const barX = screen.x - barW / 2;
      const barY = screen.y + renderRadius + 10 * camera.zoom;
      const hpPercent = Math.max(0, this.health / this.maxHealth);

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#85e37d'; // Diep Green Health Bar
      ctx.fillRect(barX, barY, barW * hpPercent, barH);
      ctx.restore();
    }
  }
}
