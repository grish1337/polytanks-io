import { Entity } from './Entity.js';
import { Bullet } from './Bullet.js';

export class Boss extends Entity {
  constructor(x, y, name = 'FALLEN SENTINEL') {
    super(x, y, 65, 80);
    this.type = 'boss';
    this.name = name;
    this.color = '#f14e54';
    this.maxHealth = 4000;
    this.health = 4000;
    this.bodyDamage = 50;
    this.xpValue = 5000;
    
    this.shootTimer = 0;
    this.shootInterval = 0.6;
    this.elasticity = 0.2;
  }

  onDeath(attacker) {
    if (attacker && attacker.addXP) {
      attacker.addXP(this.xpValue);
    }
  }

  update(dt = 1, game) {
    super.update(dt);

    if (game && game.player) {
      const dx = game.player.pos.x - this.pos.x;
      const dy = game.player.pos.y - this.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 200) {
        this.vel.x += (dx / dist) * 0.25;
        this.vel.y += (dy / dist) * 0.25;
      }
      this.angle = Math.atan2(dy, dx);
    }

    this.shootTimer += 0.016 * dt;
    if (this.shootTimer >= this.shootInterval && game) {
      this.shootTimer = 0;
      this.fireRingAttack(game);
    }
  }

  fireRingAttack(game) {
    const bulletCount = 8;
    for (let i = 0; i < bulletCount; i++) {
      const a = this.angle + (i * Math.PI * 2) / bulletCount;
      const speed = 6.5;
      const vx = Math.cos(a) * speed;
      const vy = Math.sin(a) * speed;
      const b = new Bullet(
        this.pos.x + Math.cos(a) * this.radius,
        this.pos.y + Math.sin(a) * this.radius,
        vx, vy, 12, 25, 40, speed, this, '#f14e54'
      );
      game.bullets.push(b);
    }
    if (game.soundEngine) {
      game.soundEngine.playShootSound(0.7, true);
    }
  }

  draw(ctx, camera) {
    const screen = camera.worldToScreen(this.pos.x, this.pos.y);
    const renderRadius = this.radius * camera.zoom;

    ctx.save();
    ctx.translate(screen.x, screen.y);
    ctx.rotate(this.angle);

    ctx.shadowBlur = 0;
    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : '#f14e54';
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 5 * camera.zoom;

    ctx.beginPath();
    const points = 8;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? renderRadius : renderRadius * 0.75;
      const a = (i * Math.PI) / points;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
