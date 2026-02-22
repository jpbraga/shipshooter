import { Container, Graphics, BlurFilter } from 'pixi.js';

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
  type: 'explosion' | 'smoke' | 'spark' | 'debris' | 'trail' | 'engine';
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  friction: number;
  scale: number;
  scaleDecay: number;
  active: boolean;
}

export interface ExplosionConfig {
  x: number;
  y: number;
  radius: number;
  color: number;
  particleCount: number;
  type: 'small' | 'medium' | 'large' | 'boss';
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private graphics: Map<string, Graphics> = new Map();
  private container: Container;
  private nextId: number = 0;

  constructor(container: Container) {
    this.container = container;
  }

  createExplosion(config: ExplosionConfig): void {
    const { x, y, radius, color, particleCount, type } = config;
    
    const counts = {
      small: 15,
      medium: 30,
      large: 50,
      boss: 120,
    };
    
    const count = particleCount || counts[type];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = (radius * (2 + Math.random() * 3));
      
      this.addParticle({
        id: `exp_${this.nextId++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8 + Math.random() * 0.6,
        maxLife: 1.4,
        size: type === 'boss' ? 6 + Math.random() * 8 : 3 + Math.random() * 4,
        color: this.variateColor(color),
        alpha: 1,
        type: 'explosion',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10,
        gravity: 50,
        friction: 0.97,
        scale: 1,
        scaleDecay: 0.96,
        active: true,
      });
    }
    
    for (let i = 0; i < count * 0.3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = radius * (1 + Math.random() * 2);
      
      this.addParticle({
        id: `spark_${this.nextId++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6,
        size: 1 + Math.random() * 2,
        color: 0xffffff,
        alpha: 1,
        type: 'spark',
        rotation: 0,
        rotationSpeed: 0,
        gravity: 0,
        friction: 0.99,
        scale: 1,
        scaleDecay: 0.95,
        active: true,
      });
    }
    
    for (let i = 0; i < count * 0.2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = radius * (0.5 + Math.random());
      
      this.addParticle({
        id: `debris_${this.nextId++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1 + Math.random() * 0.5,
        maxLife: 1.5,
        size: 2 + Math.random() * 3,
        color: 0x888888,
        alpha: 0.9,
        type: 'debris',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 15,
        gravity: 100,
        friction: 0.98,
        scale: 1,
        scaleDecay: 0.98,
        active: true,
      });
    }
  }
  
  createSmoke(x: number, y: number, count: number = 5): void {
    for (let i = 0; i < count; i++) {
      this.addParticle({
        id: `smoke_${this.nextId++}`,
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 30,
        vy: -20 - Math.random() * 30,
        life: 1.5 + Math.random() * 1,
        maxLife: 2.5,
        size: 8 + Math.random() * 12,
        color: 0x666666,
        alpha: 0.4,
        type: 'smoke',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 2,
        gravity: -10,
        friction: 0.95,
        scale: 1,
        scaleDecay: 0.97,
        active: true,
      });
    }
  }
  
  createEngineTrail(x: number, y: number, color: number = 0x00aaff): void {
    this.addParticle({
      id: `trail_${this.nextId++}`,
      x: x + (Math.random() - 0.5) * 5,
      y,
      vx: (Math.random() - 0.5) * 20,
      vy: 50 + Math.random() * 30,
      life: 0.2 + Math.random() * 0.2,
      maxLife: 0.4,
      size: 2 + Math.random() * 3,
      color,
      alpha: 0.8,
      type: 'trail',
      rotation: 0,
      rotationSpeed: 0,
      gravity: 0,
      friction: 0.9,
      scale: 1,
      scaleDecay: 0.92,
      active: true,
    });
  }

  private addParticle(particle: Particle): void {
    this.particles.push(particle);
    
    const graphic = new Graphics();
    graphic.filters = [new BlurFilter({ strength: 0.5 })];
    graphic.alpha = particle.alpha;
    this.container.addChild(graphic);
    this.graphics.set(particle.id, graphic);
  }

  update(delta: number): void {
    const toRemove: string[] = [];
    
    for (const particle of this.particles) {
      if (!particle.active) continue;
      
      particle.life -= delta;
      
      if (particle.life <= 0) {
        particle.active = false;
        toRemove.push(particle.id);
        continue;
      }
      
      particle.vy += particle.gravity * delta;
      particle.vx *= particle.friction;
      particle.vy *= particle.friction;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.rotation += particle.rotationSpeed * delta;
      
      const lifeRatio = particle.life / particle.maxLife;
      particle.alpha = lifeRatio * (particle.type === 'smoke' ? 0.3 : 0.8);
      particle.scale *= particle.scaleDecay;
      
      const graphic = this.graphics.get(particle.id);
      if (graphic) {
        graphic.clear();
        graphic.x = particle.x;
        graphic.y = particle.y;
        graphic.alpha = particle.alpha;
        graphic.rotation = particle.rotation;
        
        const size = particle.size * particle.scale;
        
        switch (particle.type) {
          case 'explosion':
            this.drawExplosionParticle(graphic, size, particle.color, lifeRatio);
            break;
          case 'smoke':
            this.drawSmokeParticle(graphic, size);
            break;
          case 'spark':
            this.drawSparkParticle(graphic, size);
            break;
          case 'debris':
            this.drawDebrisParticle(graphic, size, particle.color);
            break;
          case 'trail':
            this.drawTrailParticle(graphic, size, particle.color);
            break;
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
      const idx = this.particles.findIndex(p => p.id === id);
      if (idx >= 0) {
        this.particles.splice(idx, 1);
      }
    }
  }

  private drawExplosionParticle(graphic: Graphics, size: number, color: number, lifeRatio: number): void {
    graphic.circle(0, 0, size);
    graphic.fill({ color, alpha: lifeRatio * 0.8 });
    
    graphic.circle(0, 0, size * 0.6);
    graphic.fill({ color: 0xffffff, alpha: lifeRatio * 0.4 });
  }
  
  private drawSmokeParticle(graphic: Graphics, size: number): void {
    graphic.circle(0, 0, size);
    graphic.fill({ color: 0x555555, alpha: 0.15 });
    
    graphic.circle(size * 0.3, -size * 0.3, size * 0.7);
    graphic.fill({ color: 0x666666, alpha: 0.1 });
  }
  
  private drawSparkParticle(graphic: Graphics, size: number): void {
    graphic.moveTo(-size * 2, 0);
    graphic.lineTo(size * 2, 0);
    graphic.stroke({ color: 0xffffff, width: 1 });
    
    graphic.circle(0, 0, size);
    graphic.fill({ color: 0xffffaa });
  }
  
  private drawDebrisParticle(graphic: Graphics, size: number, color: number): void {
    graphic.moveTo(-size, -size * 0.5);
    graphic.lineTo(size * 0.5, -size);
    graphic.lineTo(size, size * 0.3);
    graphic.lineTo(-size * 0.3, size);
    graphic.closePath();
    graphic.fill({ color });
    graphic.stroke({ color: 0x444444, width: 1 });
  }
  
  private drawTrailParticle(graphic: Graphics, size: number, color: number): void {
    graphic.ellipse(0, 0, size * 0.5, size);
    graphic.fill({ color, alpha: 0.6 });
    
    graphic.ellipse(0, 0, size * 0.3, size * 0.6);
    graphic.fill({ color: 0xffffff, alpha: 0.4 });
  }

  private variateColor(color: number): number {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    
    const vr = Math.min(255, Math.max(0, r + (Math.random() - 0.5) * 60));
    const vg = Math.min(255, Math.max(0, g + (Math.random() - 0.5) * 60));
    const vb = Math.min(255, Math.max(0, b + (Math.random() - 0.5) * 60));
    
    return (vr << 16) | (vg << 8) | vb;
  }

  destroy(): void {
    for (const graphic of this.graphics.values()) {
      graphic.destroy();
    }
    this.graphics.clear();
    this.particles = [];
  }
}
