import { Tank } from '../entities/Tank.js';
import { Shape } from '../entities/Shape.js';
import { Bullet } from '../entities/Bullet.js';

export class NetworkManager {
  constructor(game) {
    this.game = game;
    this.ws = null;
    this.connected = false;
    this.playerId = null;
    this.remoteTanksMap = new Map();
    this.shapesMap = new Map();
    this.bulletsMap = new Map();
  }

  connect() {
    if (this.connected || (this.ws && this.ws.readyState === WebSocket.OPEN)) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    
    // Automatically detect local vs Render.com / Cloud deployment
    let wsUrl;
    if (host === 'localhost' || host === '127.0.0.1') {
      wsUrl = `${protocol}//${host}:8765`;
    } else {
      wsUrl = `${protocol}//${host}`;
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connected = true;
        console.log('⚡ Connected to PolyTanks Server!');
        if (this.game.hudManager) {
          this.game.hudManager.addKillFeedMessage('🟢 MULTIPLAYER LIVE!');
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INIT') {
            this.playerId = data.id;
            if (data.shapes) this.initShapes(data.shapes);
          } else if (data.type === 'UPDATE') {
            this.syncRemotePlayers(data.players || []);
            this.syncShapes(data.shapes || []);
            this.syncBullets(data.bullets || []);
          }
        } catch (e) {}
      };

      this.ws.onclose = () => {
        this.connected = false;
        // Auto-reconnect WebSockets if connection drops
        setTimeout(() => this.connect(), 1500);
      };

      this.ws.onerror = () => {
        this.connected = false;
      };
    } catch (e) {
      this.connected = false;
    }
  }

  initShapes(shapesData) {
    if (!this.game) return;
    this.game.shapes = [];
    this.shapesMap.clear();

    shapesData.forEach(sData => {
      const shape = new Shape(sData.x, sData.y, sData.type);
      shape.id = sData.id;
      shape.health = sData.hp;
      shape.maxHealth = sData.maxHp;
      this.shapesMap.set(sData.id, shape);
      this.game.shapes.push(shape);
    });
  }

  syncRemotePlayers(playersData) {
    if (!this.game || !this.game.tanks) return;

    const currentRemoteIds = new Set();

    playersData.forEach(pData => {
      // 1. Local Player Health, XP & Score Synchronization
      if (pData.id === this.playerId) {
        if (this.game.player) {
          // Award XP to local player when server score increases!
          if (pData.score > this.game.player.score) {
            const xpGained = pData.score - this.game.player.score;
            this.game.player.addXP(xpGained);
          }

          if (!this.game.player.godMode && this.game.player.classInfo.id !== 'arena_closer') {
            this.game.player.health = pData.hp;
            if (this.game.player.health <= 0) {
              this.game.player.dead = true;
            }
          }
        }
        return;
      }

      currentRemoteIds.add(pData.id);

      // 2. Remote Players Synchronization
      let tank = this.remoteTanksMap.get(pData.id);
      if (!tank) {
        tank = new Tank(pData.x, pData.y, pData.name || 'Player', pData.color || '#f14e54', false);
        tank.id = pData.id;
        tank.level = pData.level || 1;
        tank.score = pData.score || 0;
        tank.health = pData.hp || 100;
        if (pData.classId) tank.changeClass(pData.classId);
        
        this.remoteTanksMap.set(pData.id, tank);
        this.game.tanks.push(tank);
      } else {
        tank.name = pData.name || 'Player';
        tank.color = pData.color || '#f14e54';
        tank.level = pData.level || 1;
        tank.score = pData.score || 0;
        tank.health = pData.hp;

        if (pData.classId && tank.classInfo.id !== pData.classId) {
          tank.changeClass(pData.classId);
        }
        if (pData.radius) {
          tank.radius = pData.radius;
        }

        // Smooth position & angle lerping
        tank.pos.x += (pData.x - tank.pos.x) * 0.45;
        tank.pos.y += (pData.y - tank.pos.y) * 0.45;
        tank.angle = pData.angle || 0;

        // Ensure tank is in this.game.tanks array even if tanks array was reset!
        if (!this.game.tanks.includes(tank)) {
          this.game.tanks.push(tank);
        }
      }
    });

    // Remove disconnected remote tanks
    this.remoteTanksMap.forEach((tank, id) => {
      if (!currentRemoteIds.has(id)) {
        const idx = this.game.tanks.indexOf(tank);
        if (idx !== -1) this.game.tanks.splice(idx, 1);
        this.remoteTanksMap.delete(id);
      }
    });
  }

  syncShapes(shapesData) {
    if (!this.game || !this.shapesMap.size) {
      if (shapesData && shapesData.length) this.initShapes(shapesData);
      return;
    }

    shapesData.forEach(sData => {
      const shape = this.shapesMap.get(sData.id);
      if (shape) {
        shape.pos.x = sData.x;
        shape.pos.y = sData.y;
        shape.health = sData.hp;
        shape.maxHealth = sData.maxHp;
      }
    });
  }

  syncBullets(bulletsData) {
    if (!this.game) return;

    const currentBulletIds = new Set();
    const activeBullets = [];

    bulletsData.forEach(bData => {
      currentBulletIds.add(bData.id);

      let bullet = this.bulletsMap.get(bData.id);
      if (!bullet) {
        bullet = new Bullet(bData.x, bData.y, bData.vx, bData.vy, bData.radius, 15, 20, 10, null, bData.color);
        bullet.id = bData.id;
        this.bulletsMap.set(bData.id, bullet);
        activeBullets.push(bullet);
      } else {
        bullet.pos.x = bData.x;
        bullet.pos.y = bData.y;
        activeBullets.push(bullet);
      }
    });

    this.bulletsMap.forEach((bullet, id) => {
      if (!currentBulletIds.has(id)) {
        this.bulletsMap.delete(id);
      }
    });

    this.game.bullets = activeBullets;
  }

  sendInput(player) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && player) {
      this.ws.send(JSON.stringify({
        type: 'INPUT',
        x: player.pos.x,
        y: player.pos.y,
        angle: player.angle,
        radius: player.radius,
        level: player.level,
        score: player.score,
        classId: player.classInfo.id,
        name: player.name,
        color: player.color
      }));
    }
  }

  sendShoot(x, y, vx, vy, radius, color) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'SHOOT',
        x, y, vx, vy, radius, color
      }));
    }
  }

  sendRespawn(x, y) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'RESPAWN',
        x, y
      }));
    }
  }

  teleportToNearestPlayer() {
    if (!this.game.player || this.remoteTanksMap.size === 0) return false;
    const firstRemote = this.remoteTanksMap.values().next().value;
    if (firstRemote) {
      this.game.player.pos.x = firstRemote.pos.x + 100;
      this.game.player.pos.y = firstRemote.pos.y + 100;
      return true;
    }
    return false;
  }
}
