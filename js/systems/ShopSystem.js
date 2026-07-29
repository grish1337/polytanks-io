export const SHOP_ITEMS = [
  // Today's Offers (Matching Florr.io shop card layout from reference screenshot!)
  {
    id: 'grad_neon',
    name: 'Neon Cyber',
    category: 'skin',
    type: 'gradient',
    colors: ['#00b2e7', '#8a2be2'],
    price: 60,
    icon: '🔮',
    description: 'Electric cyan to violet neon gradient skin.'
  },
  {
    id: 'effect_plasma',
    name: 'Plasma Ring',
    category: 'effect',
    type: 'aura',
    color: '#00e676',
    price: 40,
    icon: '♠️',
    description: 'Glowing emerald plasma energy aura surrounding your tank.'
  },
  {
    id: 'grad_solar',
    name: 'Solar Flare',
    category: 'skin',
    type: 'gradient',
    colors: ['#ffe869', '#f14e54'],
    price: 400,
    icon: '📐',
    description: 'Blazing golden sun to crimson flame gradient skin.'
  },
  {
    id: 'effect_starfire',
    name: 'Starfire Halo',
    category: 'effect',
    type: 'halo',
    color: '#bf55ec',
    price: 1200,
    discount: '-20%',
    icon: '🪃',
    description: 'Pulsing purple starfire halo floating over your cannon.'
  },
  {
    id: 'pet_droid',
    name: 'Orbit Droid',
    category: 'pet',
    type: 'pet_drone',
    color: '#00b2e7',
    price: 640,
    discount: '-20%',
    icon: '📡',
    description: 'Cute mini cyber droid that orbits your tank in battle.'
  },

  // Premium Row
  {
    id: 'grad_void',
    name: 'Void Eclipse',
    category: 'skin',
    type: 'gradient',
    colors: ['#bf55ec', '#111122'],
    price: 36000,
    icon: '🍃',
    description: 'Deep abyss purple to cosmic dark gradient.'
  },
  {
    id: 'effect_dust',
    name: 'Cosmic Dust',
    category: 'effect',
    type: 'trail',
    color: '#ffe869',
    price: 48000,
    icon: '🌸',
    description: 'Leaves a sparkling trail of floating stardust as you move.'
  },
  {
    id: 'pet_star',
    name: 'Star Buddy',
    category: 'pet',
    type: 'pet_star',
    color: '#ffe869',
    price: 12000,
    icon: '🥦',
    description: 'Glowing yellow star pet companion.'
  },
  {
    id: 'grad_aurora',
    name: 'Aurora Borealis',
    category: 'skin',
    type: 'gradient',
    colors: ['#00e676', '#00b2e7'],
    price: 600000,
    icon: '🍊',
    description: 'Majestic northern lights glowing gradient.'
  },
  {
    id: 'pet_stinger',
    name: 'Stinger Drone',
    category: 'pet',
    type: 'pet_stinger',
    color: '#111111',
    price: 2400000,
    icon: '✴️',
    description: 'Stealth black stinger drone guardian pet.'
  }
];

export class ShopSystem {
  constructor() {
    this.stars = 2141; // Initial stars balance as shown in reference screenshot!
    this.unlockedItems = new Set(['grad_neon', 'effect_plasma']); // Free starter items
    this.equippedSkinId = 'grad_neon';
    this.equippedEffectId = 'effect_plasma';
    this.equippedPetId = null;

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
    } catch (e) {}
  }

  saveState() {
    try {
      localStorage.setItem('polytanks_stars', this.stars.toString());
      localStorage.setItem('polytanks_unlocked_items', JSON.stringify(Array.from(this.unlockedItems)));
      localStorage.setItem('polytanks_equipped_skin', this.equippedSkinId || '');
      localStorage.setItem('polytanks_equipped_effect', this.equippedEffectId || '');
      localStorage.setItem('polytanks_equipped_pet', this.equippedPetId || '');
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
