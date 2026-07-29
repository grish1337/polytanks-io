import { CanvasRenderer } from './engine/CanvasRenderer.js';
import { Camera } from './engine/Camera.js';
import { InputManager } from './engine/InputManager.js';
import { SoundEngine } from './engine/SoundEngine.js';
import { CollisionEngine } from './engine/CollisionEngine.js';
import { SpatialGrid } from './engine/SpatialGrid.js';
import { NetworkManager } from './engine/NetworkManager.js';
import { ParticleManager } from './entities/Particle.js';
import { Tank } from './entities/Tank.js';
import { Shape } from './entities/Shape.js';
import { HUDManager } from './ui/HUDManager.js';

export class Game {
  constructor() {
    window.game = this; // Immediate global window reference!

    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new CanvasRenderer(this.canvas);
    this.camera = new Camera(window.innerWidth, window.innerHeight);
    this.soundEngine = new SoundEngine();
    this.particleManager = new ParticleManager();
    this.inputManager = new InputManager(this);
    this.networkManager = new NetworkManager(this);

    // Massive Diep Arena (7000 x 7000)
    this.arenaWidth = 7000;
    this.arenaHeight = 7000;

    this.collisionEngine = new CollisionEngine(this.arenaWidth, this.arenaHeight);
    this.spatialGrid = new SpatialGrid(180);

    this.player = null;
    this.tanks = [];
    this.shapes = [];
    this.bullets = [];

    this.hudManager = new HUDManager(this);
    this.state = 'MENU';

    this.survivalTime = 0;
    this.lastTime = performance.now();

    this.initWindowListeners();
    this.hudManager.showScreen('menu');

    // Connect WebSocket network on load
    this.networkManager.connect();
  }

  initWindowListeners() {
    window.addEventListener('resize', () => {
      this.renderer.resize();
      this.camera.resize(window.innerWidth, window.innerHeight);
    });
    this.renderer.resize();
  }

  startGame(playerName, playerColor) {
    this.tanks = [];
    this.survivalTime = 0;

    // Spawn players closer to center (3000 to 4000) so connected players meet easily
    const spawnX = 3000 + Math.random() * 1000;
    const spawnY = 3000 + Math.random() * 1000;
    this.player = new Tank(spawnX, spawnY, playerName, playerColor, false);
    
    this.tanks.push(this.player);

    if (this.networkManager) {
      this.networkManager.remoteTanksMap.forEach((remoteTank) => {
        this.tanks.push(remoteTank);
      });

      if (!this.networkManager.connected) {
        this.networkManager.connect();
      } else {
        this.networkManager.sendRespawn(spawnX, spawnY);
      }
    }

    this.state = 'PLAYING';
    this.hudManager.showScreen('game');
    this.hudManager.addKillFeedMessage(`Entered arena! Press [N] to cycle classes.`);
  }

  spawnAC() {
    if (!this.player || this.state !== 'PLAYING') {
      this.startGame('ArenaCloser', '#ffe869');
    }
    if (this.player) {
      this.player.changeClass('arena_closer');
      if (this.hudManager) {
        this.hudManager.addKillFeedMessage('🟡 ARENA CLOSER ACTIVATED! (3x Size, God Mode, 2x Speed)');
      }
    }
  }

  update(dt = 1) {
    if (this.state !== 'PLAYING') return;

    try {
      this.survivalTime += 0.016 * dt;

      // Controls & Camera
      if (this.player) {
        this.inputManager.updatePlayerControls(this.player, this.camera);
        this.camera.update(this.player, 0.08);

        if (this.networkManager.connected) {
          this.networkManager.sendInput(this.player);
        }
      }

      // Tanks updates & boundary checks
      for (let i = this.tanks.length - 1; i >= 0; i--) {
        const t = this.tanks[i];
        if (t) {
          t.update(dt, this);
          this.collisionEngine.resolveBoundaryCollision(t);

          if (t.dead) {
            if (t === this.player && !t.godMode) {
              this.state = 'GAMEOVER';
              this.hudManager.showGameOver(this.player, this.survivalTime);
            } else if (t === this.player && t.godMode) {
              t.dead = false;
              t.health = t.maxHealth;
            }
          }
        }
      }

      this.particleManager.update(dt);

      // Hard Solid Tank-Shape & Tank-Tank Collision Resolution
      this.spatialGrid.clear();
      for (let i = 0; i < this.shapes.length; i++) this.spatialGrid.insert(this.shapes[i]);
      for (let i = 0; i < this.tanks.length; i++) this.spatialGrid.insert(this.tanks[i]);

      for (let i = 0; i < this.tanks.length; i++) {
        const tank = this.tanks[i];
        if (tank && !tank.dead) {
          const nearby = this.spatialGrid.getNearby(tank);
          for (let j = 0; j < nearby.length; j++) {
            const other = nearby[j];
            if (other && other !== tank) {
              this.collisionEngine.resolveElasticCollision(tank, other, dt);
            }
          }
        }
      }

      this.hudManager.update(this.player, this.tanks);
    } catch (e) {
      console.error("Game update error:", e);
    }
  }

  render() {
    try {
      this.renderer.clear();

      if (this.state === 'PLAYING' || this.state === 'GAMEOVER') {
        this.renderer.drawGrid(this.camera, this.arenaWidth, this.arenaHeight);

        for (let i = 0; i < this.shapes.length; i++) {
          if (this.shapes[i]) this.shapes[i].draw(this.renderer.ctx, this.camera);
        }

        for (let i = 0; i < this.bullets.length; i++) {
          if (this.bullets[i]) this.bullets[i].draw(this.renderer.ctx, this.camera);
        }

        for (let i = 0; i < this.tanks.length; i++) {
          if (this.tanks[i]) this.tanks[i].draw(this.renderer.ctx, this.camera);
        }

        this.particleManager.draw(this.renderer.ctx, this.camera);
      }
    } catch (e) {
      console.error("Game render error:", e);
    }
  }

  loop() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 16.66, 2.0);
    this.lastTime = now;

    this.update(dt);
    this.render();

    requestAnimationFrame(() => this.loop());
  }

  start() {
    this.loop();
  }
}
