import { Entity } from './Entity.js';
import { Bullet } from './Bullet.js';
import { Vector2D } from '../engine/Vector2D.js';
import { TANK_CLASSES } from '../systems/ClassSystem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';

export class Tank extends Entity {
  constructor(x, y, name = 'Pilot', color = '#00b2e7', isBot = false) {
    super(x, y, 26, 12);
    this.type = 'tank';
    this.name = name;
    this.color = color;
    this.isBot = isBot;
    
    this.level = 1;
    this.xp = 0;
    this.score = 0;
    this.kills = 0;
    this.nextLevelXP = 100;

    this.godMode = false;

    this.upgradeSystem = new UpgradeSystem(this);
    this.classInfo = TANK_CLASSES.basic;
    
    this.barrelTimers = this.classInfo.barrels.map(() => 0);
    this.barrelRecoilOffsets = this.classInfo.barrels.map(() => 0);

    // Stat multipliers
    this.healthRegenRate = 0.5;
    this.bulletSpeedMultiplier = 1.0;
    this.bulletPenetrationMultiplier = 1.0;
    this.bulletDamageMultiplier = 1.0;
    this.reloadSpeedMultiplier = 1.0;
    this.moveSpeedMultiplier = 1.0;

    this.autoFire = false;
    this.autoSpin = false;
    this.isFiring = false;

    this.abilityCooldown = 0;
    this.shieldActiveTimer = 0;
    this.elasticity = 0.2;
  }

  addXP(amount) {
    this.xp += amount;
    this.score += amount;

    while (this.xp >= this.nextLevelXP && this.level < 45) {
      this.xp -= this.nextLevelXP;
      this.level++;
      this.nextLevelXP = Math.floor(100 * Math.pow(1.12, this.level - 1));
      
      this.upgradeSystem.availablePoints++;

      if (this.classInfo.id !== 'arena_closer') {
        this.radius = 26 + (this.level - 1) * 0.3;
        this.mass = 12 + (this.level - 1) * 0.8;
      }

      this.health = Math.min(this.maxHealth, this.health + this.maxHealth * 0.5);
    }
  }

  changeClass(classKey) {
    if (TANK_CLASSES[classKey]) {
      this.classInfo = TANK_CLASSES[classKey];
      this.barrelTimers = this.classInfo.barrels.map(() => 0);
      this.barrelRecoilOffsets = this.classInfo.barrels.map(() => 0);

      if (classKey === 'arena_closer') {
        this.color = '#ffe869'; // Yellow Fill
        this.radius = 78; // 3x Radius
        this.mass = 60;
        this.moveSpeedMultiplier = 2.5;
        this.godMode = true;
        this.health = 999999;
        this.maxHealth = 999999;
        this.bulletDamageMultiplier = 50.0;
        this.bulletPenetrationMultiplier = 50.0;
        this.reloadSpeedMultiplier = 2.5;
      }
    }
  }

  activateAbility(game) {
    if (this.abilityCooldown > 0) return false;

    this.abilityCooldown = this.classInfo.cooldown;
    const abilityName = this.classInfo.abilityName;

    if (abilityName === 'Hyper Dash' || abilityName === 'Hyper Jump' || abilityName === 'Overdrive Dash') {
      const impulse = Vector2D.fromAngle(this.angle, 12 * this.moveSpeedMultiplier);
      this.vel.add(impulse);
      if (game && game.camera) game.camera.shake(8);
    } else if (abilityName === 'Shield Matrix') {
      this.shieldActiveTimer = 3.0;
    } else if (abilityName === 'Quantum Shockwave' || abilityName === 'Blast Pulse' || abilityName === 'Extinction Blast') {
      const scale = this.radius / 26;
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI * 2) / 16;
        const spd = 12 * this.bulletSpeedMultiplier;
        const b = new Bullet(
          this.pos.x + Math.cos(a) * this.radius,
          this.pos.y + Math.sin(a) * this.radius,
          Math.cos(a) * spd,
          Math.sin(a) * spd,
          14 * scale,
          500,
          500,
          spd,
          this,
          this.color
        );
        game.bullets.push(b);
      }
      if (game && game.camera) game.camera.shake(16);
    }

    if (game && game.soundEngine) {
      game.soundEngine.playAbilitySound();
    }
    return true;
  }

  update(dt = 1, game) {
    super.update(dt);

    if (this.classInfo.id === 'arena_closer') {
      this.color = '#ffe869';
      this.radius = 78;
      this.godMode = true;
      this.moveSpeedMultiplier = 2.5;
      this.health = 999999;
      this.maxHealth = 999999;
    } else if (this.health < this.maxHealth) {
      this.health += this.healthRegenRate * 0.05 * dt;
      if (this.health > this.maxHealth) this.health = this.maxHealth;
    }

    if (this.autoSpin) {
      this.angle += 0.03 * dt;
    }

    if (this.abilityCooldown > 0) {
      this.abilityCooldown -= 0.016 * dt;
      if (this.abilityCooldown < 0) this.abilityCooldown = 0;
    }

    if (this.shieldActiveTimer > 0) {
      this.shieldActiveTimer -= 0.016 * dt;
      if (this.shieldActiveTimer < 0) this.shieldActiveTimer = 0;
    }

    const baseReload = 0.38 / this.reloadSpeedMultiplier;
    for (let i = 0; i < this.classInfo.barrels.length; i++) {
      const bInfo = this.classInfo.barrels[i];
      if (this.barrelTimers[i] > 0) {
        this.barrelTimers[i] -= 0.016 * dt;
      } else if ((this.isFiring || this.autoFire) && game) {
        this.fireBarrel(i, bInfo, baseReload, game);
      }

      if (this.barrelRecoilOffsets[i] > 0) {
        this.barrelRecoilOffsets[i] -= 1.2 * dt;
        if (this.barrelRecoilOffsets[i] < 0) this.barrelRecoilOffsets[i] = 0;
      }
    }
  }

  fireBarrel(index, bInfo, baseReload, game) {
    const scale = this.radius / 26;

    const jitter = (Math.random() - 0.5) * 0.02;
    const reloadTime = Math.max(0.04, (baseReload / (bInfo.reloadMult || 1.0)) + jitter);

    this.barrelTimers[index] = reloadTime;
    this.barrelRecoilOffsets[index] = 8;

    const fireAngle = this.angle + bInfo.angleOffset + ((Math.random() - 0.5) * (bInfo.spread || 0));
    const speed = 10 * this.bulletSpeedMultiplier * (bInfo.speedMult || 1.0);

    const cosA = Math.cos(this.angle);
    const sinA = Math.sin(this.angle);
    const localX = bInfo.height * scale;
    const localY = bInfo.offsetY * scale;

    const spawnX = this.pos.x + (localX * cosA - localY * sinA);
    const spawnY = this.pos.y + (localX * sinA + localY * cosA);

    const vx = Math.cos(fireAngle) * speed + this.vel.x * 0.15;
    const vy = Math.sin(fireAngle) * speed + this.vel.y * 0.15;

    const bRadius = 8 * (bInfo.sizeMult || 1.0) * scale;
    const bDmg = 16 * this.bulletDamageMultiplier * (bInfo.damageMult || 1.0);
    const bPen = 22 * this.bulletPenetrationMultiplier;

    const bullet = new Bullet(spawnX, spawnY, vx, vy, bRadius, bDmg, bPen, speed, this, this.color);
    game.bullets.push(bullet);

    if (game.networkManager && game.networkManager.connected && !this.isBot) {
      game.networkManager.sendShoot(spawnX, spawnY, vx, vy, bRadius, this.color);
    }

    const recoilForce = (bInfo.recoil || 2.5) / (this.mass * 0.1);
    this.vel.x -= Math.cos(fireAngle) * recoilForce;
    this.vel.y -= Math.sin(fireAngle) * recoilForce;

    if (game.soundEngine) {
      game.soundEngine.playShootSound(1.0 + (Math.random() - 0.5) * 0.15, (bInfo.damageMult || 1) > 2);
    }
  }

  takeDamage(amount, attacker = null) {
    if (this.godMode || this.shieldActiveTimer > 0 || this.classInfo.id === 'arena_closer') return;
    super.takeDamage(amount, attacker);
  }

  onDeath(attacker) {
    if (attacker && attacker.type === 'tank') {
      attacker.kills++;
      attacker.addXP(Math.floor(this.score * 0.5) + 500);
    }
  }

  draw(ctx, camera) {
    const screen = camera.worldToScreen(this.pos.x, this.pos.y);
    const renderRadius = this.radius * camera.zoom;
    const scale = this.radius / 26;

    if (
      screen.x < -200 || screen.x > camera.viewportWidth + 200 ||
      screen.y < -200 || screen.y > camera.viewportHeight + 200
    ) {
      return;
    }

    ctx.save();
    ctx.translate(screen.x, screen.y);
    ctx.rotate(this.angle);

    ctx.shadowBlur = 0;

    // Barrels
    for (let i = 0; i < this.classInfo.barrels.length; i++) {
      const b = this.classInfo.barrels[i];
      const recoilOffset = (this.barrelRecoilOffsets[i] || 0) * camera.zoom;

      ctx.save();
      ctx.rotate(b.angleOffset);

      ctx.fillStyle = '#999999';
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = Math.max(3.5, 3.5 * camera.zoom * scale);

      const drawH = b.height * camera.zoom * scale - recoilOffset;
      const drawW = b.width * camera.zoom * scale;
      const drawX = 0;
      const drawY = (b.offsetY * camera.zoom * scale) - drawW / 2;

      ctx.fillRect(drawX, drawY, drawH, drawW);
      ctx.strokeRect(drawX, drawY, drawH, drawW);

      ctx.restore();
    }

    // Body Circle
    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : (this.classInfo.id === 'arena_closer' ? '#ffe869' : this.color);
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = Math.max(3.5, renderRadius * 0.15);

    ctx.beginPath();
    ctx.arc(0, 0, renderRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Name & Health Bar
    ctx.save();
    ctx.font = '700 0.85rem Ubuntu, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;
    ctx.fillText(this.name, screen.x, screen.y - renderRadius - 12);

    if (this.health < this.maxHealth && this.classInfo.id !== 'arena_closer') {
      const barW = renderRadius * 2.4;
      const barH = 5 * camera.zoom;
      const barX = screen.x - barW / 2;
      const barY = screen.y + renderRadius + 10 * camera.zoom;
      const hpPercent = Math.max(0, this.health / this.maxHealth);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#85e37d';
      ctx.fillRect(barX, barY, barW * hpPercent, barH);
    }
    ctx.restore();
  }
}
