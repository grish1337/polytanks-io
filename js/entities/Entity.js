import { Vector2D } from '../engine/Vector2D.js';

export class Entity {
  constructor(x, y, radius, mass = 1) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D(0, 0);
    this.acc = new Vector2D(0, 0);
    this.radius = radius;
    this.mass = mass;
    this.elasticity = 0.75;
    
    this.angle = 0;
    this.angularVel = 0;
    
    this.maxHealth = 100;
    this.health = 100;
    this.bodyDamage = 10;
    
    this.dead = false;
    this.type = 'entity';
    this.color = '#ffffff';

    // Flash white when taking hit
    this.hitFlashTimer = 0;
  }

  takeDamage(amount, attacker = null) {
    if (this.dead) return;
    this.health -= amount;
    this.hitFlashTimer = 0.08; // 80ms hit flash

    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      this.onDeath(attacker);
    }
  }

  onDeath(attacker) {
    // Override in subclass
  }

  update(dt = 1) {
    // Apply friction / velocity damping
    this.vel.mult(0.96);
    this.pos.add(Vector2D.mult(this.vel, dt));

    // Update spin/rotation
    this.angle += this.angularVel * dt;
    this.angularVel *= 0.95; // Spin damping

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt * 0.016;
    }
  }
}
