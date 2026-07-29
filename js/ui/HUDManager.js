import { STAT_TYPES } from '../systems/UpgradeSystem.js';
import { TANK_CLASSES } from '../systems/ClassSystem.js';
import { ShopSystem, SHOP_ITEMS, CHALLENGES } from '../systems/ShopSystem.js';
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

    this.activeShopTab = 'Shop';

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
      this.applyEquippedCosmeticsToPlayer();
    });

    // Shop Modal
    this.inventoryBtn.addEventListener('click', () => {
      this.activeShopTab = 'Shop';
      this.renderShopMarketplace();
      this.inventoryModal.classList.remove('hidden');
      this.inventoryModal.classList.add('active');
    });

    this.closeInventoryBtn.addEventListener('click', () => {
      this.inventoryModal.classList.remove('active');
      this.inventoryModal.classList.add('hidden');
    });

    // Tab buttons in Shop
    const tabBtns = document.querySelectorAll('.florr-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeShopTab = btn.innerText.trim();
        if (this.activeShopTab === 'Challenge') {
          this.renderChallengesTab();
        } else {
          this.renderShopMarketplace();
        }
      });
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
      this.applyEquippedCosmeticsToPlayer();
    });

    // Dev Toolbar Listeners
    if (this.devClassBtn) {
      this.devClassBtn.addEventListener('click', () => {
        if (this.game.inputManager) {
          this.game.inputManager.cycleNextClass();
          this.checkChallengeProgress();
        }
      });
    }

    if (this.devXpBtn) {
      this.devXpBtn.addEventListener('click', () => {
        if (this.game.player) {
          this.game.player.addXP(5000);
          this.checkChallengeProgress();
          this.addKillFeedMessage(`DEV: +5,000 XP Added! (Lv ${this.game.player.level})`);
        }
      });
    }

    if (this.devMaxBtn) {
      this.devMaxBtn.addEventListener('click', () => {
        if (this.game.player) {
          this.game.player.addXP(30000);
          this.checkChallengeProgress();
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

  applyEquippedCosmeticsToPlayer() {
    if (!this.game.player) return;
    this.game.player.equippedSkin = this.shopSystem.EquippedSkin;
    this.game.player.equippedEffect = this.shopSystem.EquippedEffect;
    this.game.player.equippedPet = this.shopSystem.EquippedPet;

    if (this.shopSystem.EquippedSkin.colors) {
      this.game.player.color = this.shopSystem.EquippedSkin.colors[0];
    }
  }

  checkChallengeProgress() {
    if (!this.game.player) return;

    this.shopSystem.progress.maxLevel = Math.max(this.shopSystem.progress.maxLevel, this.game.player.level);
    if (this.game.player.classInfo.id === 'arena_closer') {
      this.shopSystem.progress.acUnlocked = 1;
    }
    this.shopSystem.saveState();
  }

  renderShopMarketplace() {
    this.starBalanceEl.innerText = this.shopSystem.stars.toLocaleString();
    this.shopGridEl.innerHTML = '';

    SHOP_ITEMS.forEach((item) => {
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

      // Unique Canvas Preview for every item!
      const canvasId = `preview_canvas_${item.id}`;

      card.innerHTML = `
        ${item.discount ? `<div class="florr-discount-tag">${item.discount}</div>` : ''}
        <div class="florr-icon-box">
          <canvas id="${canvasId}" width="80" height="80"></canvas>
        </div>
        <div class="florr-item-name">${item.name}</div>
        <button class="${btnClass}">${priceLabel}</button>
      `;

      card.addEventListener('click', () => {
        if (!isUnlocked) {
          if (this.shopSystem.buyItem(item.id)) {
            this.addKillFeedMessage(`✨ Unlocked ${item.name}!`);
            this.applyEquippedCosmeticsToPlayer();
            this.renderShopMarketplace();
          } else {
            alert('Not enough Stars! Complete challenges to earn stars.');
          }
        } else {
          this.shopSystem.equipItem(item.id);
          this.applyEquippedCosmeticsToPlayer();
          this.renderShopMarketplace();
        }
      });

      this.shopGridEl.appendChild(card);

      // Render Tank Preview on Card Canvas
      setTimeout(() => this.drawTankPreviewOnCanvas(canvasId, item), 0);
    });
  }

  drawTankPreviewOnCanvas(canvasId, item) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 80, 80);

    const cx = 40, cy = 40, r = 18;

    // Draw Aura Preview
    if (item.category === 'effect' || item.type === 'aura') {
      ctx.strokeStyle = item.color || '#00e676';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw Cannon Barrel
    ctx.fillStyle = '#999999';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.fillRect(cx, cy - 6, 26, 12);
    ctx.strokeRect(cx, cy - 6, 26, 12);

    // Draw Tank Body with Cosmetic Gradient
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);

    if (item.category === 'skin' && item.colors) {
      const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      grad.addColorStop(0, item.colors[0]);
      grad.addColorStop(1, item.colors[1]);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = '#00b2e7';
    }
    ctx.fill();
    ctx.stroke();

    // Draw Companion Pet Preview
    if (item.category === 'pet') {
      ctx.fillStyle = item.color || '#ffe869';
      ctx.beginPath();
      ctx.arc(cx + 24, cy - 14, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  renderChallengesTab() {
    this.starBalanceEl.innerText = this.shopSystem.stars.toLocaleString();
    this.shopGridEl.innerHTML = '';

    CHALLENGES.forEach((chal) => {
      const isClaimed = this.shopSystem.claimedChallenges.has(chal.id);
      const currentVal = this.shopSystem.progress[chal.key] || 0;
      const isComplete = currentVal >= chal.target;

      const card = document.createElement('div');
      card.className = `florr-item-card ${isClaimed ? 'equipped' : ''}`;
      card.style.gridColumn = 'span 2';

      let btnLabel = `CLAIM +${chal.reward} ⭐`;
      let btnClass = 'florr-price-btn owned-btn';

      if (isClaimed) {
        btnLabel = 'COMPLETED ✓';
        btnClass = 'florr-price-btn equipped-btn';
      } else if (!isComplete) {
        btnLabel = `${currentVal}/${chal.target}`;
        btnClass = 'florr-price-btn';
      }

      card.innerHTML = `
        <div class="florr-icon-box" style="background: #4a148c;">
          <span class="florr-icon-emoji">🎯</span>
        </div>
        <div class="florr-item-name">${chal.title}</div>
        <div style="font-size: 0.65rem; color: #fff; text-align: center;">${chal.desc}</div>
        <button class="${btnClass}">${btnLabel}</button>
      `;

      card.addEventListener('click', () => {
        if (!isClaimed && isComplete) {
          if (this.shopSystem.claimChallenge(chal.id)) {
            this.addKillFeedMessage(`🏆 Challenge Complete! +${chal.reward} Stars!`);
            this.renderChallengesTab();
          }
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

    this.checkChallengeProgress();

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
