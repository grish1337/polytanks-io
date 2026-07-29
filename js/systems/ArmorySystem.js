export const SKINS = [
  { id: 'default_cyan', name: 'Default Cyan', rarity: 'Common', color: '#00b2e7', auraColor: null, icon: '🔵' },
  { id: 'ruby_dragon', name: 'Ruby Dragon', rarity: 'Unusual', color: '#f14e54', auraColor: '#f14e54', icon: '🔴' },
  { id: 'emerald_nova', name: 'Emerald Nova', rarity: 'Rare', color: '#00e676', auraColor: '#00e676', icon: '🟢' },
  { id: 'void_purple', name: 'Void Purple', rarity: 'Epic', color: '#bf55ec', auraColor: '#bf55ec', icon: '🟣' },
  { id: 'golden_eclipse', name: 'Golden Eclipse', rarity: 'Legendary', color: '#ffaa00', auraColor: '#ffe869', icon: '👑' }
];

export class ArmorySystem {
  constructor() {
    this.unlockedSkins = new Set(['default_cyan']);
    this.equippedSkinId = 'default_cyan';
    this.chests = {
      common: 1,
      rare: 0,
      legendary: 0
    };
    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem('polytanks_armory');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.unlockedSkins) this.unlockedSkins = new Set(data.unlockedSkins);
        if (data.equippedSkinId) this.equippedSkinId = data.equippedSkinId;
        if (data.chests) this.chests = data.chests;
      }
    } catch (e) {}
  }

  saveState() {
    try {
      const data = {
        unlockedSkins: Array.from(this.unlockedSkins),
        equippedSkinId: this.equippedSkinId,
        chests: this.chests
      };
      localStorage.setItem('polytanks_armory', JSON.stringify(data));
    } catch (e) {}
  }

  addChest(tier = 'common', count = 1) {
    this.chests[tier] = (this.chests[tier] || 0) + count;
    this.saveState();
  }

  openChest(tier = 'common') {
    if ((this.chests[tier] || 0) <= 0) return null;

    this.chests[tier]--;

    // Roll random skin based on chest tier
    const roll = Math.random();
    let wonSkin = SKINS[0];

    if (tier === 'legendary') {
      wonSkin = roll < 0.6 ? SKINS[4] : SKINS[3];
    } else if (tier === 'rare') {
      wonSkin = roll < 0.4 ? SKINS[3] : roll < 0.8 ? SKINS[2] : SKINS[1];
    } else {
      wonSkin = roll < 0.2 ? SKINS[2] : roll < 0.5 ? SKINS[1] : SKINS[0];
    }

    this.unlockedSkins.add(wonSkin.id);
    this.saveState();

    return wonSkin;
  }

  equipSkin(skinId) {
    if (this.unlockedSkins.has(skinId)) {
      this.equippedSkinId = skinId;
      this.saveState();
      return true;
    }
    return false;
  }

  get EquippedSkin() {
    return SKINS.find(s => s.id === this.equippedSkinId) || SKINS[0];
  }
}
