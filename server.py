import asyncio
import json
import random
import math
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import websockets

HTTP_PORT = 8080
WS_PORT = 8765
ARENA_WIDTH = 7000
ARENA_HEIGHT = 7000

clients = set()
players = {}
shapes = []
bullets = []

def init_shapes():
    global shapes
    shapes = []
    rng = random.Random(42)
    for i in range(350):
        shape_type = 'alpha_pentagon' if i < 6 else ('pentagon' if i < 70 else ('triangle' if i < 200 else 'square'))
        radius = 75 if shape_type == 'alpha_pentagon' else (30 if shape_type == 'pentagon' else (20 if shape_type == 'triangle' else 16))
        hp = 1000 if shape_type == 'alpha_pentagon' else (100 if shape_type == 'pentagon' else (30 if shape_type == 'triangle' else 10))
        
        vx = math.sin(i * 45.12) * 0.4
        vy = math.cos(i * 45.12) * 0.4

        shapes.append({
            'id': f"s_{i}",
            'x': rng.uniform(100, ARENA_WIDTH - 100),
            'y': rng.uniform(100, ARENA_HEIGHT - 100),
            'vx': vx,
            'vy': vy,
            'type': shape_type,
            'radius': radius,
            'hp': hp,
            'maxHp': hp,
            'color': '#ffe869' if shape_type == 'square' else ('#fc5e5e' if shape_type == 'triangle' else '#5582ff')
        })

init_shapes()

class GameHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def start_http_server():
    server_address = ('', HTTP_PORT)
    httpd = HTTPServer(server_address, GameHTTPRequestHandler)
    print(f"[SERVER] HTTP Game Server running on http://localhost:{HTTP_PORT}")
    httpd.serve_forever()

http_thread = threading.Thread(target=start_http_server, daemon=True)
http_thread.start()

async def handler(websocket):
    player_id = f"player_{random.randint(10000, 99999)}"
    clients.add(websocket)

    init_msg = json.dumps({
        'type': 'INIT',
        'id': player_id,
        'arenaWidth': ARENA_WIDTH,
        'arenaHeight': ARENA_HEIGHT,
        'shapes': shapes
    })
    await websocket.send(init_msg)

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                msg_type = data.get('type')

                if msg_type in ('JOIN', 'RESPAWN'):
                    p = players.get(player_id)
                    if not p:
                        players[player_id] = {
                            'id': player_id,
                            'name': data.get('name', 'Tank'),
                            'color': data.get('color', '#00b2e7'),
                            'x': data.get('x', random.uniform(3000, 4000)),
                            'y': data.get('y', random.uniform(3000, 4000)),
                            'radius': 26,
                            'angle': 0,
                            'score': 0,
                            'level': 1,
                            'hp': 100,
                            'maxHp': 100,
                            'classId': 'basic',
                            'equippedSkinId': data.get('equippedSkinId'),
                            'equippedEffectId': data.get('equippedEffectId'),
                            'equippedPetId': data.get('equippedPetId')
                        }
                    else:
                        p['hp'] = 100
                        p['maxHp'] = 100
                        p['x'] = data.get('x', random.uniform(3000, 4000))
                        p['y'] = data.get('y', random.uniform(3000, 4000))
                        p['score'] = 0
                        p['level'] = 1
                        p['classId'] = 'basic'
                        if data.get('name'): p['name'] = data.get('name')
                        if data.get('color'): p['color'] = data.get('color')
                        if data.get('equippedSkinId'): p['equippedSkinId'] = data.get('equippedSkinId')
                        if data.get('equippedEffectId'): p['equippedEffectId'] = data.get('equippedEffectId')
                        if data.get('equippedPetId'): p['equippedPetId'] = data.get('equippedPetId')

                elif msg_type == 'INPUT':
                    p = players.get(player_id)
                    if not p and data.get('name'):
                        p = {
                            'id': player_id,
                            'name': data.get('name', 'Tank'),
                            'color': data.get('color', '#00b2e7'),
                            'x': data.get('x', 3500),
                            'y': data.get('y', 3500),
                            'radius': 26,
                            'angle': 0,
                            'score': 0,
                            'level': 1,
                            'hp': 100,
                            'maxHp': 100,
                            'classId': 'basic',
                            'equippedSkinId': data.get('equippedSkinId'),
                            'equippedEffectId': data.get('equippedEffectId'),
                            'equippedPetId': data.get('equippedPetId')
                        }
                        players[player_id] = p
                    if p:
                        p['x'] = data.get('x', p['x'])
                        p['y'] = data.get('y', p['y'])
                        p['angle'] = data.get('angle', p['angle'])
                        p['radius'] = data.get('radius', p['radius'])
                        p['level'] = data.get('level', p['level'])
                        p['score'] = data.get('score', p['score'])
                        p['classId'] = data.get('classId', p['classId'])
                        p['equippedSkinId'] = data.get('equippedSkinId', p.get('equippedSkinId'))
                        p['equippedEffectId'] = data.get('equippedEffectId', p.get('equippedEffectId'))
                        p['equippedPetId'] = data.get('equippedPetId', p.get('equippedPetId'))
                        if data.get('name'): p['name'] = data.get('name')
                        if data.get('color'): p['color'] = data.get('color')

                elif msg_type == 'SHOOT':
                    radius = data.get('radius', 8)
                    bullets.append({
                        'id': f"b_{random.randint(100000, 999999)}",
                        'x': data.get('x'),
                        'y': data.get('y'),
                        'vx': data.get('vx'),
                        'vy': data.get('vy'),
                        'radius': radius,
                        'color': data.get('color', '#00b2e7'),
                        'ownerId': player_id,
                        'life': 80,
                        'hp': radius * 3.5
                    })
            except Exception:
                pass
    except Exception:
        pass
    finally:
        clients.discard(websocket)
        if player_id in players:
            del players[player_id]

async def broadcast_loop():
    global bullets
    rng = random.Random()

    while True:
        # Ambient shape drift
        for s in shapes:
            s['x'] += s.get('vx', 0)
            s['y'] += s.get('vy', 0)
            if s['x'] < 100 or s['x'] > ARENA_WIDTH - 100: s['vx'] = -s.get('vx', 0)
            if s['y'] < 100 or s['y'] > ARENA_HEIGHT - 100: s['vy'] = -s.get('vy', 0)

        # Soft Pleasant Tank-Shape Ramming
        for p_id, p in players.items():
            if p.get('classId') == 'arena_closer': continue

            for s in shapes:
                dx = s['x'] - p['x']
                dy = s['y'] - p['y']
                dist_sq = dx*dx + dy*dy
                min_dist = p['radius'] + s['radius']

                if dist_sq < min_dist * min_dist and dist_sq > 0:
                    dist = math.sqrt(dist_sq)
                    nx = dx / dist
                    ny = dy / dist
                    overlap = min_dist - dist

                    s['x'] += nx * overlap * 0.35
                    s['y'] += ny * overlap * 0.35
                    p['x'] -= nx * overlap * 0.35
                    p['y'] -= ny * overlap * 0.35

                    p['hp'] = max(0, p['hp'] - 0.4)
                    s['hp'] -= 10
                    if s['hp'] <= 0:
                        s['x'] = rng.uniform(100, ARENA_WIDTH - 100)
                        s['y'] = rng.uniform(100, ARENA_HEIGHT - 100)
                        s['hp'] = s['maxHp']
                        xp_awarded = 3000 if s['type'] == 'alpha_pentagon' else (130 if s['type'] == 'pentagon' else (25 if s['type'] == 'triangle' else 10))
                        p['score'] += xp_awarded

        # Bullet Health & Piercing Mechanics
        new_bullets = []
        for b in bullets:
            b['x'] += b['vx']
            b['y'] += b['vy']
            b['life'] -= 1

            if b['life'] > 0 and b.get('hp', 10) > 0 and 0 <= b['x'] <= ARENA_WIDTH and 0 <= b['y'] <= ARENA_HEIGHT:
                # PVP Player Damage
                for target_id, target_p in players.items():
                    if target_id != b['ownerId'] and target_p.get('classId') != 'arena_closer':
                        p_dx = target_p['x'] - b['x']
                        p_dy = target_p['y'] - b['y']
                        if p_dx*p_dx + p_dy*p_dy < (target_p['radius'] + b['radius'])**2:
                            dmg = 18 if b.get('radius', 8) > 20 else 10
                            target_p['hp'] = max(0, target_p['hp'] - dmg)
                            b['hp'] -= 20
                            if target_p['hp'] <= 0:
                                shooter = players.get(b['ownerId'])
                                if shooter: shooter['score'] += int(target_p['score'] * 0.5) + 500
                            break

                # Shape Damage & Bullet HP Subtraction
                shooter = players.get(b['ownerId'])
                is_ac = shooter and shooter.get('classId') == 'arena_closer'
                bullet_dmg = 500 if is_ac else (30 if b.get('radius', 8) > 18 else 18)

                for s in shapes:
                    dx = s['x'] - b['x']
                    dy = s['y'] - b['y']
                    if dx*dx + dy*dy < (s['radius'] + b['radius'])**2:
                        s['hp'] -= bullet_dmg
                        target_density = 40 if s['type'] == 'alpha_pentagon' else (20 if s['type'] == 'pentagon' else (12 if s['type'] == 'triangle' else 8))
                        b['hp'] -= target_density
                        if s['hp'] <= 0:
                            s['x'] = rng.uniform(100, ARENA_WIDTH - 100)
                            s['y'] = rng.uniform(100, ARENA_HEIGHT - 100)
                            s['hp'] = s['maxHp']
                            if shooter:
                                xp_awarded = 3000 if s['type'] == 'alpha_pentagon' else (130 if s['type'] == 'pentagon' else (25 if s['type'] == 'triangle' else 10))
                                shooter['score'] += xp_awarded

                if b.get('hp', 0) > 0 and b['life'] > 0:
                    new_bullets.append(b)

        bullets = new_bullets

        if clients:
            snapshot = json.dumps({
                'type': 'UPDATE',
                'players': list(players.values()),
                'shapes': shapes,
                'bullets': bullets
            })
            websockets.broadcast(clients, snapshot)

        await asyncio.sleep(0.016)

async def main():
    async with websockets.serve(handler, "0.0.0.0", WS_PORT):
        await broadcast_loop()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
