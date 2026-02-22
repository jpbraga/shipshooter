import { Container, Graphics } from 'pixi.js';

interface ParallaxLayer {
  container: Container;
  speed: number;
  elements: BackgroundElement[];
}

interface BackgroundElement {
  graphic: Graphics;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'star' | 'nebula' | 'asteroid' | 'ship' | 'debris' | 'planet';
  speed?: number;
  data?: any;
}

interface BackgroundShip {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'carrier' | 'destroyer' | 'fighter';
  targetX: number;
  targetY: number;
  health: number;
  maxHealth: number;
  fireTimer: number;
  fireRate: number;
  allied: boolean;
  speed: number;
  ai?: {
    state: 'patrol' | 'engage' | 'retreat';
    target?: BackgroundShip;
  };
  destroyed: boolean;
  explosionTimer: number;
  time: number;
}

export class ParallaxBackground {
  private layers: ParallaxLayer[] = [];
  private container: Container;
  private gameWidth: number;
  private gameHeight: number;
  private backgroundShips: BackgroundShip[] = [];
  private backgroundBullets: { x: number; y: number; vx: number; vy: number; allied: boolean; graphic: Graphics }[] = [];
  private bulletsContainer: Container;
  
  constructor(container: Container, gameWidth: number, gameHeight: number) {
    this.container = container;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    
    this.bulletsContainer = new Container();
    container.addChild(this.bulletsContainer);
    
    this.createLayers();
    this.createBackgroundShips();
  }
  
  private createLayers(): void {
    const layerConfigs = [
      { speed: 10, depth: 5 },
      { speed: 25, depth: 4 },
      { speed: 50, depth: 3 },
      { speed: 100, depth: 2 },
      { speed: 180, depth: 1 },
    ];
    
    for (const config of layerConfigs) {
      const layerContainer = new Container();
      this.container.addChild(layerContainer);
      
      const layer: ParallaxLayer = {
        container: layerContainer,
        speed: config.speed,
        elements: [],
      };
      
      this.layers.push(layer);
      this.populateLayer(layer, config.depth);
    }
  }
  
  private populateLayer(layer: ParallaxLayer, depth: number): void {
    const alpha = 0.15 + (5 - depth) * 0.12;
    
    switch (depth) {
      case 5:
        this.createDeepStars(layer, alpha);
        this.createNebulae(layer, alpha * 0.5);
        break;
      case 4:
        this.createMidStars(layer, alpha);
        this.createDistantPlanet(layer);
        break;
      case 3:
        this.createNearStars(layer, alpha);
        this.createAsteroidField(layer, 0.3);
        break;
      case 2:
        this.createDebris(layer, alpha);
        break;
      case 1:
        // Speed streaks for motion blur effect
        for (let i = 0; i < 15; i++) {
          const graphic = new Graphics();
          const x = Math.random() * this.gameWidth;
          const y = Math.random() * this.gameHeight;
          const length = 80 + Math.random() * 120;
          graphic.moveTo(0, -length / 2);
          graphic.lineTo(0, length / 2);
          graphic.stroke({ color: 0xffffff, alpha: 0.2 + Math.random() * 0.1, width: 1 + Math.random() });
          graphic.x = x;
          graphic.y = y;
          layer.container.addChild(graphic);
          layer.elements.push({
            graphic, x, y,
            width: 2, height: length,
            type: 'star' as const,
            speed: 1000 + Math.random() * 500,
          });
        }
        break;
    }
  }
  
  private createDeepStars(layer: ParallaxLayer, alpha: number): void {
    for (let i = 0; i < 80; i++) {
      const graphic = new Graphics();
      const x = Math.random() * this.gameWidth;
      const y = Math.random() * this.gameHeight;
      const size = 0.5 + Math.random() * 1;
      
      graphic.circle(0, 0, size);
      graphic.fill({ color: 0xffffff, alpha: alpha * (0.5 + Math.random() * 0.5) });
      graphic.x = x;
      graphic.y = y;
      
      layer.container.addChild(graphic);
      layer.elements.push({
        graphic,
        x,
        y,
        width: size,
        height: size,
        type: 'star',
        data: { twinkle: Math.random() * Math.PI * 2 },
      });
    }
  }
  
  private createNebulae(layer: ParallaxLayer, alpha: number): void {
    for (let i = 0; i < 3; i++) {
      const graphic = new Graphics();
      const x = Math.random() * this.gameWidth;
      const y = Math.random() * this.gameHeight;
      const width = 150 + Math.random() * 200;
      const height = 100 + Math.random() * 150;
      
      const colors = [0x4400ff, 0xff0066, 0x00ffaa, 0x6600ff];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      this.drawNebula(graphic, width, height, color, alpha);
      graphic.x = x;
      graphic.y = y;
      
      layer.container.addChild(graphic);
      layer.elements.push({
        graphic,
        x,
        y,
        width,
        height,
        type: 'nebula',
      });
    }
  }
  
  private drawNebula(graphic: Graphics, width: number, height: number, color: number, alpha: number): void {
    for (let i = 0; i < 5; i++) {
      const cx = (Math.random() - 0.5) * width * 0.3;
      const cy = (Math.random() - 0.5) * height * 0.3;
      const r = Math.min(width, height) * (0.3 + Math.random() * 0.4);
      
      graphic.circle(cx, cy, r);
      graphic.fill({ color, alpha: alpha * 0.3 });
    }
  }
  
  private createMidStars(layer: ParallaxLayer, alpha: number): void {
    for (let i = 0; i < 50; i++) {
      const graphic = new Graphics();
      const x = Math.random() * this.gameWidth;
      const y = Math.random() * this.gameHeight;
      const size = 1 + Math.random() * 1.5;
      
      graphic.circle(0, 0, size);
      graphic.fill({ color: 0xffffff, alpha });
      
      if (Math.random() > 0.7) {
        graphic.circle(0, 0, size * 2);
        graphic.fill({ color: 0xffffff, alpha: alpha * 0.3 });
      }
      
      graphic.x = x;
      graphic.y = y;
      
      layer.container.addChild(graphic);
      layer.elements.push({
        graphic,
        x,
        y,
        width: size,
        height: size,
        type: 'star',
      });
    }
  }
  
  private createDistantPlanet(layer: ParallaxLayer): void {
    if (Math.random() > 0.5) return;
    
    const graphic = new Graphics();
    const x = 100 + Math.random() * (this.gameWidth - 200);
    const y = Math.random() * this.gameHeight * 0.5;
    const radius = 40 + Math.random() * 60;
    
    const colors = [0xff4400, 0x4477ff, 0x88ff44, 0xff88ff];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    graphic.circle(0, 0, radius);
    graphic.fill({ color, alpha: 0.15 });
    
    graphic.circle(0, 0, radius * 0.8);
    graphic.fill({ color: 0x000000, alpha: 0.3 });
    
    graphic.moveTo(-radius * 0.3, -radius * 0.7);
    graphic.quadraticCurveTo(radius * 0.2, -radius, radius * 0.3, -radius * 0.6);
    graphic.stroke({ color: color, width: 2, alpha: 0.2 });
    
    graphic.x = x;
    graphic.y = y;
    
    layer.container.addChild(graphic);
    layer.elements.push({
      graphic,
      x,
      y,
      width: radius * 2,
      height: radius * 2,
      type: 'planet',
    });
  }
  
  private createNearStars(layer: ParallaxLayer, alpha: number): void {
    for (let i = 0; i < 30; i++) {
      const graphic = new Graphics();
      const x = Math.random() * this.gameWidth;
      const y = Math.random() * this.gameHeight;
      const size = 1.5 + Math.random() * 2;
      
      graphic.circle(0, 0, size);
      graphic.fill({ color: 0xffffff, alpha });
      
      graphic.moveTo(-size * 3, 0);
      graphic.lineTo(size * 3, 0);
      graphic.moveTo(0, -size * 3);
      graphic.lineTo(0, size * 3);
      graphic.stroke({ color: 0xffffff, alpha: alpha * 0.3, width: 0.5 });
      
      graphic.x = x;
      graphic.y = y;
      
      layer.container.addChild(graphic);
      layer.elements.push({
        graphic,
        x,
        y,
        width: size,
        height: size,
        type: 'star',
      });
    }
  }
  
  private createAsteroidField(layer: ParallaxLayer, alpha: number): void {
    for (let i = 0; i < 8; i++) {
      const graphic = new Graphics();
      const x = Math.random() * this.gameWidth;
      const y = Math.random() * this.gameHeight;
      const size = 10 + Math.random() * 20;
      
      this.drawAsteroid(graphic, size, alpha);
      graphic.x = x;
      graphic.y = y;
      graphic.rotation = Math.random() * Math.PI * 2;
      
      layer.container.addChild(graphic);
      layer.elements.push({
        graphic,
        x,
        y,
        width: size * 2,
        height: size * 2,
        type: 'asteroid',
        data: { rotationSpeed: (Math.random() - 0.5) * 0.5 },
      });
    }
  }
  
  private drawAsteroid(graphic: Graphics, size: number, alpha: number): void {
    const points = 8;
    
    graphic.moveTo(size, 0);
    for (let i = 1; i <= points; i++) {
      const angle = (Math.PI * 2 * i) / points;
      const r = size * (0.7 + Math.random() * 0.3);
      graphic.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    graphic.closePath();
    graphic.fill({ color: 0x665544, alpha });
    graphic.stroke({ color: 0x443322, alpha, width: 1 });
    
    for (let i = 0; i < 3; i++) {
      const cx = (Math.random() - 0.5) * size * 0.8;
      const cy = (Math.random() - 0.5) * size * 0.8;
      graphic.circle(cx, cy, size * 0.15);
      graphic.fill({ color: 0x332211, alpha: alpha * 0.5 });
    }
  }
  
  private createDebris(layer: ParallaxLayer, alpha: number): void {
    for (let i = 0; i < 15; i++) {
      const graphic = new Graphics();
      const x = Math.random() * this.gameWidth;
      const y = Math.random() * this.gameHeight;
      const size = 5 + Math.random() * 10;
      
      this.drawDebris(graphic, size, alpha);
      graphic.x = x;
      graphic.y = y;
      graphic.rotation = Math.random() * Math.PI * 2;
      
      layer.container.addChild(graphic);
      layer.elements.push({
        graphic,
        x,
        y,
        width: size * 2,
        height: size * 2,
        type: 'debris',
        data: { rotationSpeed: (Math.random() - 0.5) * 2 },
      });
    }
  }
  
  private drawDebris(graphic: Graphics, size: number, alpha: number): void {
    const metal = Math.random() > 0.5;
    const color = metal ? 0x667788 : 0x556655;
    
    graphic.moveTo(-size, -size * 0.3);
    graphic.lineTo(size * 0.4, -size * 0.8);
    graphic.lineTo(size * 0.7, size * 0.2);
    graphic.lineTo(-size * 0.2, size * 0.6);
    graphic.closePath();
    graphic.fill({ color, alpha });
    
    if (metal) {
      graphic.moveTo(-size * 0.3, -size * 0.5);
      graphic.lineTo(size * 0.2, -size * 0.2);
      graphic.stroke({ color: 0x99aabb, alpha: alpha * 0.5, width: 1 });
    }
  }
  
  private createBackgroundShips(): void {
    const ships: Array<Omit<BackgroundShip, 'time'>> = [
      { x: 150, y: -100, width: 300, height: 80, type: 'carrier', health: 100, maxHealth: 100, fireTimer: 0, fireRate: 2, allied: true, speed: 30, destroyed: false, explosionTimer: 0, targetX: 150, targetY: -100 },
      { x: this.gameWidth - 200, y: -200, width: 300, height: 80, type: 'carrier', health: 100, maxHealth: 100, fireTimer: 0, fireRate: 2, allied: false, speed: 30, destroyed: false, explosionTimer: 0, targetX: this.gameWidth - 200, targetY: -200 },
      { x: 400, y: -50, width: 120, height: 40, type: 'destroyer', health: 50, maxHealth: 50, fireTimer: 0, fireRate: 1.5, allied: true, speed: 40, destroyed: false, explosionTimer: 0, targetX: 400, targetY: -50 },
      { x: this.gameWidth - 400, y: -80, width: 120, height: 40, type: 'destroyer', health: 50, maxHealth: 50, fireTimer: 0, fireRate: 1.5, allied: false, speed: 40, destroyed: false, explosionTimer: 0, targetX: this.gameWidth - 400, targetY: -80 },
      { x: 600, y: -120, width: 60, height: 30, type: 'fighter', health: 20, maxHealth: 20, fireTimer: 0, fireRate: 0.8, allied: true, speed: 60, destroyed: false, explosionTimer: 0, targetX: 600, targetY: -120 },
      { x: 800, y: -180, width: 60, height: 30, type: 'fighter', health: 20, maxHealth: 20, fireTimer: 0, fireRate: 0.8, allied: false, speed: 60, destroyed: false, explosionTimer: 0, targetX: 800, targetY: -180 },
      { x: 100, y: -250, width: 60, height: 30, type: 'fighter', health: 20, maxHealth: 20, fireTimer: 0, fireRate: 0.8, allied: true, speed: 60, destroyed: false, explosionTimer: 0, targetX: 100, targetY: -250 },
      { x: this.gameWidth - 100, y: -300, width: 60, height: 30, type: 'fighter', health: 20, maxHealth: 20, fireTimer: 0, fireRate: 0.8, allied: false, speed: 60, destroyed: false, explosionTimer: 0, targetX: this.gameWidth - 100, targetY: -300 },
    ];
    
    this.backgroundShips = ships.map(s => ({ ...s, time: 0 }));
  }

  update(delta: number, _phase: number): void {
    for (const layer of this.layers) {
      for (const element of layer.elements) {
        let elemSpeed = layer.speed;
        if (element.speed) elemSpeed = element.speed;
        element.y += elemSpeed * delta;
        
        if (element.data?.rotationSpeed) {
          element.graphic.rotation += element.data.rotationSpeed * delta;
        }
        
        if (element.type === 'star' && element.data?.twinkle !== undefined) {
          element.data.twinkle += delta * 2;
          const twinkleAlpha = 0.3 + Math.sin(element.data.twinkle) * 0.2;
          element.graphic.alpha = twinkleAlpha;
        }
        
        if (element.y > this.gameHeight + 100) {
          element.y = -100;
          element.x = Math.random() * this.gameWidth;
        }
      }
    }
    
    this.updateBackgroundShips(delta);
    this.updateBackgroundBullets(delta);
  }
  
  private updateBackgroundShips(delta: number): void {
    for (const ship of this.backgroundShips) {
      ship.time += delta;
      
      ship.x += Math.sin(ship.time * 0.5) * 10 * delta;
      
      if (ship.y < 150) {
        ship.y += ship.speed * delta;
      }
      
      ship.fireTimer += delta;
      if (ship.fireTimer >= ship.fireRate && !ship.destroyed) {
        this.backgroundShipFire(ship);
        ship.fireTimer = 0;
      }
    }
  }
  
  private backgroundShipFire(ship: BackgroundShip): void {
    const target = this.backgroundShips.find(
      s => s.allied !== ship.allied && !s.destroyed && Math.abs(s.y - ship.y) < 200
    );
    
    if (!target) return;
    
    const dx = target.x - ship.x;
    const dy = target.y - ship.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;
    
    const bulletSpeed = 200;
    const vx = (dx / dist) * bulletSpeed;
    const vy = (dy / dist) * bulletSpeed;
    
    const graphic = new Graphics();
    graphic.circle(0, 0, 3);
    graphic.fill({ color: ship.allied ? 0x00ff88 : 0xff4400, alpha: 0.7 });
    graphic.x = ship.x;
    graphic.y = ship.y + ship.height / 2;
    this.bulletsContainer.addChild(graphic);
    
    this.backgroundBullets.push({
      x: ship.x,
      y: ship.y + ship.height / 2,
      vx,
      vy,
      allied: ship.allied,
      graphic,
    });
  }
  
  private updateBackgroundBullets(delta: number): void {
    const toRemove: number[] = [];
    
    for (let i = 0; i < this.backgroundBullets.length; i++) {
      const bullet = this.backgroundBullets[i];
      bullet.x += bullet.vx * delta;
      bullet.y += bullet.vy * delta;
      bullet.graphic.x = bullet.x;
      bullet.graphic.y = bullet.y;
      
      if (bullet.y < -50 || bullet.y > this.gameHeight + 50 ||
          bullet.x < -50 || bullet.x > this.gameWidth + 50) {
        toRemove.push(i);
        continue;
      }
      
      for (const ship of this.backgroundShips) {
        if (ship.destroyed || ship.allied === bullet.allied) continue;
        
        const dx = ship.x - bullet.x;
        const dy = ship.y - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < ship.width / 2) {
          ship.health -= 5;
          toRemove.push(i);
          
          if (ship.health <= 0) {
            ship.destroyed = true;
            ship.explosionTimer = 2;
          }
          break;
        }
      }
    }
    
    for (let i = toRemove.length - 1; i >= 0; i--) {
      const idx = toRemove[i];
      this.bulletsContainer.removeChild(this.backgroundBullets[idx].graphic);
      this.backgroundBullets[idx].graphic.destroy();
      this.backgroundBullets.splice(idx, 1);
    }
    
    for (const ship of this.backgroundShips) {
      if (ship.destroyed && ship.explosionTimer > 0) {
        ship.explosionTimer -= delta;
        ship.y += 20 * delta;
      }
    }
  }

  render(graphic: Graphics): void {
    graphic.clear();
    
    for (const ship of this.backgroundShips) {
      if (ship.destroyed) continue;
      
      this.drawBackgroundShip(graphic, ship);
    }
  }
  
  private drawBackgroundShip(graphic: Graphics, ship: BackgroundShip): void {
    const alpha = 0.25;
    const color = ship.allied ? 0x4488ff : 0xff4444;
    
    graphic.x = 0;
    graphic.y = 0;
    
    switch (ship.type) {
      case 'carrier':
        this.drawCarrier(graphic, ship, color, alpha);
        break;
      case 'destroyer':
        this.drawDestroyer(graphic, ship, color, alpha);
        break;
      case 'fighter':
        this.drawFighterShip(graphic, ship, color, alpha);
        break;
    }
  }
  
  private drawCarrier(graphic: Graphics, ship: BackgroundShip, color: number, alpha: number): void {
    const hw = ship.width / 2;
    const hh = ship.height / 2;
    
    graphic.moveTo(ship.x, ship.y - hh);
    graphic.lineTo(ship.x - hw * 0.8, ship.y);
    graphic.lineTo(ship.x - hw, ship.y + hh);
    graphic.lineTo(ship.x + hw, ship.y + hh);
    graphic.lineTo(ship.x + hw * 0.8, ship.y);
    graphic.closePath();
    graphic.fill({ color: 0x224466, alpha });
    graphic.stroke({ color, alpha: alpha * 0.8, width: 2 });
    
    graphic.rect(ship.x - hw * 0.6, ship.y - hh * 0.3, hw * 1.2, hh * 0.6);
    graphic.fill({ color: 0x334455, alpha: alpha * 1.2 });
    
    for (let i = -2; i <= 2; i++) {
      graphic.circle(ship.x + i * hw * 0.3, ship.y + hh * 0.5, 8);
      graphic.fill({ color, alpha: alpha * 0.6 });
    }
    
    graphic.moveTo(ship.x - hw * 0.7, ship.y - hh);
    graphic.lineTo(ship.x - hw * 0.5, ship.y - hh * 1.8);
    graphic.lineTo(ship.x - hw * 0.3, ship.y - hh);
    graphic.closePath();
    graphic.fill({ color: 0x224466, alpha });
    
    graphic.moveTo(ship.x + hw * 0.7, ship.y - hh);
    graphic.lineTo(ship.x + hw * 0.5, ship.y - hh * 1.8);
    graphic.lineTo(ship.x + hw * 0.3, ship.y - hh);
    graphic.closePath();
    graphic.fill({ color: 0x224466, alpha });
  }
  
  private drawDestroyer(graphic: Graphics, ship: BackgroundShip, color: number, alpha: number): void {
    const hw = ship.width / 2;
    const hh = ship.height / 2;
    
    graphic.moveTo(ship.x, ship.y - hh);
    graphic.lineTo(ship.x - hw, ship.y + hh * 0.5);
    graphic.lineTo(ship.x - hw * 0.5, ship.y + hh);
    graphic.lineTo(ship.x + hw * 0.5, ship.y + hh);
    graphic.lineTo(ship.x + hw, ship.y + hh * 0.5);
    graphic.closePath();
    graphic.fill({ color: 0x445566, alpha });
    graphic.stroke({ color, alpha: alpha * 0.8, width: 1 });
    
    graphic.circle(ship.x, ship.y, hh * 0.4);
    graphic.fill({ color: 0x556677, alpha: alpha * 1.2 });
    
    graphic.circle(ship.x, ship.y + hh * 0.7, 6);
    graphic.fill({ color, alpha: alpha * 0.7 });
  }
  
  private drawFighterShip(graphic: Graphics, ship: BackgroundShip, color: number, alpha: number): void {
    const hw = ship.width / 2;
    const hh = ship.height / 2;
    
    graphic.moveTo(ship.x, ship.y - hh);
    graphic.lineTo(ship.x - hw, ship.y + hh);
    graphic.lineTo(ship.x, ship.y + hh * 0.5);
    graphic.lineTo(ship.x + hw, ship.y + hh);
    graphic.closePath();
    graphic.fill({ color: 0x556677, alpha });
    graphic.stroke({ color, alpha: alpha * 0.8, width: 1 });
    
    graphic.circle(ship.x, ship.y + hh * 0.8, 4);
    graphic.fill({ color, alpha: alpha * 0.8 });
  }

  destroy(): void {
    for (const layer of this.layers) {
      for (const element of layer.elements) {
        element.graphic.destroy();
      }
      layer.container.destroy();
    }
    this.layers = [];
    
    for (const bullet of this.backgroundBullets) {
      bullet.graphic.destroy();
    }
    this.backgroundBullets = [];
    
    this.bulletsContainer.destroy();
  }
}
