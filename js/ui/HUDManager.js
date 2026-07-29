import { STAT_TYPES } from '../systems/UpgradeSystem.js';
import { TANK_CLASSES } from '../systems/ClassSystem.js';
import { ShopSystem, SHOP_ITEMS } from '../systems/ShopSystem.js';
import { DevTokenSystem } from '../systems/DevTokenSystem.js';

export class HUDManager {
  constructor(game) {
    this.game = game;
    this.shopSystem = new ShopSystem();
    this.devTokenSystem = new DevTokenSystem();

    this.mainMenu = document.getElementById('mainMenu');
    this.gameHUD = document.getElementById('gameHUD');
    this.gameOverMenu = document.getElementById('gameOverMenu');
    this.inventoryModal = document.getElementById('inventoryModal');
    this.devAuthModal = document.getElementById('devAuthModal');

    this.playBtn = document.getElementById('playBtn');
    this.inventoryBtn = document.getElementById('inventoryBtn');
    this.closeInventoryBtn = document.getElementById('closeInventoryBtn');
    this.shopGridEl = document.getElementById('shopGrid');
    this.starBalanceEl = document.getElementById('starBalance');

    this.openDevAuthBtn = document.getElementById('openDevAuthBtn');
    this.closeDevAuthBtn = document.getElementById('closeDevAuthBtn');
    this.submitDevTokenBtn = document.getElementById('submitDevTokenBtn');
    this.devTokenInput = document.getElementById('devTokenInput');
    this.devToolbar = document.getElementById('devToolbar');

    this.respawnBtn = document.getElementById('respawnBtn');
    this.playerNameInput = document.getElementById('playerNameInput');

    this.hudPlayerName = document.getElementById('hudPlayerName');
    this.hudClassName = document.getElementById('hudClassName');
    this.hudScore = document.getElementById('hudScore');
    this.xpBarFill = document.getElementById('xpBarFill');
    this.xpBarText = document.getElementById('xpBarText');

    this.statList = document.getElementById('statList');
    this.availablePointsBadge = document.getElementById('availablePoints');

    this.evolutionContainer = document.getElementById('evolutionContainer');
    this.evolutionOptions = document.getElementById('evolutionOptions');

    this.leaderboardList = document.getElementById('leaderboardList');
    this.killFeed = document.getElementById('killFeed');

    this.minimapCanvas = document.getElementById('minimapCanvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    // Dev Buttons
    this.devXpBtn = document.getElementById('devXpBtn');
    this.devMaxBtn = document.getElementById('devMaxBtn');
    this.devClassBtn = document.getElementById('devClassBtn');
    this.devGodBtn = document.getElementById('devGodBtn');

    this.initEventListeners();
    this.renderStatTree();
    this.checkDevAuth();
  }

  checkDevAuth() {
    if (this.devTokenSystem.isAuthorized) {
      this.devToolbar.classList.remove('hidden');
    } else {
      this.devToolbar.classList.add('hidden');
    }
  }

  initEventListeners() {
    this.playBtn.addEventListener('click', () => {
      const name = this.playerNameInput.value.trim() || 'Tank';
      const skinColor = this.shopSystem.EquippedSkin.colors ? this.shopSystem.EquippedSkin.colors[0] : '#00b2e7';
      this.game.startGame(name, skinColor);
    });

    // Shop Modal
    this.inventoryBtn.addEventListener('click', () => {
      this.renderShopMarketplace();
      this.inventoryModal.classList.remove('hidden');
      this.inventoryModal.classList.add('active');
    });

    this.closeInventoryBtn.addEventListener('click', () => {
      this.inventoryModal.classList.remove('active');
      this.inventoryModal.classList.add('hidden');
    });

    // Dev Token Modal
    this.openDevAuthBtn.addEventListener('click', () => {
      this.devAuthModal.classList.remove('hidden');
      this.devAuthModal.classList.add('active');
    });

    this.closeDevAuthBtn.addEventListener('click', () => {
      this.devAuthModal.classList.remove('active');
      this.devAuthModal.classList.add('hidden');
    });

    this.submitDevTokenBtn.addEventListener('click', () => {
      const val = this.devTokenInput.value.trim();
      if (this.devTokenSystem.authenticate(val)) {
        this.checkDevAuth();
        this.devAuthModal.classList.remove('active');
        this.devAuthModal.classList.add('hidden');
        alert('Dev tools unlocked successfully!');
      } else {
        alert('Invalid Dev Token key!');
      }
    });

    this.respawnBtn.addEventListener('click', () => {
      const name = this.playerNameInput.value.trim() || 'Tank';
      const skinColor = this.shopSystem.EquippedSkin.colors ? this.shopSystem.EquippedSkin.colors[0] : '#00b2e7';
      this.game.startGame(name, skinColor);
    });

    // Dev Toolbar Listeners
    if (this.devClassBtn) {
      this.devClassBtn.addEventListener('click', () => {
        if (this.game.inputManager) {
          this.game.inputManager.cycleNextClass();
        }
      });
    }

    if (this.devXpBtn) {
      this.devXpBtn.addEventListener('click', () => {
        if (this.game.player) {
          this.game.player.addXP(5000);
          this.addKillFeedMessage(`DEV: +5,000 XP Added! (Lv ${this.game.player.level})`);
        }
      });
    }

    if (this.devMaxBtn) {
      this.devMaxBtn.addEventListener('click', () => {
        if (this.game.player) {
          this.game.player.addXP(30000);
          this.addKillFeedMessage(`DEV: Level 45 Reached!`);
        }
      });
    }

    if (this.devGodBtn) {
      this.devGodBtn.addEventListener('click', () => {
        if (this.game.player) {
          this.game.player.godMode = !this.game.player.godMode;
          this.addKillFeedMessage(`DEV: God Mode ${this.game.player.godMode ? 'ENABLED' : 'DISABLED'}`);
        }
      });
    }
  }

  renderShopMarketplace() {
    this.starBalanceEl.innerText = this.shopSystem.stars.toLocaleString();
    this.shopGridEl.innerHTML = '';

    const colorsList = ['#d32f2f', '#d32f2f', '#00acc1', '#8e24aa', '#0097a7', '#e91e63', '#e91e63', '#d81b60', '#0097a7', '#00838f'];

    SHOP_ITEMS.forEach((item, idx) => {
      const isUnlocked = this.shopSystem.unlockedItems.has(item.id);
      const isEquipped = (this.shopSystem.equippedSkinId === item.id) ||
                         (this.shopSystem.equippedEffectId === item.id) ||
                         (this.shopSystem.equippedPetId === item.id);

      const card = document.createElement('div');
      card.className = `florr-item-card ${isEquipped ? 'equipped' : ''}`;

      let priceLabel = `⭐ ${item.price >= 1000000 ? (item.price / 1000000) + 'm' : (item.price >= 1000 ? (item.price / 1000) + 'k' : item.price)}`;
      let btnClass = 'florr-price-btn';

      if (isEquipped) {
        priceLabel = 'EQUIPPED';
        btnClass += ' equipped-btn';
      } else if (isUnlocked) {
        priceLabel = 'EQUIP';
        btnClass += ' owned-btn';
      }

      const cardColor = colorsList[idx % colorsList.length];

      card.innerHTML = `
        ${item.discount ? `<div class="florr-discount-tag">${item.discount}</div>` : ''}
        <div class="florr-icon-box" style="background: ${cardColor};">
          <span class="florr-icon-emoji">${item.icon}</span>
        </div>
        <div class="florr-item-name">${item.name}</div>
        <button class="${btnClass}">${priceLabel}</button>
      `;

      card.addEventListener('click', () => {
        if (!isUnlocked) {
          if (this.shopSystem.buyItem(item.id)) {
            this.addKillFeedMessage(`✨ Purchased ${item.name}!`);
            this.renderShopMarketplace();
          } else {
            alert('Not enough Stars! Complete challenges to earn stars.');
          }
        } else {
          this.shopSystem.equipItem(item.id);
          this.renderShopMarketplace();
        }
      });

      this.shopGridEl.appendChild(card);
    });
  }

  renderStatTree() {
    this.statList.innerHTML = '';
    STAT_TYPES.forEach(stat => {
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.style.setProperty('--stat-color', stat.color);

      row.innerHTML = `
        <div class="stat-label-box">
          <span class="stat-key">[${stat.key}]</span>
          <span class="stat-name">${stat.name}</span>
        </div>
        <div class="stat-bar-outer">
          <div id="statBar_${stat.id}" class="stat-bar-inner"></div>
        </div>
        <button id="statAddBtn_${stat.id}" class="stat-add-btn">+</button>
      `;

      this.statList.appendChild(row);

      row.addEventListener('click', (e) => {
        if (this.game.player) {
          this.game.player.upgradeSystem.addPoint(stat.id);
        }
      });
    });
  }

  showScreen(screenName) {
    this.mainMenu.classList.add('hidden');
    this.gameHUD.classList.add('hidden');
    this.gameOverMenu.classList.add('hidden');

    this.mainMenu.classList.remove('active');
    this.gameOverMenu.classList.remove('active');

    if (screenName === 'menu') {
      this.mainMenu.classList.remove('hidden');
      this.mainMenu.classList.add('active');
    } else if (screenName === 'game') {
      this.gameHUD.classList.remove('hidden');
    } else if (screenName === 'gameover') {
      this.gameOverMenu.classList.remove('hidden');
      this.gameOverMenu.classList.add('active');
    }
  }

  addKillFeedMessage(msg) {
    const el = document.createElement('div');
    el.className = 'kill-msg';
    el.innerText = msg;
    this.killFeed.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 4000);
  }

  update(player, tanks) {
    if (!player) return;

    this.hudPlayerName.innerText = player.name;
    this.hudClassName.innerText = player.classInfo.name;
    this.hudScore.innerText = player.score.toLocaleString();

    const xpPercent = Math.min(100, (player.xp / player.nextLevelXP) * 100);
    this.xpBarFill.style.width = `${xpPercent}%`;
    this.xpBarText.innerText = `Lv ${player.level} • ${Math.floor(player.xp)} / ${player.nextLevelXP} XP`;

    const points = player.upgradeSystem.availablePoints;
    this.availablePointsBadge.innerText = `${points} Point${points === 1 ? '' : 's'}`;

    STAT_TYPES.forEach(stat => {
      const val = player.upgradeSystem.stats[stat.id] || 0;
      const percent = (val / stat.max) * 100;
      const bar = document.getElementById(`statBar_${stat.id}`);
      const btn = document.getElementById(`statAddBtn_${stat.id}`);

      if (bar) bar.style.width = `${percent}%`;
      if (btn) btn.disabled = points === 0 || val >= stat.max;
    });

    this.updateEvolutionMenu(player);
    this.updateLeaderboard(tanks, player);
    this.drawMinimap(player, tanks);
  }

  updateEvolutionMenu(player) {
    const nextEvos = player.classInfo.evolvesTo;
    let availableEvos = [];

    if (nextEvos && nextEvos.length > 0) {
      availableEvos = nextEvos.filter(key => {
        const cls = TANK_CLASSES[key];
        return cls && player.level >= cls.requiredLevel;
      });
    }

    if (availableEvos.length > 0) {
      this.evolutionContainer.classList.remove('hidden');
      this.evolutionOptions.innerHTML = '';

      availableEvos.forEach(key => {
        const cls = TANK_CLASSES[key];
        const card = document.createElement('div');
        card.className = 'evo-card';
        card.innerHTML = `
          <div class="evo-card-title">${cls.name}</div>
          <div style="font-size: 0.65rem; color: #fff;">[LVL ${cls.requiredLevel}]</div>
        `;
        
        const selectEvo = (e) => {
          e.preventDefault();
          e.stopPropagation();
          player.changeClass(key);
          this.addKillFeedMessage(`Evolved into ${cls.name}!`);
        };

        card.addEventListener('click', selectEvo);
        card.addEventListener('mousedown', selectEvo);
        card.addEventListener('touchstart', selectEvo);

        this.evolutionOptions.appendChild(card);
      });
    } else {
      this.evolutionContainer.classList.add('hidden');
    }
  }

  updateLeaderboard(tanks, player) {
    const sorted = [...tanks].sort((a, b) => b.score - a.score).slice(0, 10);
    this.leaderboardList.innerHTML = '';

    sorted.forEach((t, idx) => {
      const li = document.createElement('li');
      li.className = `lb-item ${t === player ? 'is-player' : ''}`;
      li.innerHTML = `
        <span class="lb-name">${idx + 1}. ${t.name}</span>
        <span class="lb-score">${t.score.toLocaleString()}</span>
      `;
      this.leaderboardList.appendChild(li);
    });
  }

  drawMinimap(player, tanks) {
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const arenaW = this.game.arenaWidth;
    const arenaH = this.game.arenaHeight;

    this.minimapCtx.clearRect(0, 0, w, h);

    this.minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.minimapCtx.lineWidth = 1;
    this.minimapCtx.strokeRect(0, 0, w, h);

    for (let i = 0; i < tanks.length; i++) {
      const t = tanks[i];
      if (t.dead) continue;

      const tx = (t.pos.x / arenaW) * w;
      const ty = (t.pos.y / arenaH) * h;

      if (t === player) {
        this.minimapCtx.fillStyle = '#ffffff';
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(tx, ty, 4, 0, Math.PI * 2);
        this.minimapCtx.fill();
      } else {
        this.minimapCtx.fillStyle = t.color;
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(tx, ty, 3, 0, Math.PI * 2);
        this.minimapCtx.fill();
      }
    }
  }

  showGameOver(player, survivalTimeSec) {
    document.getElementById('finalScore').innerText = player.score.toLocaleString();
    document.getElementById('finalLevel').innerText = player.level;
    document.getElementById('finalKills').innerText = player.kills;
    
    const mins = Math.floor(survivalTimeSec / 60);
    const secs = Math.floor(survivalTimeSec % 60);
    document.getElementById('finalTime').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    this.showScreen('gameover');
  }
}
