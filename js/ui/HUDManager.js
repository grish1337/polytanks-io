import { STAT_TYPES } from '../systems/UpgradeSystem.js';
import { DevTokenSystem } from '../systems/DevTokenSystem.js';
import { ShopSystem, SHOP_ITEMS } from '../systems/ShopSystem.js';
import { TANK_CLASSES } from '../systems/ClassSystem.js';

export class HUDManager {
  constructor(game) {
    this.game = game;
    this.devTokenSystem = new DevTokenSystem();
    this.shopSystem = new ShopSystem();

    // DOM References
    this.mainMenu = document.getElementById('mainMenu');
    this.gameHUD = document.getElementById('gameHUD');
    this.gameOverMenu = document.getElementById('gameOverMenu');
    this.devToolbar = document.getElementById('devToolbar');

    this.playBtn = document.getElementById('playBtn');
    this.playerNameInput = document.getElementById('playerNameInput');
    this.respawnBtn = document.getElementById('respawnBtn');
    this.inventoryBtn = document.getElementById('inventoryBtn');
    this.inventoryModal = document.getElementById('inventoryModal');
    this.closeInventoryBtn = document.getElementById('closeInventoryBtn');

    this.openDevAuthBtn = document.getElementById('openDevAuthBtn');
    this.devAuthModal = document.getElementById('devAuthModal');
    this.closeDevAuthBtn = document.getElementById('closeDevAuthBtn');
    this.submitDevTokenBtn = document.getElementById('submitDevTokenBtn');
    this.devTokenInput = document.getElementById('devTokenInput');

    // Player Stats Overlay
    this.hudPlayerName = document.getElementById('hudPlayerName');
    this.hudClassName = document.getElementById('hudClassName');
    this.xpBarFill = document.getElementById('xpBarFill');
    this.xpBarText = document.getElementById('xpBarText');
    this.hudScore = document.getElementById('hudScore');

    // Evolution Panel
    this.evolutionContainer = document.getElementById('evolutionContainer');
    this.evolutionOptions = document.getElementById('evolutionOptions');
    this.lastEvoClassId = null;

    // Stat Upgrade Panel
    this.availablePoints = document.getElementById('availablePoints');
    this.statList = document.getElementById('statList');

    // Leaderboard & Kill feed
    this.leaderboardList = document.getElementById('leaderboardList');
    this.killFeed = document.getElementById('killFeed');

    // Game Over Summary
    this.finalScore = document.getElementById('finalScore');
    this.finalLevel = document.getElementById('finalLevel');
    this.finalKills = document.getElementById('finalKills');
    this.finalTime = document.getElementById('finalTime');
    this.killedByText = document.getElementById('killedByText');

    // Minimap
    this.minimapCanvas = document.getElementById('minimapCanvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

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
    if (this.devToolbar) {
      if (this.devTokenSystem.isAuthorized) {
        this.devToolbar.classList.remove('hidden');
      } else {
        this.devToolbar.classList.add('hidden');
      }
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

    // Florr.io Tabs Switcher
    const tabBtns = document.querySelectorAll('.florr-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        tabBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.activeShopTab = e.target.innerText.trim();

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

    if (this.shopSystem.EquippedSkin && this.shopSystem.EquippedSkin.colors) {
      this.game.player.color = this.shopSystem.EquippedSkin.colors[0];
    }
  }

  renderShopMarketplace() {
    const shopGrid = document.getElementById('shopGrid');
    const starBalance = document.getElementById('starBalance');
    if (!shopGrid) return;

    if (starBalance) {
      starBalance.innerText = this.shopSystem.stars;
    }

    shopGrid.innerHTML = '';

    SHOP_ITEMS.forEach(item => {
      const card = document.createElement('div');
      const isEquipped = this.shopSystem.isEquipped(item.id);
      const isOwned = this.shopSystem.isOwned(item.id);

      card.className = `florr-item-card ${isEquipped ? 'equipped' : ''}`;

      let descText = item.type.toUpperCase();
      let iconColor = '#00b2e7';
      if (item.colors) iconColor = item.colors[0];
      if (item.color) iconColor = item.color;

      card.innerHTML = `
        ${item.discount ? `<div class="florr-discount-tag">${item.discount}</div>` : ''}
        <div class="florr-icon-box">
          <canvas class="shop-preview-canvas" width="70" height="70" data-item-id="${item.id}"></canvas>
        </div>
        <div class="florr-item-name">${item.name}</div>
        <div class="florr-price-btn ${isEquipped ? 'equipped-btn' : (isOwned ? 'owned-btn' : '')}">
          ${isEquipped ? 'EQUIPPED' : (isOwned ? 'EQUIP' : `<span>⭐</span> ${item.price}`)}
        </div>
      `;

      card.addEventListener('click', () => {
        if (isEquipped) return;
        if (isOwned) {
          this.shopSystem.equipItem(item.id);
          this.renderShopMarketplace();
          this.applyEquippedCosmeticsToPlayer();
        } else {
          if (this.shopSystem.buyItem(item.id)) {
            this.renderShopMarketplace();
            this.applyEquippedCosmeticsToPlayer();
          } else {
            alert('Not enough ⭐ Stars! Complete challenges to earn more.');
          }
        }
      });

      shopGrid.appendChild(card);
    });

    setTimeout(() => this.drawShopPreviews(), 20);
  }

  drawShopPreviews() {
    const canvases = document.querySelectorAll('.shop-preview-canvas');
    canvases.forEach(canvas => {
      const itemId = canvas.getAttribute('data-item-id');
      const item = SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) return;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 70, 70);

      // Render Mini Tank Model with cosmetic!
      ctx.save();
      ctx.translate(35, 35);

      // Aura halo preview
      if (item.type === 'effect' && item.color) {
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Barrel
      ctx.fillStyle = '#999999';
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 2;
      ctx.fillRect(0, -6, 22, 12);
      ctx.strokeRect(0, -6, 22, 12);

      // Body Gradient preview
      ctx.save();
      if (item.type === 'skin' && item.colors) {
        const grad = ctx.createLinearGradient(-16, -16, 16, 16);
        grad.addColorStop(0, item.colors[0]);
        grad.addColorStop(1, item.colors[1]);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = item.color || '#00b2e7';
      }
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Pet preview
      if (item.type === 'pet' && item.color) {
        ctx.fillStyle = item.color;
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(22, -14, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  renderChallengesTab() {
    const shopGrid = document.getElementById('shopGrid');
    if (!shopGrid) return;

    shopGrid.innerHTML = '';

    const challenges = this.shopSystem.challenges;
    challenges.forEach(ch => {
      const card = document.createElement('div');
      card.className = 'florr-item-card';
      card.style.gridColumn = 'span 2';
      card.style.alignItems = 'flex-start';
      card.style.padding = '12px';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <div class="florr-item-name" style="font-size:1.0rem;">${ch.title}</div>
          <div style="font-size:0.9rem; font-weight:900; color:#ffe869;">⭐ +${ch.reward}</div>
        </div>
        <div style="font-size:0.75rem; color:#fff; margin-top:4px;">${ch.desc}</div>
        <div style="width:100%; background:rgba(0,0,0,0.3); height:12px; border-radius:6px; margin-top:8px; overflow:hidden;">
          <div style="width:${Math.min(100, (ch.progress / ch.target) * 100)}%; background:#00e676; height:100%;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; width:100%; margin-top:6px;">
          <span style="font-size:0.7rem; color:#eee;">${ch.progress} / ${ch.target}</span>
          <button class="florr-price-btn ${ch.completed ? 'equipped-btn' : ''}" style="width:auto; padding:3px 10px;" ${ch.completed ? 'disabled' : ''}>
            ${ch.completed ? 'COMPLETED' : 'CLAIM'}
          </button>
        </div>
      `;

      const btn = card.querySelector('button');
      if (btn && !ch.completed) {
        btn.addEventListener('click', () => {
          if (ch.progress >= ch.target) {
            this.shopSystem.claimChallenge(ch.id);
            this.renderChallengesTab();
            const starBalance = document.getElementById('starBalance');
            if (starBalance) starBalance.innerText = this.shopSystem.stars;
          } else {
            alert('Challenge not finished yet!');
          }
        });
      }

      shopGrid.appendChild(card);
    });
  }

  checkChallengeProgress() {
    if (!this.game.player) return;

    // Challenge 1: Destroy Shapes
    if (this.game.player.score >= 500) {
      this.shopSystem.updateChallengeProgress('c1', Math.floor(this.game.player.score / 10));
    }
    // Challenge 2: Reach Level 15
    if (this.game.player.level >= 15) {
      this.shopSystem.updateChallengeProgress('c2', 15);
    }
  }

  showScreen(screenName) {
    this.mainMenu.classList.remove('active');
    this.mainMenu.classList.add('hidden');

    this.gameHUD.classList.remove('active');
    this.gameHUD.classList.add('hidden');

    this.gameOverMenu.classList.remove('active');
    this.gameOverMenu.classList.add('hidden');

    if (screenName === 'menu') {
      this.mainMenu.classList.remove('hidden');
      this.mainMenu.classList.add('active');
    } else if (screenName === 'game') {
      this.gameHUD.classList.remove('hidden');
      this.gameHUD.classList.add('active');
    } else if (screenName === 'gameover') {
      this.gameOverMenu.classList.remove('hidden');
      this.gameOverMenu.classList.add('active');
    }
  }

  showGameOver(player, survivalTime) {
    this.showScreen('gameover');
    if (!player) return;

    this.finalScore.innerText = player.score.toLocaleString();
    this.finalLevel.innerText = player.level;
    this.finalKills.innerText = player.kills || 0;

    const mins = Math.floor(survivalTime / 60);
    const secs = Math.floor(survivalTime % 60);
    this.finalTime.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    this.killedByText.innerText = 'Killed in action!';
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
          <div class="stat-bar-inner" id="stat-bar-${stat.id}"></div>
        </div>
        <button class="stat-add-btn" id="stat-btn-${stat.id}">+</button>
      `;

      const addBtn = row.querySelector('.stat-add-btn');
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.game.player) {
          this.game.player.upgradeSystem.addPoint(stat.id);
          this.updateStatPanel();
        }
      });

      this.statList.appendChild(row);
    });
  }

  updateStatPanel() {
    if (!this.game.player) return;

    const upgradeSys = this.game.player.upgradeSystem;
    this.availablePoints.innerText = `${upgradeSys.availablePoints} Point${upgradeSys.availablePoints === 1 ? '' : 's'}`;

    STAT_TYPES.forEach(stat => {
      const currentVal = upgradeSys.stats[stat.id] || 0;
      const bar = document.getElementById(`stat-bar-${stat.id}`);
      const btn = document.getElementById(`stat-btn-${stat.id}`);

      if (bar) {
        const fillPercent = (currentVal / stat.max) * 100;
        bar.style.width = `${fillPercent}%`;
      }

      if (btn) {
        btn.disabled = upgradeSys.availablePoints <= 0 || currentVal >= stat.max;
      }
    });
  }

  update(player, tanks) {
    if (!player) return;

    this.hudPlayerName.innerText = player.name || 'Pilot';
    this.hudClassName.innerText = player.classInfo.name;
    this.hudScore.innerText = player.score.toLocaleString();

    const xpPercent = Math.min(100, Math.max(0, (player.xp / player.nextLevelXP) * 100));
    this.xpBarFill.style.width = `${xpPercent}%`;
    this.xpBarText.innerText = `Lv ${player.level} • ${player.xp} / ${player.nextLevelXP} XP`;

    this.updateStatPanel();
    this.updateEvolutionPanel(player);
    this.updateLeaderboard(tanks);
    this.updateMinimap(player, tanks);
  }

  updateEvolutionPanel(player) {
    if (!player) return;

    const availableEvolutions = player.classInfo.evolvesTo || [];
    const reqLevel = player.classInfo.nextTierRequiredLevel || (player.classInfo.tier === 1 ? 15 : (player.classInfo.tier === 2 ? 30 : 45));
    const canEvolve = (player.level >= reqLevel) && availableEvolutions.length > 0;

    if (canEvolve) {
      this.evolutionContainer.classList.remove('hidden');

      if (this.lastEvoClassId === player.classInfo.id && this.evolutionOptions.children.length > 0) {
        return;
      }
      this.lastEvoClassId = player.classInfo.id;
      this.evolutionOptions.innerHTML = '';

      availableEvolutions.forEach(classKey => {
        const evoCard = document.createElement('div');
        evoCard.className = 'evo-card';

        const classData = TANK_CLASSES[classKey];
        const className = classData ? classData.name : classKey.toUpperCase();

        evoCard.innerHTML = `<div class="evo-card-title">${className}</div>`;

        evoCard.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          player.changeClass(classKey);
          this.addKillFeedMessage(`Evolved into ${className}!`);
          this.lastEvoClassId = null;
          this.updateEvolutionPanel(player);

          if (this.game.networkManager && this.game.networkManager.connected) {
            this.game.networkManager.sendInput(player);
          }
        });

        this.evolutionOptions.appendChild(evoCard);
      });
    } else {
      this.evolutionContainer.classList.add('hidden');
      this.lastEvoClassId = null;
    }
  }

  updateLeaderboard(tanks) {
    if (!tanks || !this.leaderboardList) return;

    const sortedTanks = [...tanks].sort((a, b) => b.score - a.score).slice(0, 10);
    this.leaderboardList.innerHTML = '';

    sortedTanks.forEach(t => {
      const item = document.createElement('li');
      const isMe = t === this.game.player;
      item.className = `lb-item ${isMe ? 'is-player' : ''}`;
      item.innerHTML = `
        <span class="lb-name">${t.name}</span>
        <span class="lb-score">${t.score.toLocaleString()}</span>
      `;
      this.leaderboardList.appendChild(item);
    });
  }

  updateMinimap(player, tanks) {
    if (!this.minimapCtx || !player) return;

    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const arenaW = this.game.arenaWidth;
    const arenaH = this.game.arenaHeight;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, w, h);

    if (tanks) {
      tanks.forEach(t => {
        const mx = (t.pos.x / arenaW) * w;
        const my = (t.pos.y / arenaH) * h;
        const isMe = t === player;

        ctx.fillStyle = isMe ? '#00b2e7' : '#f14e54';
        ctx.beginPath();
        ctx.arc(mx, my, isMe ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  addKillFeedMessage(message) {
    if (!this.killFeed) return;
    const msgBox = document.createElement('div');
    msgBox.className = 'kill-msg';
    msgBox.innerText = message;
    this.killFeed.appendChild(msgBox);

    setTimeout(() => {
      if (this.killFeed.contains(msgBox)) {
        this.killFeed.removeChild(msgBox);
      }
    }, 4500);
  }
}
