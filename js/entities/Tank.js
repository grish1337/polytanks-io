import { Entity } from './Entity.js';
import { Bullet } from './Bullet.js';
import { TANK_CLASSES } from '../systems/ClassSystem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';

export class Tank extends Entity {
  constructor(x, y, name = 'Pilot', color = '#00b2e7', isBot = false) {
    super(x, y, 26, 12);

    this.type = 'tank';
    this.name = name || 'Pilot';
    this.color = color || '#00b2e7';
    this.isBot = isBot;

    this.level = 1;
    this.score = 0;
    this.xp = 0;
    this.nextLevelXP = 100;
    this.kills = 0;

    this.classInfo = TANK_CLASSES.basic;
    this.upgradeSystem = new UpgradeSystem();

    this.health = 100;
    this.maxHealth = 100;
    this.bodyDamage = 8;
    this.godMode = false;

    this.angle = 0;
    this.reloadTimers = [0];
    this.recoilVel = { x: 0, y: 0 };
    this.lastFiredTime = 0;
    this.hitFlashTimer = 0;

    // Equipped Cosmetic Visuals
    this.equippedSkin = null;
    this.equippedEffect = null;
    this.equippedPet = null;
    this.petAngle = Math.random() * Math.PI * 2;
  }

  addXP(amount) {
    if (this.level >= 45) return;
    this.xp += amount;
    this.score += amount;

    while (this.xp >= this.nextLevelXP && this.level < 45) {
      this.xp -= this.nextLevelXP;
      this.level += 1;
      this.nextLevelXP = Math.floor(100 * Math.pow(1.12, this.level - 1));

      if (this.level <= 33 || this.level % 3 === 0) {
        this.upgradeSystem.availablePoints += 1;
      }
    }

    const healthBonus = this.upgradeSystem.getMultiplier('maxHealth');
    this.maxHealth = Math.floor(100 * healthBonus);
  }

  changeClass(classKey) {
    const newClass = TANK_CLASSES[classKey];
    if (!newClass) return;

    this.classInfo = newClass;
    const barrelCount = newClass.barrels ? newClass.barrels.length : 1;
    this.reloadTimers = new Array(barrelCount).fill(0);

    if (classKey === 'arena_closer') {
      this.radius = 78;
      this.mass = 500;
      this.color = '#ffe869';
      this.godMode = true;
    } else {
      this.radius = 26;
      this.mass = 12;
      this.godMode = false;
    }
  }

  update(dt = 1, game = null) {
    super.update(dt);

    const speedStat = this.upgradeSystem.getMultiplier('movementSpeed');
    let moveSpeedMultiplier = 2.4 * speedStat;

    if (this.classInfo.id === 'arena_closer') {
      moveSpeedMultiplier *= 2.5;
    }

    this.vel.x *= Math.pow(0.88, dt);
    this.vel.y *= Math.pow(0.88, dt);

    // Health Regeneration
    const regenStat = this.upgradeSystem.getMultiplier('healthRegen');
    if (this.health < this.maxHealth && !this.dead) {
      this.health = Math.min(this.maxHealth, this.health + 0.05 * regenStat * dt);
    }

    // Reload Timers
    for (let i = 0; i < this.reloadTimers.length; i++) {
      if (this.reloadTimers[i] > 0) {
        this.reloadTimers[i] -= 1 * dt;
      }
    }

    // Orbiting Pet Motion
    this.petAngle += 0.04 * dt;
  }

  shoot(game) {
    if (this.dead) return;

    const reloadStat = this.upgradeSystem.getMultiplier('reloadSpeed');
    const baseReload = (this.classInfo.id === 'arena_closer') ? 3 : 15;
    const reloadTicks = Math.max(2, baseReload / reloadStat);

    const barrels = this.classInfo.barrels || [{ angleOffset: 0, length: 35, width: 18, recoil: 4 }];

    barrels.forEach((b, idx) => {
      if (this.reloadTimers[idx] <= 0) {
        this.reloadTimers[idx] = reloadTicks;

        const finalAngle = this.angle + (b.angleOffset || 0);
        const barrelLen = (b.length || 35) * (this.radius / 26);
        const muzzleX = this.pos.x + Math.cos(finalAngle) * barrelLen;
        const muzzleY = this.pos.y + Math.sin(finalAngle) * barrelLen;

        const spdStat = this.upgradeSystem.getMultiplier('bulletSpeed');
        const bSpeed = 10 * spdStat * (this.classInfo.id === 'arena_closer' ? 2.5 : 1);
        
        const vx = Math.cos(finalAngle) * bSpeed;
        const vy = Math.sin(finalAngle) * bSpeed;

        const dmgStat = this.upgradeSystem.getMultiplier('bulletDamage');
        const penStat = this.upgradeSystem.getMultiplier('bulletPenetration');

        const isAc = (this.classInfo.id === 'arena_closer');
        const bDmg = isAc ? 500 : 20 * dmgStat;
        const bPen = isAc ? 500 : 20 * penStat;
        const bRadius = (b.width ? b.width * 0.45 : 8) * (this.radius / 26);

        const bColor = isAc ? '#ffe869' : (this.color || '#00b2e7');

        const bullet = new Bullet(muzzleX, muzzleY, vx, vy, bRadius, bDmg, bPen, bSpeed, this, bColor);
        game.bullets.push(bullet);

        // Network bullet broadcast
        if (game.networkManager && game.networkManager.connected) {
          game.networkManager.sendShoot(muzzleX, muzzleY, vx, vy, bRadius, bColor);
        }

        // Cannon recoil push
        const recoilMag = (b.recoil || 4) * (this.classInfo.id === 'arena_closer' ? 8 : 1);
        this.vel.x -= Math.cos(finalAngle) * recoilMag;
        this.vel.y -= Math.sin(finalAngle) * recoilMag;

        if (game.soundEngine) {
          game.soundEngine.playShootSound();
        }
      }
    });
  }

  draw(ctx, camera) {
    if (!ctx || !camera) return;

    const screen = camera.worldToScreen(this.pos.x, this.pos.y);
    const renderRadius = this.radius * (camera.zoom || 1.35);

    if (
      screen.x < -200 || screen.x > camera.viewportWidth + 200 ||
      screen.y < -200 || screen.y > camera.viewportHeight + 200
    ) {
      return;
    }

    ctx.save();
    ctx.translate(screen.x, screen.y);

    // 1. Draw Equipped Aura Effect
    if (this.equippedEffect && this.equippedEffect.color) {
      try {
        ctx.save();
        ctx.strokeStyle = this.equippedEffect.color || '#00e676';
        ctx.lineWidth = 4 * camera.zoom;
        ctx.shadowColor = this.equippedEffect.color || '#00e676';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, renderRadius + 8 * camera.zoom, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } catch (e) {}
    }

    // 2. Draw Barrels / Cannons
    ctx.save();
    ctx.rotate(this.angle || 0);
    ctx.fillStyle = '#999999';
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = Math.max(2, renderRadius * 0.15);

    const barrels = this.classInfo.barrels || [{ angleOffset: 0, length: 35, width: 18 }];
    barrels.forEach(b => {
      const bLen = (b.length || 35) * camera.zoom * (this.radius / 26);
      const bW = (b.width || 18) * camera.zoom * (this.radius / 26);
      ctx.fillRect(0, -bW / 2, bLen, bW);
      ctx.strokeRect(0, -bW / 2, bLen, bW);
    });
    ctx.restore();

    // 3. Draw Tank Body (Bulletproof Gradient Skin support!)
    ctx.save();
    if (this.equippedSkin && Array.isArray(this.equippedSkin.colors) && this.equippedSkin.colors.length >= 2) {
      try {
        const grad = ctx.createLinearGradient(-renderRadius, -renderRadius, renderRadius, renderRadius);
        grad.addColorStop(0, this.equippedSkin.colors[0]);
        grad.addColorStop(1, this.equippedSkin.colors[1]);
        ctx.fillStyle = grad;
      } catch (e) {
        ctx.fillStyle = this.color || '#00b2e7';
      }
    } else {
      ctx.fillStyle = (this.hitFlashTimer && this.hitFlashTimer > 0) ? '#ffffff' : (this.color || '#00b2e7');
    }
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = Math.max(2.5, renderRadius * 0.15);

    ctx.beginPath();
    ctx.arc(0, 0, renderRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 4. Draw Orbiting Companion Pet
    if (this.equippedPet) {
      try {
        const petDist = renderRadius + 22 * camera.zoom;
        const px = Math.cos(this.petAngle || 0) * petDist;
        const py = Math.sin(this.petAngle || 0) * petDist;

        ctx.save();
        ctx.fillStyle = this.equippedPet.color || '#ffe869';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 7 * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } catch (e) {}
    }

    ctx.restore();

    // 5. Draw Name Tag & Health Bar
    this.drawNameAndHealth(ctx, camera, screen, renderRadius);
  }

  drawNameAndHealth(ctx, camera, screen, renderRadius) {
    try {
      ctx.save();
      ctx.font = `700 ${Math.max(12, 13 * camera.zoom)}px 'Ubuntu', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(this.name || 'Pilot', screen.x, screen.y - renderRadius - 12 * camera.zoom);
      ctx.fillText(this.name || 'Pilot', screen.x, screen.y - renderRadius - 12 * camera.zoom);

      if (this.health < this.maxHealth) {
        const barW = renderRadius * 2.2;
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
    } catch (e) {}
  }
}
