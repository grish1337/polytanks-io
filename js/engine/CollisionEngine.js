import { Vector2D } from './Vector2D.js';

export class CollisionEngine {
  constructor(arenaWidth, arenaHeight) {
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;
  }

  resolveBoundaryCollision(entity) {
    const r = entity.radius;
    const bounce = 0.1;

    if (entity.pos.x - r < 0) {
      entity.pos.x = r;
      entity.vel.x = -entity.vel.x * bounce;
    } else if (entity.pos.x + r > this.arenaWidth) {
      entity.pos.x = this.arenaWidth - r;
      entity.vel.x = -entity.vel.x * bounce;
    }

    if (entity.pos.y - r < 0) {
      entity.pos.y = r;
      entity.vel.y = -entity.vel.y * bounce;
    } else if (entity.pos.y + r > this.arenaHeight) {
      entity.pos.y = this.arenaHeight - r;
      entity.vel.y = -entity.vel.y * bounce;
    }
  }

  // Hard Solid Diep Collision (Tanks and shapes CANNOT pass through each other!)
  resolveElasticCollision(e1, e2, dt = 1) {
    if (e1.dead || e2.dead) return;

    const dx = e2.pos.x - e1.pos.x;
    const dy = e2.pos.y - e1.pos.y;
    const distSq = dx * dx + dy * dy;
    const minDist = e1.radius + e2.radius;

    if (distSq >= minDist * minDist || distSq === 0) return;

    const dist = Math.sqrt(distSq);
    const nx = dx / dist;
    const ny = dy / dist;

    // 1. 100% Hard Solid Separation (Prevents clipping through shapes or tanks)
    const overlap = minDist - dist;
    const totalMass = e1.mass + e2.mass;

    const m1Ratio = e2.mass / totalMass;
    const m2Ratio = e1.mass / totalMass;

    const sepFactor = 1.0; // 100% Hard Solid Boundary Separation
    e1.pos.x -= nx * overlap * m1Ratio * sepFactor;
    e1.pos.y -= ny * overlap * m1Ratio * sepFactor;
    e2.pos.x += nx * overlap * m2Ratio * sepFactor;
    e2.pos.y += ny * overlap * m2Ratio * sepFactor;

    // 2. Gentle momentum exchange
    const rvx = e2.vel.x - e1.vel.x;
    const rvy = e2.vel.y - e1.vel.y;
    const velAlongNormal = rvx * nx + rvy * ny;

    const restitution = 0.1;

    if (velAlongNormal < 0) {
      const impulseMag = -(1 + restitution) * velAlongNormal / (1 / e1.mass + 1 / e2.mass);

      const impulseX = impulseMag * nx * 0.4;
      const impulseY = impulseMag * ny * 0.4;

      e1.vel.x -= impulseX / e1.mass;
      e1.vel.y -= impulseY / e1.mass;
      e2.vel.x += impulseX / e2.mass;
      e2.vel.y += impulseY / e2.mass;
    }

    this.applyContactDamage(e1, e2, dt);
  }

  applyContactDamage(e1, e2, dt = 1) {
    const dmg1 = (e1.bodyDamage || 5) * dt * 0.25;
    const dmg2 = (e2.bodyDamage || 5) * dt * 0.25;

    e1.takeDamage(dmg2, e2);
    e2.takeDamage(dmg1, e1);
  }

  resolveBulletImpact(bullet, target, game) {
    if (bullet.dead || target.dead || bullet.owner === target) return;

    const dx = target.pos.x - bullet.pos.x;
    const dy = target.pos.y - bullet.pos.y;
    const distSq = dx * dx + dy * dy;
    const minDist = bullet.radius + target.radius;

    if (distSq < minDist * minDist) {
      const dist = Math.sqrt(distSq) || 1;
      const nx = dx / dist;
      const ny = dy / dist;

      const knockbackForce = bullet.speed * bullet.penetration * 0.04;
      target.vel.x += nx * (knockbackForce / target.mass);
      target.vel.y += ny * (knockbackForce / target.mass);

      const damageToTarget = bullet.damage;
      const damageToBullet = target.bodyDamage || 10;

      target.takeDamage(damageToTarget, bullet.owner);
      bullet.health -= damageToBullet;

      if (game && game.particleManager) {
        game.particleManager.spawnSparks(bullet.pos.x, bullet.pos.y, nx, ny, bullet.color, 4);
      }

      if (game && game.soundEngine) {
        game.soundEngine.playHitSound(target.type === 'shape');
      }

      if (bullet.health <= 0) {
        bullet.dead = true;
      }
    }
  }
}
