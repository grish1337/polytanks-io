export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridSize = 48;
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  clear() {
    // Outer void background
    this.ctx.fillStyle = '#b8b8b8';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid(camera, arenaWidth, arenaHeight) {
    const ctx = this.ctx;
    const zoom = camera.zoom || 1.35;
    const effX = camera.EffectivePos.x;
    const effY = camera.EffectivePos.y;

    ctx.save();

    // 1. Clear outer void
    ctx.fillStyle = '#b8b8b8';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Project arena bounds to screen
    const screenLeft = (0 - effX) * zoom + this.canvas.width / 2;
    const screenTop = (0 - effY) * zoom + this.canvas.height / 2;
    const screenRight = (arenaWidth - effX) * zoom + this.canvas.width / 2;
    const screenBottom = (arenaHeight - effY) * zoom + this.canvas.height / 2;

    // 3. Draw arena playable surface
    const arenaDrawX = Math.max(0, screenLeft);
    const arenaDrawY = Math.max(0, screenTop);
    const arenaDrawW = Math.min(this.canvas.width, screenRight) - arenaDrawX;
    const arenaDrawH = Math.min(this.canvas.height, screenBottom) - arenaDrawY;

    if (arenaDrawW > 0 && arenaDrawH > 0) {
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(arenaDrawX, arenaDrawY, arenaDrawW, arenaDrawH);

      // 4. Draw Grid Lines seamlessly
      ctx.strokeStyle = '#cdcdcd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const startGridX = Math.floor(effX / this.gridSize) * this.gridSize;
      const startGridY = Math.floor(effY / this.gridSize) * this.gridSize;
      const visibleRangeX = Math.ceil((this.canvas.width / zoom) / this.gridSize) + 4;
      const visibleRangeY = Math.ceil((this.canvas.height / zoom) / this.gridSize) + 4;

      for (let gx = startGridX - visibleRangeX * this.gridSize; gx <= startGridX + visibleRangeX * this.gridSize; gx += this.gridSize) {
        if (gx >= 0 && gx <= arenaWidth) {
          const sx = (gx - effX) * zoom + this.canvas.width / 2;
          if (sx >= 0 && sx <= this.canvas.width) {
            ctx.moveTo(sx, Math.max(0, screenTop));
            ctx.lineTo(sx, Math.min(this.canvas.height, screenBottom));
          }
        }
      }

      for (let gy = startGridY - visibleRangeY * this.gridSize; gy <= startGridY + visibleRangeY * this.gridSize; gy += this.gridSize) {
        if (gy >= 0 && gy <= arenaHeight) {
          const sy = (gy - effY) * zoom + this.canvas.height / 2;
          if (sy >= 0 && sy <= this.canvas.height) {
            ctx.moveTo(Math.max(0, screenLeft), sy);
            ctx.lineTo(Math.min(this.canvas.width, screenRight), sy);
          }
        }
      }
      ctx.stroke();
    }

    // 5. Draw Arena Outer Wall Border
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 6 * zoom;
    ctx.strokeRect(screenLeft, screenTop, arenaWidth * zoom, arenaHeight * zoom);

    ctx.restore();
  }
}
