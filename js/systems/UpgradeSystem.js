export const STAT_TYPES = [
  { id: 'healthRegen', name: 'Health Regen', key: '1', color: '#f14e54', max: 7 },
  { id: 'maxHealth', name: 'Max Health', key: '2', color: '#ffaa00', max: 7 },
  { id: 'bodyDamage', name: 'Body Damage', key: '3', color: '#bf55ec', max: 7 },
  { id: 'bulletSpeed', name: 'Bullet Speed', key: '4', color: '#00b2e7', max: 7 },
  { id: 'bulletPenetration', name: 'Bullet Penetration', key: '5', color: '#ffe869', max: 7 },
  { id: 'bulletDamage', name: 'Bullet Damage', key: '6', color: '#f14e54', max: 7 },
  { id: 'reloadSpeed', name: 'Reload Speed', key: '7', color: '#00e676', max: 7 },
  { id: 'movementSpeed', name: 'Movement Speed', key: '8', color: '#00e6e6', max: 7 }
];

export class UpgradeSystem {
  constructor(tank) {
    this.tank = tank;
    this.stats = {
      healthRegen: 0,
      maxHealth: 0,
      bodyDamage: 0,
      bulletSpeed: 0,
      bulletPenetration: 0,
      bulletDamage: 0,
      reloadSpeed: 0,
      movementSpeed: 0
    };
    this.availablePoints = 1;
  }

  addPoint(statId) {
    if (this.availablePoints > 0 && this.stats[statId] !== undefined) {
      const info = STAT_TYPES.find(s => s.id === statId);
      if (info && this.stats[statId] < info.max) {
        this.stats[statId]++;
        this.availablePoints--;
        this.applyStatsToTank();
        return true;
      }
    }
    return false;
  }

  applyStatsToTank() {
    const baseHp = 100;
    this.tank.maxHealth = baseHp + this.stats.maxHealth * 20;
    if (this.tank.health > this.tank.maxHealth) {
      this.tank.health = this.tank.maxHealth;
    }

    this.tank.healthRegenRate = 0.4 + this.stats.healthRegen * 1.0;
    this.tank.bodyDamage = 10 + this.stats.bodyDamage * 6;
    this.tank.bulletSpeedMultiplier = 1 + this.stats.bulletSpeed * 0.15;
    this.tank.bulletPenetrationMultiplier = 1 + this.stats.bulletPenetration * 0.25;
    this.tank.bulletDamageMultiplier = 1 + this.stats.bulletDamage * 0.22;
    this.tank.reloadSpeedMultiplier = 1 + this.stats.reloadSpeed * 0.20;
    this.tank.moveSpeedMultiplier = 1 + this.stats.movementSpeed * 0.10;
  }
}
