import { TANK_CLASSES } from '../systems/ClassSystem.js';

export class InputManager {
  constructor(game) {
    this.game = game;
    this.keys = {};
    this.mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.isMouseDown = false;

    this.initListeners();
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Hotkeys 1-8 for Stat Upgrades (Available to all players!)
      let digit = -1;
      if (e.code.startsWith('Digit')) {
        digit = parseInt(e.code.replace('Digit', ''));
      } else if (e.code.startsWith('Numpad')) {
        digit = parseInt(e.code.replace('Numpad', ''));
      }

      if (digit >= 1 && digit <= 8 && this.game.player) {
        const statIds = ['healthRegen', 'maxHealth', 'bodyDamage', 'bulletSpeed', 'bulletPenetration', 'bulletDamage', 'reloadSpeed', 'movementSpeed'];
        this.game.player.upgradeSystem.addPoint(statIds[digit - 1]);
      }

      // Hotkey E: Auto-Fire
      if (e.code === 'KeyE' && this.game.player) {
        this.game.player.autoFire = !this.game.player.autoFire;
        if (this.game.hudManager) {
          this.game.hudManager.addKillFeedMessage(`Auto-Fire: ${this.game.player.autoFire ? 'ON' : 'OFF'}`);
        }
      }

      // Hotkey C: Auto-Spin
      if (e.code === 'KeyC' && this.game.player) {
        this.game.player.autoSpin = !this.game.player.autoSpin;
        if (this.game.hudManager) {
          this.game.hudManager.addKillFeedMessage(`Auto-Spin: ${this.game.player.autoSpin ? 'ON' : 'OFF'}`);
        }
      }

      // Hotkey Q: Ability
      if (e.code === 'KeyQ' && this.game.player) {
        this.game.player.activateAbility(this.game);
      }

      // DEV HOTKEYS (Restricted strictly to Authorized Dev Token users only!)
      const isDevAuth = this.game.hudManager && this.game.hudManager.devTokenSystem && this.game.hudManager.devTokenSystem.isAuthorized;

      if (isDevAuth) {
        // K: +5,000 XP
        if (e.code === 'KeyK' && this.game.player) {
          this.game.player.addXP(5000);
          if (this.game.hudManager) this.game.hudManager.addKillFeedMessage(`DEV: +5,000 XP Added! (Lv ${this.game.player.level})`);
        }

        // L: Level 45
        if (e.code === 'KeyL' && this.game.player) {
          this.game.player.addXP(30000);
          if (this.game.hudManager) this.game.hudManager.addKillFeedMessage(`DEV: Instant Level 45!`);
        }

        // P or O: Instant Arena Closer 🟡 Transformation!
        if ((e.code === 'KeyP' || e.code === 'KeyO') && this.game.player) {
          this.game.spawnAC();
        }

        // N: Cycle Tank Class
        if (e.code === 'KeyN' && this.game.player) {
          this.cycleNextClass();
        }

        // M: God Mode
        if (e.code === 'KeyM' && this.game.player) {
          this.game.player.godMode = !this.game.player.godMode;
          if (this.game.hudManager) this.game.hudManager.addKillFeedMessage(`DEV: God Mode ${this.game.player.godMode ? 'ENABLED' : 'DISABLED'}`);
        }

        // T: Teleport to Nearest Player
        if (e.code === 'KeyT' && this.game.player && this.game.networkManager) {
          const success = this.game.networkManager.teleportToNearestPlayer();
          if (this.game.hudManager) {
            this.game.hudManager.addKillFeedMessage(success ? `DEV: Teleported to player!` : `No other players online to teleport to.`);
          }
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    });
  }

  cycleNextClass() {
    if (!this.game.player) return;
    const keys = Object.keys(TANK_CLASSES);
    const currIndex = keys.indexOf(this.game.player.classInfo.id);
    const nextKey = keys[(currIndex + 1) % keys.length];
    this.game.player.changeClass(nextKey);
    if (this.game.hudManager) {
      this.game.hudManager.addKillFeedMessage(`Evolved into ${TANK_CLASSES[nextKey].name}!`);
    }
  }

  updatePlayerControls(player, camera) {
    if (!player || player.dead) return;

    let moveX = 0;
    let moveY = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['KeyZ']) moveY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['KeyQ']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.7071;
      moveY *= 0.7071;
    }

    const speedStat = (player.upgradeSystem && typeof player.upgradeSystem.getMultiplier === 'function')
      ? player.upgradeSystem.getMultiplier('movementSpeed')
      : 1.0;

    let moveSpeedMultiplier = 1.0 * speedStat;
    if (player.classInfo && player.classInfo.id === 'arena_closer') {
      moveSpeedMultiplier *= 2.5;
    }

    // Classic Diep.io smooth movement speed & acceleration!
    const accel = 0.28 * moveSpeedMultiplier;
    player.vel.x += moveX * accel;
    player.vel.y += moveY * accel;

    if (player.autoSpin) {
      player.angle += 0.05;
    } else if (camera) {
      const worldMouse = camera.screenToWorld(this.mousePos.x, this.mousePos.y);
      player.angle = Math.atan2(worldMouse.y - player.pos.y, worldMouse.x - player.pos.x);
    }

    if (this.isMouseDown || player.autoFire) {
      player.shoot(this.game);
    }
  }
}
