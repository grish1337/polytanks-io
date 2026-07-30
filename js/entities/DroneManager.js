import { Entity } from './Entity.js';
import { Vector2D } from '../engine/Vector2D.js';

export class Drone extends Entity {
  constructor(x, y, owner, type = 'triangle') {
    super(x, y, type === 'square' ? 14 : 10, 5);
    this.owner = owner;
    this.droneType = type; // 'triangle' or 'square'
    this.targetPos = null;
    this.speed = type === 'square' ? 6.0 : 8.5;
    this.health = 50;
    this.maxHealth = 50;
    this.damage = 22;
    this.angle = Math.random() * Math.PI * 2;
    this.color = owner ? (owner.color || '#00b2e7') : '#00b2e7';
  }

  update(dt = 1, targetPos = null, orbitAngle = 0, orbitRadius = 80) {
    super.update(dt);

    if (targetPos) {
      // Seek mouse cursor target
      const dx = targetPos.x - this.pos.x;
      const dy = targetPos.y - this.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      this.vel.x += (dx / dist) * this.speed * 0.5;
      this.vel.y += (dy / dist) * this.speed * 0.5;
      this.angle = Math.atan2(this.vel.y, this.vel.x);
    } else if (this.owner) {
      // Orbit owner tank
      const desX = this.owner.pos.x + Math.cos(orbitAngle) * orbitRadius;
      const desY = this.owner.pos.y + Math.sin(orbitAngle) * orbitRadius;
      const dx = desX - this.pos.x;
      const dy = desY - this.pos.y;
      this.vel.x += dx * 0.18;
      this.vel.y += dy * 0.18;
      this.angle = Math.atan2(this.vel.y, this.vel.x) || orbitAngle;
    }

    this.vel.mult(0.88);
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

    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = Math.max(2, renderRadius * 0.18);

    ctx.beginPath();
    if (this.droneType === 'square') {
      ctx.rect(-renderRadius, -renderRadius, renderRadius * 2, renderRadius * 2);
    } else {
      // Sharp Triangular Drone pointing forward!
      ctx.moveTo(renderRadius * 1.5, 0);
      ctx.lineTo(-renderRadius * 0.9, -renderRadius * 0.9);
      ctx.lineTo(-renderRadius * 0.4, 0);
      ctx.lineTo(-renderRadius * 0.9, renderRadius * 0.9);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

export class DroneManager {
  constructor(tank) {
    this.tank = tank;
    this.drones = [];
    this.respawnTimer = 0;
  }

  update(dt = 1, game = null, isTargeting = false, targetPos = null) {
    if (!this.tank || this.tank.dead) return;

    const classId = this.tank.classInfo.id;
    let maxDrones = 0;
    let droneType = 'triangle';
    let respawnInterval = 50; // frames

    if (classId === 'overseer') {
      maxDrones = 8; // Doubled!
      respawnInterval = 50;
    } else if (classId === 'overlord') {
      maxDrones = 8;
      respawnInterval = 20; // Respawns TWICE as fast!
    } else if (classId === 'necromancer') {
      maxDrones = 24; // Doubled!
      droneType = 'square';
      respawnInterval = 9999; // Converts destroyed squares!
    }

    // Auto-Respawn Drones for Overseer / Overlord
    if (maxDrones > 0 && classId !== 'necromancer') {
      if (this.drones.length < maxDrones) {
        this.respawnTimer += 1 * dt;
        if (this.respawnTimer >= respawnInterval) {
          this.respawnTimer = 0;
          const spawnAngle = Math.random() * Math.PI * 2;
          const spawnX = this.tank.pos.x + Math.cos(spawnAngle) * 40;
          const spawnY = this.tank.pos.y + Math.sin(spawnAngle) * 40;
          this.drones.push(new Drone(spawnX, spawnY, this.tank, droneType));
        }
      }
    }

    // Update Drones
    const totalDrones = this.drones.length;
    for (let i = totalDrones - 1; i >= 0; i--) {
      const d = this.drones[i];
      if (d.dead || d.health <= 0) {
        this.drones.splice(i, 1);
        continue;
      }

      const orbitAngle = this.tank.petAngle + (i * Math.PI * 2) / Math.max(1, totalDrones);
      d.update(dt, isTargeting ? targetPos : null, orbitAngle, 85);

      // 1. Drone vs Shapes Collisions (Robust coordinate extraction!)
      if (game && game.shapes) {
        for (let sIdx = 0; sIdx < game.shapes.length; sIdx++) {
          const s = game.shapes[sIdx];
          if (!s || s.health <= 0) continue;

          const sx = s.pos ? s.pos.x : s.x;
          const sy = s.pos ? s.pos.y : s.y;
          const dx = sx - d.pos.x;
          const dy = sy - d.pos.y;

          if (dx * dx + dy * dy < (s.radius + d.radius) ** 2) {
            s.health -= d.damage;
            d.health -= 12;

            if (s.health <= 0) {
              s.health = s.maxHealth;
              if (s.pos) {
                s.pos.x = 100 + Math.random() * (game.arenaWidth - 200);
                s.pos.y = 100 + Math.random() * (game.arenaHeight - 200);
              } else {
                s.x = 100 + Math.random() * (game.arenaWidth - 200);
                s.y = 100 + Math.random() * (game.arenaHeight - 200);
              }
              this.tank.addXP(s.xpValue || 25);

              // Necromancer converts destroyed squares into minion drones!
              if (classId === 'necromancer' && s.shapeType === 'square' && this.drones.length < 24) {
                this.drones.push(new Drone(sx, sy, this.tank, 'square'));
              }
            }
            break;
          }
        }
      }

      // 2. Drone vs Enemy Tanks PVP Collisions
      if (game && game.tanks) {
        for (let tIdx = 0; tIdx < game.tanks.length; tIdx++) {
          const targetTank = game.tanks[tIdx];
          if (!targetTank || targetTank === this.tank || targetTank.dead || targetTank.godMode) continue;

          const tx = targetTank.pos ? targetTank.pos.x : targetTank.x;
          const ty = targetTank.pos ? targetTank.pos.y : targetTank.y;
          const dx = tx - d.pos.x;
          const dy = ty - d.pos.y;

          if (dx * dx + dy * dy < (targetTank.radius + d.radius) ** 2) {
            targetTank.health -= d.damage;
            d.health -= 25;

            if (targetTank.health <= 0) {
              targetTank.dead = true;
              this.tank.addXP(Math.floor(targetTank.score * 0.5) + 500);
              if (game.hudManager) {
                game.hudManager.addKillFeedMessage(`${this.tank.name} destroyed ${targetTank.name} with Drones!`);
              }
            }
            break;
          }
        }
      }
    }
  }

  draw(ctx, camera) {
    this.drones.forEach(d => d.draw(ctx, camera));
  }
}
