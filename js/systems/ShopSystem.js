export const SHOP_ITEMS = [
  // 🎨 Cosmetic Gradients & Skins
  {
    id: 'grad_neon',
    name: 'Neon Cyber',
    category: 'skin',
    type: 'gradient',
    colors: ['#00b2e7', '#8a2be2'],
    price: 50,
    icon: '🔮',
    description: 'Electric cyan to violet neon gradient skin.'
  },
  {
    id: 'effect_plasma',
    name: 'Plasma Ring',
    category: 'effect',
    type: 'aura',
    color: '#00e676',
    price: 80,
    icon: '♠️',
    description: 'Glowing emerald plasma energy aura surrounding your tank.'
  },
  {
    id: 'grad_solar',
    name: 'Solar Flare',
    category: 'skin',
    type: 'gradient',
    colors: ['#ffe869', '#f14e54'],
    price: 300,
    icon: '📐',
    description: 'Blazing golden sun to crimson flame gradient skin.'
  },
  {
    id: 'effect_starfire',
    name: 'Starfire Halo',
    category: 'effect',
    type: 'halo',
    color: '#bf55ec',
    price: 600,
    discount: '-20%',
    icon: '🪃',
    description: 'Pulsing purple starfire halo floating over your tank.'
  },
  {
    id: 'pet_droid',
    name: 'Orbit Droid',
    category: 'pet',
    type: 'pet_drone',
    color: '#00b2e7',
    price: 800,
    discount: '-20%',
    icon: '📡',
    description: 'Cute mini cyber droid that orbits your tank in battle.'
  },

  // Premium / Mythic Row (Fair balanced prices!)
  {
    id: 'grad_void',
    name: 'Void Eclipse',
    category: 'skin',
    type: 'gradient',
    colors: ['#bf55ec', '#111122'],
    price: 1500,
    icon: '🍃',
    description: 'Deep abyss purple to cosmic dark gradient.'
  },
  {
    id: 'effect_dust',
    name: 'Cosmic Dust',
    category: 'effect',
    type: 'trail',
    color: '#ffe869',
    price: 2500,
    icon: '🌸',
    description: 'Leaves a sparkling trail of floating stardust as you move.'
  },
  {
    id: 'pet_star',
    name: 'Star Buddy',
    category: 'pet',
    type: 'pet_star',
    color: '#ffe869',
    price: 3500,
    icon: '🥦',
    description: 'Glowing yellow star pet companion.'
  },
  {
    id: 'grad_aurora',
    name: 'Aurora Borealis',
    category: 'skin',
    type: 'gradient',
    colors: ['#00e676', '#00b2e7'],
    price: 10000,
    icon: '🍊',
    description: 'Majestic northern lights glowing gradient.'
  },
  {
    id: 'pet_stinger',
    name: 'Stinger Guardian',
    category: 'pet',
    type: 'pet_stinger',
    color: '#111111',
    price: 25000,
    icon: '✴️',
    description: 'Stealth black stinger drone guardian pet.'
  }
];

export const CHALLENGES = [
  {
    id: 'chal_shapes_15',
    title: 'Shape Destroyer',
    desc: 'Destroy 15 Shapes in the arena',
    reward: 250,
    target: 15,
    key: 'shapeKills'
  },
  {
    id: 'chal_pvp_2',
    title: 'PVP Gladiator',
    desc: 'Defeat 2 Enemy Tanks in battle',
    reward: 500,
    target: 2,
    key: 'playerKills'
  },
  {
    id: 'chal_lvl_30',
    title: 'Level Master',
    desc: 'Reach Level 30 with your tank',
    reward: 1000,
    target: 30,
    key: 'maxLevel'
  },
  {
    id: 'chal_ac_unlock',
    title: 'Arena Overlord',
    desc: 'Cycle into the Arena Closer 🟡',
    reward: 2500,
    target: 1,
    key: 'acUnlocked'
  }
];

export class ShopSystem {
  constructor() {
    this.stars = 2141; // Initial stars balance as shown in reference screenshot!
    this.unlockedItems = new Set(['grad_neon', 'effect_plasma']); // Free starter items
    this.equippedSkinId = 'grad_neon';
    this.equippedEffectId = 'effect_plasma';
    this.equippedPetId = null;

    // Challenge Progress
    this.progress = {
      shapeKills: 0,
      playerKills: 0,
      maxLevel: 1,
      acUnlocked: 0
    };
    this.claimedChallenges = new Set();

    this.loadState();
  }

  loadState() {
    try {
      const savedStars = localStorage.getItem('polytanks_stars');
      if (savedStars !== null) this.stars = parseInt(savedStars);

      const savedUnlocked = localStorage.getItem('polytanks_unlocked_items');
      if (savedUnlocked) {
        const arr = JSON.parse(savedUnlocked);
        arr.forEach(id => this.unlockedItems.add(id));
      }

      const savedSkin = localStorage.getItem('polytanks_equipped_skin');
      if (savedSkin) this.equippedSkinId = savedSkin;

      const savedEffect = localStorage.getItem('polytanks_equipped_effect');
      if (savedEffect) this.equippedEffectId = savedEffect;

      const savedPet = localStorage.getItem('polytanks_equipped_pet');
      if (savedPet) this.equippedPetId = savedPet;

      const savedProgress = localStorage.getItem('polytanks_progress');
      if (savedProgress) this.progress = JSON.parse(savedProgress);

      const savedClaimed = localStorage.getItem('polytanks_claimed_challenges');
      if (savedClaimed) {
        const arr = JSON.parse(savedClaimed);
        arr.forEach(id => this.claimedChallenges.add(id));
      }
    } catch (e) {}
  }

  saveState() {
    try {
      localStorage.setItem('polytanks_stars', this.stars.toString());
      localStorage.setItem('polytanks_unlocked_items', JSON.stringify(Array.from(this.unlockedItems)));
      localStorage.setItem('polytanks_equipped_skin', this.equippedSkinId || '');
      localStorage.setItem('polytanks_equipped_effect', this.equippedEffectId || '');
      localStorage.setItem('polytanks_equipped_pet', this.equippedPetId || '');
      localStorage.setItem('polytanks_progress', JSON.stringify(this.progress));
      localStorage.setItem('polytanks_claimed_challenges', JSON.stringify(Array.from(this.claimedChallenges)));
    } catch (e) {}
  }

  buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;
    if (this.unlockedItems.has(itemId)) return true;

    if (this.stars >= item.price) {
      this.stars -= item.price;
      this.unlockedItems.add(itemId);
      this.equipItem(itemId);
      this.saveState();
      return true;
    }
    return false;
  }

  equipItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item || !this.unlockedItems.has(itemId)) return false;

    if (item.category === 'skin') {
      this.equippedSkinId = itemId;
    } else if (item.category === 'effect') {
      this.equippedEffectId = itemId;
    } else if (item.category === 'pet') {
      this.equippedPetId = this.equippedPetId === itemId ? null : itemId; // Toggle pet
    }
    this.saveState();
    return true;
  }

  claimChallenge(challengeId) {
    const chal = CHALLENGES.find(c => c.id === challengeId);
    if (!chal || this.claimedChallenges.has(challengeId)) return false;

    const currentVal = this.progress[chal.key] || 0;
    if (currentVal >= chal.target) {
      this.stars += chal.reward;
      this.claimedChallenges.add(challengeId);
      this.saveState();
      return true;
    }
    return false;
  }

  get EquippedSkin() {
    return SHOP_ITEMS.find(i => i.id === this.equippedSkinId) || SHOP_ITEMS[0];
  }

  get EquippedEffect() {
    return SHOP_ITEMS.find(i => i.id === this.equippedEffectId) || null;
  }

  get EquippedPet() {
    return SHOP_ITEMS.find(i => i.id === this.equippedPetId) || null;
  }
}
