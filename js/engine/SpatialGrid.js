export class SpatialGrid {
  constructor(cellSize = 150) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  getKey(x, y) {
    const gx = Math.floor(x / this.cellSize);
    const gy = Math.floor(y / this.cellSize);
    return `${gx},${gy}`;
  }

  insert(entity) {
    const minGx = Math.floor((entity.pos.x - entity.radius) / this.cellSize);
    const maxGx = Math.floor((entity.pos.x + entity.radius) / this.cellSize);
    const minGy = Math.floor((entity.pos.y - entity.radius) / this.cellSize);
    const maxGy = Math.floor((entity.pos.y + entity.radius) / this.cellSize);

    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gy = minGy; gy <= maxGy; gy++) {
        const key = `${gx},${gy}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        this.grid.get(key).push(entity);
      }
    }
  }

  getNearby(entity) {
    const nearby = new Set();
    const minGx = Math.floor((entity.pos.x - entity.radius) / this.cellSize);
    const maxGx = Math.floor((entity.pos.x + entity.radius) / this.cellSize);
    const minGy = Math.floor((entity.pos.y - entity.radius) / this.cellSize);
    const maxGy = Math.floor((entity.pos.y + entity.radius) / this.cellSize);

    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gy = minGy; gy <= maxGy; gy++) {
        const key = `${gx},${gy}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            if (cell[i] !== entity) {
              nearby.add(cell[i]);
            }
          }
        }
      }
    }
    return Array.from(nearby);
  }
}
