import { Vector2D } from './Vector2D.js';

export class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.pos = new Vector2D(3500, 3500);
    this.targetPos = new Vector2D(3500, 3500);
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.zoom = 1.35; // Diep.io comfortable zoom level
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
    this.shakeOffset = new Vector2D(0, 0);
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  snapTo(x, y) {
    this.pos.x = x;
    this.pos.y = y;
    this.targetPos.x = x;
    this.targetPos.y = y;
  }

  shake(intensity) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  update(target, lerpFactor = 0.1) {
    if (target && target.pos) {
      const targetZoom = Math.max(0.9, 1.35 - ((target.level || 1) - 1) * 0.006);
      this.zoom += (targetZoom - this.zoom) * 0.05;

      this.targetPos.x = target.pos.x;
      this.targetPos.y = target.pos.y;
    }

    // Smooth camera lerp tracking
    this.pos.x += (this.targetPos.x - this.pos.x) * lerpFactor;
    this.pos.y += (this.targetPos.y - this.pos.y) * lerpFactor;

    // Screen shake
    if (this.shakeIntensity > 0.5) {
      this.shakeOffset.x = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeOffset.y = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeOffset.set(0, 0);
      this.shakeIntensity = 0;
    }
  }

  get EffectivePos() {
    return new Vector2D(this.pos.x + this.shakeOffset.x, this.pos.y + this.shakeOffset.y);
  }

  worldToScreen(worldX, worldY) {
    const screenX = (worldX - this.EffectivePos.x) * this.zoom + this.viewportWidth / 2;
    const screenY = (worldY - this.EffectivePos.y) * this.zoom + this.viewportHeight / 2;
    return { x: screenX, y: screenY };
  }

  screenToWorld(screenX, screenY) {
    const worldX = (screenX - this.viewportWidth / 2) / this.zoom + this.EffectivePos.x;
    const worldY = (screenY - this.viewportHeight / 2) / this.zoom + this.EffectivePos.y;
    return { x: worldX, y: worldY };
  }
}
