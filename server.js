const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8080;

// Serve static game files with Cache-Control no-cache header to prevent browser caching!
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Multiplayer Arena State
const ARENA_WIDTH = 7000;
const ARENA_HEIGHT = 7000;

const clients = new Map();
const players = new Map();
let shapes = [];
let bullets = [];

// Deterministic Seeded Shape Generator
function initShapes() {
  shapes = [];
  for (let i = 0; i < 350; i++) {
    const shapeType = i < 6 ? 'alpha_pentagon' : (i < 70 ? 'pentagon' : (i < 200 ? 'triangle' : 'square'));
    const radius = shapeType === 'alpha_pentagon' ? 75 : (shapeType === 'pentagon' ? 30 : (shapeType === 'triangle' ? 20 : 16));
    const hp = shapeType === 'alpha_pentagon' ? 1000 : (shapeType === 'pentagon' ? 100 : (shapeType === 'triangle' ? 30 : 10));
    
    const seedX = (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
    const seedY = (Math.cos(i * 12.9898 + 78.233) * 43758.5453) % 1;
    const x = 100 + Math.abs(seedX) * (ARENA_WIDTH - 200);
    const y = 100 + Math.abs(seedY) * (ARENA_HEIGHT - 200);

    const vx = (Math.sin(i * 45.12) * 0.4);
    const vy = (Math.cos(i * 45.12) * 0.4);

    shapes.push({
      id: `s_${i}`,
      x, y, vx, vy,
      type: shapeType,
      radius, hp, maxHp: hp,
      color: shapeType === 'square' ? '#ffe869' : (shapeType === 'triangle' ? '#fc5e5e' : '#5582ff')
    });
  }
}
initShapes();

// WebSocket Handler
wss.on('connection', (ws) => {
  const playerId = `player_${Math.floor(10000 + Math.random() * 90000)}`;
  clients.set(ws, playerId);

  ws.send(JSON.stringify({
    type: 'INIT',
    id: playerId,
    arenaWidth: ARENA_WIDTH,
    arenaHeight: ARENA_HEIGHT,
    shapes
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'JOIN' || data.type === 'RESPAWN') {
        let player = players.get(playerId);
        if (!player) {
          player = {
            id: playerId,
            name: data.name || 'Tank',
            color: data.color || '#00b2e7',
            x: data.x || (3000 + Math.random() * 1000),
            y: data.y || (3000 + Math.random() * 1000),
            radius: 26,
            angle: 0,
            score: 0,
            level: 1,
            hp: 100,
            maxHp: 100,
            classId: 'basic',
            lastShootTime: 0,
            equippedSkinId: data.equippedSkinId || null,
            equippedEffectId: data.equippedEffectId || null,
            equippedPetId: data.equippedPetId || null
          };
          players.set(playerId, player);
        } else {
          player.hp = 100;
          player.maxHp = 100;
          player.x = data.x || (3000 + Math.random() * 1000);
          player.y = data.y || (3000 + Math.random() * 1000);
          player.score = 0;
          player.level = 1;
          player.classId = 'basic';
          if (data.name) player.name = data.name;
          if (data.color) player.color = data.color;
          if (data.equippedSkinId) player.equippedSkinId = data.equippedSkinId;
          if (data.equippedEffectId) player.equippedEffectId = data.equippedEffectId;
          if (data.equippedPetId) player.equippedPetId = data.equippedPetId;
        }
      } else if (data.type === 'INPUT') {
        let player = players.get(playerId);
        if (!player && data.name) {
          player = {
            id: playerId,
            name: data.name || 'Tank',
            color: data.color || '#00b2e7',
            x: data.x || 3500,
            y: data.y || 3500,
            radius: 26,
            angle: 0,
            score: 0,
            level: 1,
            hp: 100,
            maxHp: 100,
            classId: 'basic',
            lastShootTime: 0,
            equippedSkinId: data.equippedSkinId || null,
            equippedEffectId: data.equippedEffectId || null,
            equippedPetId: data.equippedPetId || null
          };
          players.set(playerId, player);
        }
        if (player) {
          player.x = data.x ?? player.x;
          player.y = data.y ?? player.y;
          player.angle = data.angle ?? player.angle;
          player.radius = data.radius ?? player.radius;
          player.level = data.level ?? player.level;
          player.score = data.score ?? player.score;
          player.classId = data.classId ?? player.classId;
          player.equippedSkinId = data.equippedSkinId ?? player.equippedSkinId;
          player.equippedEffectId = data.equippedEffectId ?? player.equippedEffectId;
          player.equippedPetId = data.equippedPetId ?? player.equippedPetId;
          if (data.name) player.name = data.name;
          if (data.color) player.color = data.color;
        }
      } else if (data.type === 'SHOOT') {
        const player = players.get(playerId);
        const now = Date.now();
        // Enforce minimum 80ms reload cooldown per player on server!
        if (player && now - (player.lastShootTime || 0) < 80) {
          return;
        }
        if (player) player.lastShootTime = now;

        const radius = data.radius || 8;
        bullets.push({
          id: `b_${Math.floor(100000 + Math.random() * 900000)}`,
          x: data.x,
          y: data.y,
          vx: data.vx,
          vy: data.vy,
          radius,
          color: data.color || '#00b2e7',
          ownerId: playerId,
          life: 80,
          hp: radius * 3.5
        });
      }
    } catch (e) {}
  });

  ws.onclose = () => {
    clients.delete(ws);
    players.delete(playerId);
  });
});

// 60 Hz Server Physics Loop
setInterval(() => {
  shapes.forEach((s) => {
    s.x += s.vx;
    s.y += s.vy;
    if (s.x < 100 || s.x > ARENA_WIDTH - 100) s.vx = -s.vx;
    if (s.y < 100 || s.y > ARENA_HEIGHT - 100) s.vy = -s.vy;
  });

  players.forEach((p) => {
    if (p.classId === 'arena_closer') return;

    shapes.forEach((s) => {
      const dx = s.x - p.x;
      const dy = s.y - p.y;
      const distSq = dx * dx + dy * dy;
      const minDist = p.radius + s.radius;

      if (distSq < minDist * minDist && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;

        s.x += nx * overlap * 0.35;
        s.y += ny * overlap * 0.35;
        p.x -= nx * overlap * 0.35;
        p.y -= ny * overlap * 0.35;

        p.hp = Math.max(0, p.hp - 0.4);
        s.hp -= 10;

        if (s.hp <= 0) {
          s.x = 100 + Math.random() * (ARENA_WIDTH - 200);
          s.y = 100 + Math.random() * (ARENA_HEIGHT - 200);
          s.hp = s.maxHp;
          const xpAwarded = s.type === 'alpha_pentagon' ? 3000 : (s.type === 'pentagon' ? 130 : (s.type === 'triangle' ? 25 : 10));
          p.score += xpAwarded;
        }
      }
    });
  });

  // Bullets
  const newBullets = [];
  bullets.forEach((b) => {
    b.x += b.vx;
    b.y += b.vy;
    b.life -= 1;

    if (b.life > 0 && b.hp > 0 && b.x >= 0 && b.x <= ARENA_WIDTH && b.y >= 0 && b.y <= ARENA_HEIGHT) {
      players.forEach((targetP, targetId) => {
        if (targetId !== b.ownerId && targetP.classId !== 'arena_closer') {
          const dx = targetP.x - b.x;
          const dy = targetP.y - b.y;
          if (dx * dx + dy * dy < (targetP.radius + b.radius) ** 2) {
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = dx / dist;
            const ny = dy / dist;

            targetP.x += nx * 2;
            targetP.y += ny * 2;
            b.vx -= nx * 2;
            b.vy -= ny * 2;

            const dmg = b.radius > 20 ? 18 : 10;
            targetP.hp = Math.max(0, targetP.hp - dmg);
            b.hp -= 20;

            if (targetP.hp <= 0) {
              const shooter = players.get(b.ownerId);
              if (shooter) shooter.score += Math.floor(targetP.score * 0.5) + 500;
            }
          }
        }
      });

      const shooter = players.get(b.ownerId);
      const isAc = shooter && shooter.classId === 'arena_closer';
      const dmg = isAc ? 500 : (b.radius > 18 ? 30 : 18);

      shapes.forEach((s) => {
        const dx = s.x - b.x;
        const dy = s.y - b.y;
        if (dx * dx + dy * dy < (s.radius + b.radius) ** 2) {
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;

          s.x += nx * 1.5;
          s.y += ny * 1.5;
          b.vx -= nx * 2.0;
          b.vy -= ny * 2.0;

          s.hp -= dmg;
          const targetDensity = s.type === 'alpha_pentagon' ? 40 : (s.type === 'pentagon' ? 20 : (s.type === 'triangle' ? 12 : 8));
          b.hp -= targetDensity;

          if (s.hp <= 0) {
            s.x = 100 + Math.random() * (ARENA_WIDTH - 200);
            s.y = 100 + Math.random() * (ARENA_HEIGHT - 200);
            s.hp = s.maxHp;
            if (shooter) {
              const xpAwarded = s.type === 'alpha_pentagon' ? 3000 : (s.type === 'pentagon' ? 130 : (s.type === 'triangle' ? 25 : 10));
              shooter.score += xpAwarded;
            }
          }
        }
      });

      if (b.hp > 0 && b.life > 0) {
        newBullets.push(b);
      }
    }
  });
  bullets = newBullets;

  const snapshot = JSON.stringify({
    type: 'UPDATE',
    players: Array.from(players.values()),
    shapes,
    bullets
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(snapshot);
    }
  });
}, 16);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] PolyTanks running on port ${PORT}`);
});
