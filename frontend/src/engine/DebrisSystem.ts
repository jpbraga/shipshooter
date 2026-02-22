import { Container, Graphics, BlurFilter } from 'pixi.js';

export interface DebrisPiece {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  shape: number[][];
  alpha: number;
  active: boolean;
}

export interface WreckConfig {
  x: number;
  y: number;
  size: number;
  color: number;
  pieceCount: number;
}

export class DebrisSystem {
  private debris: DebrisPiece[] = [];
  private graphics: Map<string, Graphics> = new Map();
  private container: Container;
  private nextId: number = 0;

  constructor(container: Container) {
    this.container = container;
  }

  createWreck(config: WreckConfig): void {
    const { x, y, size, color, pieceCount } = config;
    
    for (let i = 0; i < pieceCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      const pieceSize = size * (0.2 + Math.random() * 0.5);
      
      const shape = this.generateDebrisShape(pieceSize);
      
      this.addDebris({
        id: `debris_${this.nextId++}`,
        x: x + (Math.random() - 0.5) * size * 0.5,
        y: y + (Math.random() - 0.5) * size * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 50,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 8,
        life: 1.0,
        maxLife: 1.0,
        size: pieceSize,
        color: this.variateColor(color),
        shape,
        alpha: 1,
        active: true,
      });
    }
    
    for (let i = 0; i < pieceCount * 0.3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      
      this.addDebris({
        id: `spark_${this.nextId++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 30,
        rotation: 0,
        rotationSpeed: 0,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        size: 2 + Math.random() * 3,
        color: 0xffffff,
        shape: [[0, 0]],
        alpha: 1,
        active: true,
      });
    }
  }

  private generateDebrisShape(size: number): number[][] {
    const points: number[][] = [];
    const sides = 3 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides + Math.random() * 0.5;
      const r = size * (0.5 + Math.random() * 0.5);
      points.push([Math.cos(angle) * r, Math.sin(angle) * r]);
    }
    
    return points;
  }

  private addDebris(debris: DebrisPiece): void {
    this.debris.push(debris);
    
    const graphic = new Graphics();
    graphic.filters = [new BlurFilter({ strength: 0.3 })];
    this.container.addChild(graphic);
    this.graphics.set(debris.id, graphic);
  }

  update(delta: number): void {
    const toRemove: string[] = [];
    
    for (const piece of this.debris) {
      if (!piece.active) continue;
      
      piece.life -= delta;
      
      if (piece.life <= 0) {
        piece.active = false;
        toRemove.push(piece.id);
        continue;
      }
      
      piece.vy += 150 * delta;
      piece.vx *= 0.99;
      piece.vy *= 0.99;
      piece.x += piece.vx * delta;
      piece.y += piece.vy * delta;
      piece.rotation += piece.rotationSpeed * delta;
      
      const lifeRatio = piece.life / piece.maxLife;
      piece.alpha = lifeRatio;
      
      const graphic = this.graphics.get(piece.id);
      if (graphic) {
        graphic.clear();
        graphic.x = piece.x;
        graphic.y = piece.y;
        graphic.alpha = piece.alpha;
        graphic.rotation = piece.rotation;
        
        if (piece.shape.length > 1) {
          graphic.moveTo(piece.shape[0][0], piece.shape[0][1]);
          for (let i = 1; i < piece.shape.length; i++) {
            graphic.lineTo(piece.shape[i][0], piece.shape[i][1]);
          }
          graphic.closePath();
          graphic.fill({ color: piece.color, alpha: 0.9 });
          graphic.stroke({ color: 0x222222, width: 1 });
        } else {
          graphic.circle(0, 0, piece.size);
          graphic.fill({ color: piece.color, alpha: 0.8 });
        }
      }
    }
    
    for (const id of toRemove) {
      const graphic = this.graphics.get(id);
      if (graphic) {
        this.container.removeChild(graphic);
        graphic.destroy();
        this.graphics.delete(id);
      }
      const idx = this.debris.findIndex(d => d.id === id);
      if (idx >= 0) {
        this.debris.splice(idx, 1);
      }
    }
  }

  private variateColor(color: number): number {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    
    const vr = Math.min(255, Math.max(0, r + (Math.random() - 0.5) * 40));
    const vg = Math.min(255, Math.max(0, g + (Math.random() - 0.5) * 40));
    const vb = Math.min(255, Math.max(0, b + (Math.random() - 0.5) * 40));
    
    return (vr << 16) | (vg << 8) | vb;
  }

  destroy(): void {
    for (const graphic of this.graphics.values()) {
      graphic.destroy();
    }
    this.graphics.clear();
    this.debris = [];
  }
}
