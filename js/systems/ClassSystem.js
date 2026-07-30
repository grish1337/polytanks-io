export const TANK_CLASSES = {
  basic: {
    id: 'basic',
    name: 'Basic Tank',
    tier: 1,
    requiredLevel: 1,
    nextTierRequiredLevel: 15,
    barrels: [
      { height: 42, width: 24, offsetY: 0, angleOffset: 0, recoil: 2.5, reloadMult: 1.0, damageMult: 1.0, speedMult: 1.0, sizeMult: 1.0 }
    ],
    evolvesTo: ['twin', 'sniper', 'machine_gun', 'flank_guard'],
    abilityName: 'Hyper Dash',
    cooldown: 6.0
  },

  // Dev-Only Special Tank: Arena Closer
  arena_closer: {
    id: 'arena_closer',
    name: 'Arena Closer',
    tier: 4,
    requiredLevel: 1,
    nextTierRequiredLevel: 999,
    isDevOnly: true,
    color: '#ffe869',
    barrels: [
      { height: 28, width: 36, offsetY: 0, angleOffset: 0, recoil: 4.0, reloadMult: 2.2, damageMult: 50.0, speedMult: 1.8, sizeMult: 2.8 }
    ],
    bodyRadiusMult: 3.0,
    moveSpeedMult: 2.0,
    abilityName: 'Extinction Blast',
    cooldown: 3.0
  },

  // Tier 2 (Level 15)
  twin: {
    id: 'twin',
    name: 'Twin',
    tier: 2,
    requiredLevel: 15,
    nextTierRequiredLevel: 30,
    barrels: [
      { height: 42, width: 22, offsetY: -12, angleOffset: 0, recoil: 2.0, reloadMult: 1.15, damageMult: 0.85, speedMult: 1.0, sizeMult: 0.95 },
      { height: 42, width: 22, offsetY: 12, angleOffset: 0, recoil: 2.0, reloadMult: 1.15, damageMult: 0.85, speedMult: 1.0, sizeMult: 0.95 }
    ],
    evolvesTo: ['triple_shot', 'quad_tank'],
    abilityName: 'Double Rush',
    cooldown: 6.0
  },

  sniper: {
    id: 'sniper',
    name: 'Sniper',
    tier: 2,
    requiredLevel: 15,
    nextTierRequiredLevel: 30,
    barrels: [
      { height: 56, width: 22, offsetY: 0, angleOffset: 0, recoil: 4.0, reloadMult: 0.50, damageMult: 1.4, speedMult: 1.5, sizeMult: 1.1 }
    ],
    evolvesTo: ['assassin', 'hunter'],
    abilityName: 'Eagle Vision',
    cooldown: 8.0
  },

  machine_gun: {
    id: 'machine_gun',
    name: 'Machine Gun',
    tier: 2,
    requiredLevel: 15,
    nextTierRequiredLevel: 30,
    barrels: [
      { height: 40, width: 30, offsetY: 0, angleOffset: 0, recoil: 1.8, reloadMult: 2.2, damageMult: 0.65, speedMult: 1.1, spread: 0.35, sizeMult: 0.85 }
    ],
    evolvesTo: ['destroyer'],
    abilityName: 'Bullet Storm',
    cooldown: 7.0
  },

  flank_guard: {
    id: 'flank_guard',
    name: 'Flank Guard',
    tier: 2,
    requiredLevel: 15,
    nextTierRequiredLevel: 30,
    barrels: [
      { height: 42, width: 24, offsetY: 0, angleOffset: 0, recoil: 2.5, reloadMult: 1.0, damageMult: 1.0, speedMult: 1.0, sizeMult: 1.0 },
      { height: 32, width: 24, offsetY: 0, angleOffset: Math.PI, recoil: 2.0, reloadMult: 1.0, damageMult: 0.85, speedMult: 1.0, sizeMult: 0.9 }
    ],
    evolvesTo: ['tri_angle'],
    abilityName: 'Hyper Dash',
    cooldown: 6.0
  },

  // Tier 3 (Level 30)
  triple_shot: {
    id: 'triple_shot',
    name: 'Triple Shot',
    tier: 3,
    requiredLevel: 30,
    nextTierRequiredLevel: 45,
    barrels: [
      { height: 42, width: 22, offsetY: 0, angleOffset: 0, recoil: 2.0, reloadMult: 1.1, damageMult: 0.85, speedMult: 1.0 },
      { height: 38, width: 20, offsetY: 0, angleOffset: -0.4, recoil: 1.8, reloadMult: 1.1, damageMult: 0.8, speedMult: 1.0 },
      { height: 38, width: 20, offsetY: 0, angleOffset: 0.4, recoil: 1.8, reloadMult: 1.1, damageMult: 0.8, speedMult: 1.0 }
    ],
    evolvesTo: ['penta_shot'],
    abilityName: 'Triple Surge',
    cooldown: 6.0
  },

  quad_tank: {
    id: 'quad_tank',
    name: 'Quad Tank',
    tier: 3,
    requiredLevel: 30,
    nextTierRequiredLevel: 45,
    barrels: [
      { height: 42, width: 22, offsetY: 0, angleOffset: 0, recoil: 2.0, reloadMult: 1.0, damageMult: 0.85 },
      { height: 42, width: 22, offsetY: 0, angleOffset: Math.PI / 2, recoil: 2.0, reloadMult: 1.0, damageMult: 0.85 },
      { height: 42, width: 22, offsetY: 0, angleOffset: Math.PI, recoil: 2.0, reloadMult: 1.0, damageMult: 0.85 },
      { height: 42, width: 22, offsetY: 0, angleOffset: -Math.PI / 2, recoil: 2.0, reloadMult: 1.0, damageMult: 0.85 }
    ],
    evolvesTo: ['octo_tank'],
    abilityName: 'Omni Shield',
    cooldown: 7.0
  },

  assassin: {
    id: 'assassin',
    name: 'Assassin',
    tier: 3,
    requiredLevel: 30,
    nextTierRequiredLevel: 45,
    barrels: [
      { height: 68, width: 22, offsetY: 0, angleOffset: 0, recoil: 5.0, reloadMult: 0.35, damageMult: 1.8, speedMult: 1.8, sizeMult: 1.2 }
    ],
    evolvesTo: ['ranger'],
    abilityName: 'Headshot',
    cooldown: 8.0
  },

  destroyer: {
    id: 'destroyer',
    name: 'Destroyer',
    tier: 3,
    requiredLevel: 30,
    nextTierRequiredLevel: 45,
    barrels: [
      { height: 44, width: 44, offsetY: 0, angleOffset: 0, recoil: 12.0, reloadMult: 0.20, damageMult: 3.8, speedMult: 0.8, sizeMult: 2.2 }
    ],
    evolvesTo: ['annihilator'],
    abilityName: 'Blast Pulse',
    cooldown: 8.0
  },

  tri_angle: {
    id: 'tri_angle',
    name: 'Tri-Angle',
    tier: 3,
    requiredLevel: 30,
    nextTierRequiredLevel: 45,
    barrels: [
      { height: 42, width: 24, offsetY: 0, angleOffset: 0, recoil: 2.5, reloadMult: 1.0, damageMult: 1.0, speedMult: 1.0 },
      { height: 34, width: 20, offsetY: 0, angleOffset: 2.5, recoil: 4.5, reloadMult: 1.2, damageMult: 0.6, speedMult: 1.1 },
      { height: 34, width: 20, offsetY: 0, angleOffset: -2.5, recoil: 4.5, reloadMult: 1.2, damageMult: 0.6, speedMult: 1.1 }
    ],
    evolvesTo: ['booster'],
    abilityName: 'Hyper Jump',
    cooldown: 5.0
  },

  // Tier 4 (Level 45)
  penta_shot: {
    id: 'penta_shot',
    name: 'Penta Shot',
    tier: 4,
    requiredLevel: 45,
    nextTierRequiredLevel: 999,
    barrels: [
      { height: 44, width: 22, offsetY: 0, angleOffset: 0, recoil: 2.2, reloadMult: 1.2, damageMult: 0.9, speedMult: 1.1 },
      { height: 40, width: 20, offsetY: 0, angleOffset: -0.3, recoil: 2.0, reloadMult: 1.2, damageMult: 0.85, speedMult: 1.05 },
      { height: 40, width: 20, offsetY: 0, angleOffset: 0.3, recoil: 2.0, reloadMult: 1.2, damageMult: 0.85, speedMult: 1.05 },
      { height: 34, width: 18, offsetY: 0, angleOffset: -0.6, recoil: 1.8, reloadMult: 1.2, damageMult: 0.8, speedMult: 1.0 },
      { height: 34, width: 18, offsetY: 0, angleOffset: 0.6, recoil: 1.8, reloadMult: 1.2, damageMult: 0.8, speedMult: 1.0 }
    ],
    abilityName: 'Quantum Shockwave',
    cooldown: 8.0
  },

  octo_tank: {
    id: 'octo_tank',
    name: 'Octo Tank',
    tier: 4,
    requiredLevel: 45,
    nextTierRequiredLevel: 999,
    barrels: [
      { height: 42, width: 22, offsetY: 0, angleOffset: 0, recoil: 1.5, reloadMult: 1.1, damageMult: 0.85 },
      { height: 42, width: 22, offsetY: 0, angleOffset: Math.PI / 4, recoil: 1.5, reloadMult: 1.1, damageMult: 0.85 },
      { height: 42, width: 22, offsetY: 0, angleOffset: Math.PI / 2, recoil: 1.5, reloadMult: 1.1, damageMult: 0.85 },
      { height: 42, width: 22, offsetY: 0, angleOffset: (3 * Math.PI) / 4, recoil: 1.5, reloadMult: 1.1, damageMult: 0.85 },
      { height: 42, width: 22, offsetY: 0, angleOffset: Math.PI, recoil: 1.5, reloadMult: 1.1, damageMult: 0.85 },
      { height: 42, width: 22, offsetY: 0, angleOffset: (-3 * Math.PI) / 4, recoil: 1.5, reloadMult: 1.1, damageMult: 0.85 },
      { height: 42, width: 22, offsetY: 0, angleOffset: -Math.PI / 2, recoil: 1.5, reloadMult: 1.1, damageMult: 0.85 },
      { height: 42, width: 22, offsetY: 0, angleOffset: -Math.PI / 4, recoil: 1.5, reloadMult: 1.1, damageMult: 0.85 }
    ],
    abilityName: 'Shield Matrix',
    cooldown: 8.0
  },

  ranger: {
    id: 'ranger',
    name: 'Ranger',
    tier: 4,
    requiredLevel: 45,
    nextTierRequiredLevel: 999,
    barrels: [
      { height: 76, width: 24, offsetY: 0, angleOffset: 0, recoil: 6.0, reloadMult: 0.30, damageMult: 2.2, speedMult: 2.2, sizeMult: 1.3 }
    ],
    abilityName: 'Eagle Vision',
    cooldown: 8.0
  },

  annihilator: {
    id: 'annihilator',
    name: 'Annihilator',
    tier: 4,
    requiredLevel: 45,
    nextTierRequiredLevel: 999,
    barrels: [
      { height: 48, width: 56, offsetY: 0, angleOffset: 0, recoil: 18.0, reloadMult: 0.15, damageMult: 5.0, speedMult: 0.85, sizeMult: 2.8 }
    ],
    abilityName: 'Blast Pulse',
    cooldown: 9.0
  },

  booster: {
    id: 'booster',
    name: 'Booster',
    tier: 4,
    requiredLevel: 45,
    nextTierRequiredLevel: 999,
    barrels: [
      { height: 42, width: 24, offsetY: 0, angleOffset: 0, recoil: 2.5, reloadMult: 1.0, damageMult: 1.0, speedMult: 1.0 },
      { height: 34, width: 18, offsetY: 0, angleOffset: 2.35, recoil: 5.5, reloadMult: 1.3, damageMult: 0.5, speedMult: 1.1 },
      { height: 34, width: 18, offsetY: 0, angleOffset: -2.35, recoil: 5.5, reloadMult: 1.3, damageMult: 0.5, speedMult: 1.1 },
      { height: 30, width: 16, offsetY: 0, angleOffset: 2.65, recoil: 4.5, reloadMult: 1.3, damageMult: 0.4, speedMult: 1.1 },
      { height: 30, width: 16, offsetY: 0, angleOffset: -2.65, recoil: 4.5, reloadMult: 1.3, damageMult: 0.4, speedMult: 1.1 }
    ],
    abilityName: 'Overdrive Dash',
    cooldown: 5.0
  }
};
