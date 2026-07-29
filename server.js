const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8080;

// Serve static game files
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
    
    // Seeded placement
    const seedX = (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
    const seedY = (Math.cos(i * 12.9898 + 78.233) * 43758.5453) % 1;
    const x = 100 + Math.abs(seedX) * (ARENA_WIDTH - 200);
    const y = 100 + Math.abs(seedY) * (ARENA_HEIGHT - 200);

    shapes.push({
      id: `s_${i}`,
      x, y,
      type: shapeType,
      radius, hp, maxHp: hp,
      color: shapeType === 'square' ? '#ffe869' : (shapeType === 'triangle' ? '#fc5e5e' : '#5582ff')
    });
  }
}
initShapes();

// WebSocket Handler
wss.on('connection', (ws) => {
  const playerId = `player_${Math.floor(1000 + Math.random() * 9000)}`;
  
  const player = {
    id: playerId,
    name: 'Pilot',
    color: '#00b2e7',
    x: 1000 + Math.random() * (ARENA_WIDTH - 2000),
    y: 1000 + Math.random() * (ARENA_HEIGHT - 2000),
    radius: 26,
    angle: 0,
    score: 0,
    level: 1,
    hp: 100,
    maxHp: 100,
    classId: 'basic'
  };

  clients.set(ws, playerId);
  players.set(playerId, player);

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
      
      if (data.type === 'INPUT') {
        player.x = data.x ?? player.x;
        player.y = data.y ?? player.y;
        player.angle = data.angle ?? player.angle;
        player.radius = data.radius ?? player.radius;
        player.level = data.level ?? player.level;
        player.score = data.score ?? player.score;
        player.classId = data.classId ?? player.classId;
        if (data.name) player.name = data.name;
        if (data.color) player.color = data.color;
      } else if (data.type === 'RESPAWN') {
        player.hp = 100;
        player.maxHp = 100;
        player.x = data.x || (1000 + Math.random() * (ARENA_WIDTH - 2000));
        player.y = data.y || (1000 + Math.random() * (ARENA_HEIGHT - 2000));
        player.score = 0;
        player.level = 1;
        player.classId = 'basic';
      } else if (data.type === 'SHOOT') {
        bullets.push({
          id: `b_${Math.floor(100000 + Math.random() * 900000)}`,
          x: data.x,
          y: data.y,
          vx: data.vx,
          vy: data.vy,
          radius: data.radius || 8,
          color: data.color || '#00b2e7',
          ownerId: playerId,
          life: 80
        });
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    clients.delete(ws);
    players.delete(playerId);
  });
});

// 60 Hz Server Simulation Loop
setInterval(() => {
  // 1. Tank-Shape Ramming & Collisions
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

        s.x += nx * overlap * 0.5;
        s.y += ny * overlap * 0.5;

        p.hp = Math.max(0, p.hp - 1);
        s.hp -= 20;

        if (s.hp <= 0) {
          s.x = 100 + Math.random() * (ARENA_WIDTH - 200);
          s.y = 100 + Math.random() * (ARENA_HEIGHT - 200);
          s.hp = s.maxHp;
          p.score += 100;
        }
      }
    });
  });

  // 2. Bullets & PVP Collisions
  const newBullets = [];
  bullets.forEach((b) => {
    b.x += b.vx;
    b.y += b.vy;
    b.life -= 1;

    if (b.life > 0 && b.x >= 0 && b.x <= ARENA_WIDTH && b.y >= 0 && b.y <= ARENA_HEIGHT) {
      let hit = false;

      // PVP Damage
      players.forEach((targetP, targetId) => {
        if (targetId !== b.ownerId && targetP.classId !== 'arena_closer') {
          const dx = targetP.x - b.x;
          const dy = targetP.y - b.y;
          if (dx * dx + dy * dy < (targetP.radius + b.radius) ** 2) {
            const dmg = b.radius > 20 ? 35 : 18;
            targetP.hp = Math.max(0, targetP.hp - dmg);
            hit = true;
            if (targetP.hp <= 0) {
              const shooter = players.get(b.ownerId);
              if (shooter) shooter.score += Math.floor(targetP.score * 0.5) + 500;
            }
          }
        }
      });

      if (!hit) {
        // Shape Damage
        const shooter = players.get(b.ownerId);
        const isAc = shooter && shooter.classId === 'arena_closer';
        const dmg = isAc ? 500 : (b.radius > 18 ? 60 : 35);

        shapes.forEach((s) => {
          const dx = s.x - b.x;
          const dy = s.y - b.y;
          if (dx * dx + dy * dy < (s.radius + b.radius) ** 2) {
            s.hp -= dmg;
            hit = true;
            if (s.hp <= 0) {
              s.x = 100 + Math.random() * (ARENA_WIDTH - 200);
              s.y = 100 + Math.random() * (ARENA_HEIGHT - 200);
              s.hp = s.maxHp;
              if (shooter) shooter.score += 100;
            }
          }
        });
      }

      if (!hit) newBullets.push(b);
    }
  });
  bullets = newBullets;

  // Broadcast Snapshot
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

// Listen on 0.0.0.0 and PORT for Render.com
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 PolyTanks Server running on port ${PORT}`);
});
