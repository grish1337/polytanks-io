import { Vector2D } from '../engine/Vector2D.js';
import { TANK_CLASSES } from './ClassSystem.js';

export class BotAI {
  constructor(tank) {
    this.tank = tank;
    this.state = 'HARVEST';
    this.target = null;
    this.targetAngle = 0;
    this.updateTimer = Math.random() * 0.5;
  }

  update(dt = 1, game) {
    if (this.tank.dead || !game) return;

    this.updateTimer -= 0.016 * dt;
    if (this.updateTimer <= 0) {
      this.updateTimer = 0.35; // Human-like reaction tick rate
      this.evaluateState(game);
      this.autoUpgradeStats();
      this.autoEvolveClass();
    }

    this.executeBehavior(dt, game);
  }

  evaluateState(game) {
    // 1. Flees if health drops below 25%
    if (this.tank.health / this.tank.maxHealth < 0.25) {
      this.state = 'FLEE';
      return;
    }

    // 2. Look for enemy tanks within 450px range
    let closestTank = null;
    let closestTankDist = 450;

    for (let i = 0; i < game.tanks.length; i++) {
      const other = game.tanks[i];
      if (other !== this.tank && !other.dead) {
        const dist = this.tank.pos.dist(other.pos);
        if (dist < closestTankDist) {
          closestTankDist = dist;
          closestTank = other;
        }
      }
    }

    if (closestTank) {
      this.state = 'HUNT';
      this.target = closestTank;
      return;
    }

    // 3. Look for shapes to harvest within 800px
    let closestShape = null;
    let closestShapeDist = 800;

    for (let i = 0; i < game.shapes.length; i++) {
      const s = game.shapes[i];
      if (!s.dead) {
        const dist = this.tank.pos.dist(s.pos);
        if (dist < closestShapeDist) {
          closestShapeDist = dist;
          closestShape = s;
        }
      }
    }

    if (closestShape) {
      this.state = 'HARVEST';
      this.target = closestShape;
    } else {
      this.state = 'WANDER';
      this.target = null;
    }
  }

  executeBehavior(dt, game) {
    let moveDir = new Vector2D(0, 0);

    if (this.state === 'FLEE' && this.target) {
      moveDir = Vector2D.sub(this.tank.pos, this.target.pos).normalize();
      this.targetAngle = Math.atan2(moveDir.y, moveDir.x);
      this.tank.isFiring = true;
    } else if ((this.state === 'HUNT' || this.state === 'HARVEST') && this.target && !this.target.dead) {
      const dist = this.tank.pos.dist(this.target.pos);
      this.targetAngle = Math.atan2(this.target.pos.y - this.tank.pos.y, this.target.pos.x - this.tank.pos.x);
      this.tank.isFiring = true;

      if (dist > 180) {
        moveDir = Vector2D.sub(this.target.pos, this.tank.pos).normalize();
      } else if (dist < 90 && this.state === 'HARVEST') {
        moveDir = Vector2D.sub(this.tank.pos, this.target.pos).normalize().mult(0.5);
      }
    } else {
      this.targetAngle += (Math.random() - 0.5) * 0.05;
      moveDir = Vector2D.fromAngle(this.targetAngle, 0.4);
      this.tank.isFiring = false;
    }

    // Smooth human-like aiming angle rotation (lerp)
    let diff = this.targetAngle - this.tank.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.tank.angle += diff * 0.1 * dt;

    // Apply humanized movement speed
    const speed = 2.2 * this.tank.moveSpeedMultiplier;
    this.tank.vel.x += moveDir.x * speed * 0.08 * dt;
    this.tank.vel.y += moveDir.y * speed * 0.08 * dt;

    if (this.state === 'HUNT' && this.tank.abilityCooldown === 0 && Math.random() < 0.02) {
      this.tank.activateAbility(game);
    }
  }

  autoUpgradeStats() {
    while (this.tank.upgradeSystem.availablePoints > 0) {
      const preferredStats = ['bulletDamage', 'reloadSpeed', 'bulletPenetration', 'bulletSpeed', 'maxHealth', 'movementSpeed', 'bodyDamage', 'healthRegen'];
      const choice = preferredStats[Math.floor(Math.random() * preferredStats.length)];
      if (!this.tank.upgradeSystem.addPoint(choice)) {
        break;
      }
    }
  }

  autoEvolveClass() {
    const nextEvos = this.tank.classInfo.evolvesTo;
    if (nextEvos && nextEvos.length > 0) {
      const candidateKey = nextEvos[Math.floor(Math.random() * nextEvos.length)];
      const candidate = TANK_CLASSES[candidateKey];
      if (candidate && this.tank.level >= candidate.requiredLevel) {
        this.tank.changeClass(candidateKey);
      }
    }
  }
}
