import { Container, Graphics } from 'pixi.js';

interface ParallaxLayer {
  container: Container;
  parallaxFactor: number;
  baseScrollSpeed: number;
  elements: BackgroundElement[];
}

interface BackgroundElement {
  graphic: Graphics;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'star' | 'nebula' | 'asteroid' | 'ship' | 'debris' | 'planet' | 'streak';
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
  private prevPlayerX: number = 0;
  // prevPlayerY removed - Y parallax disabled
  
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
    // Parallax layers: parallaxFactor 0 = far (slowest response), 1 = close (fastest response)
    // baseScrollSpeed: constant downward scroll to simulate ship moving forward through space
    // When player moves UP, layers scroll DOWN (opposite direction)
    // When player moves DOWN, layers scroll UP (opposite direction)
    // Layer 6 (deepest) - factor 0.05: Stars and nebulae (barely affected by player)
    // Layer 5 - factor 0.15: Distant planets
    // Layer 4 - factor 0.35: Asteroids
    // Layer 3 - factor 0.6: Background battle
    // Layer 1 (closest) - factor 1.0: Speed streaks (full response to player)
    
    const layerConfigs = [
      { parallaxFactor: 0.05, baseScrollSpeed: 15, depth: 6 },
      { parallaxFactor: 0.15, baseScrollSpeed: 35, depth: 5 },
      { parallaxFactor: 0.35, baseScrollSpeed: 70, depth: 4 },
      { parallaxFactor: 0.6, baseScrollSpeed: 120, depth: 3 },
      { parallaxFactor: 1.0, baseScrollSpeed: 200, depth: 1 },
    ];
    
    for (const config of layerConfigs) {
      const layerContainer = new Container();
      this.container.addChild(layerContainer);
      
      const layer: ParallaxLayer = {
        container: layerContainer,
        parallaxFactor: config.parallaxFactor,
        baseScrollSpeed: config.baseScrollSpeed,
        elements: [],
      };
      
      this.layers.push(layer);
      this.populateLayer(layer, config.depth);
    }
  }
  
  private populateLayer(layer: ParallaxLayer, depth: number): void {
    switch (depth) {
      case 6:
        this.createDeepStars(layer);
        this.createNebulae(layer);
        break;
      case 5:
        this.createMidStars(layer);
        this.createDistantPlanets(layer);
        break;
      case 4:
        this.createAsteroidField(layer);
        break;
      case 3:
        this.createBackgroundBattle(layer);
        break;
      case 1:
        this.createSpeedStreaks(layer);
        break;
    }
  }
  
  private createDeepStars(layer: ParallaxLayer): void {
    for (let i = 0; i < 100; i++) {
      const graphic = new Graphics();
      const x = Math.random() * this.gameWidth;
      const y = Math.random() * this.gameHeight;
      const size = 0.5 + Math.random() * 1.2;
      
      graphic.circle(0, 0, size);
      graphic.fill({ color: 0xffffff, alpha: 0.4 + Math.random() * 0.4 });
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
  
  private createNebulae(layer: ParallaxLayer): void {
    for (let i = 0; i < 4; i++) {
      const graphic = new Graphics();
      const x = Math.random() * this.gameWidth;
      const y = Math.random() * this.gameHeight;
      const width = 200 + Math.random() * 300;
      const height = 150 + Math.random() * 200;
      
      const colors = [0x6600ff, 0xff0066, 0x00ffaa, 0x6600ff, 0xff6600];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      for (let j = 0; j < 6; j++) {
        const cx = (Math.random() - 0.5) * width * 0.4;
        const cy = (Math.random() - 0.5) * height * 0.4;
        const r = Math.min(width, height) * (0.25 + Math.random() * 0.35);
        
        graphic.circle(cx, cy, r);
        graphic.fill({ color, alpha: 0.03 + Math.random() * 0.02 });
      }
      
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
  
  private createMidStars(layer: ParallaxLayer): void {
    for (let i = 0; i < 60; i++) {
      const graphic = new Graphics();
      const x = Math.random() * this.gameWidth;
      const y = Math.random() * this.gameHeight;
      const size = 1 + Math.random() * 2;
      
      graphic.circle(0, 0, size);
      graphic.fill({ color: 0xffffff, alpha: 0.6 + Math.random() * 0.3 });
      
      if (Math.random() > 0.7) {
        graphic.circle(0, 0, size * 2.5);
        graphic.fill({ color: 0xffffff, alpha: 0.15 });
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
  
  private createDistantPlanets(layer: ParallaxLayer): void {
    for (let i = 0; i < 3; i++) {
      const graphic = new Graphics();
      const x = 100 + Math.random() * (this.gameWidth - 200);
      const y = Math.random() * this.gameHeight;
      const radius = 50 + Math.random() * 80;
      
      const colors = [0xff4400, 0x4477ff, 0x88ff44, 0xff88ff, 0xffaa00, 0x00ddff];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      graphic.circle(0, 0, radius);
      graphic.fill({ color, alpha: 0.25 });
      
      graphic.circle(0, 0, radius * 0.75);
      graphic.fill({ color: 0x000000, alpha: 0.15 });
      
      if (Math.random() > 0.5) {
        graphic.ellipse(0, 0, radius * 1.5, radius * 0.15);
        graphic.stroke({ color, alpha: 0.2, width: 3 });
      }
      
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
        data: { rotationSpeed: (Math.random() - 0.5) * 0.1 },
      });
    }
  }
  
  private createAsteroidField(layer: ParallaxLayer): void {
    for (let i = 0; i < 12; i++) {
      const graphic = new Graphics();
      const x = Math.random() * this.gameWidth;
      const y = Math.random() * this.gameHeight;
      const size = 15 + Math.random() * 30;
      
      this.drawAsteroid(graphic, size);
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
        data: { rotationSpeed: (Math.random() - 0.5) * 0.3 },
      });
    }
  }
  
  private drawAsteroid(graphic: Graphics, size: number): void {
    const points = 10;
    graphic.moveTo(size, 0);
    for (let i = 1; i <= points; i++) {
      const angle = (Math.PI * 2 * i) / points;
      const r = size * (0.6 + Math.random() * 0.4);
      graphic.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    graphic.closePath();
    graphic.fill({ color: 0x665544, alpha: 0.7 });
    graphic.stroke({ color: 0x443322, alpha: 0.8, width: 1 });
    
    for (let i = 0; i < 4; i++) {
      const cx = (Math.random() - 0.5) * size * 0.7;
      const cy = (Math.random() - 0.5) * size * 0.7;
      graphic.circle(cx, cy, size * 0.12);
      graphic.fill({ color: 0x332211, alpha: 0.5 });
    }
  }
  
  private createBackgroundBattle(layer: ParallaxLayer): void {
    for (let i = 0; i < 20; i++) {
      const graphic = new Graphics();
      const x = Math.random() * this.gameWidth;
      const y = Math.random() * this.gameHeight;
      const size = 5 + Math.random() * 12;
      
      const isAllied = Math.random() > 0.5;
      const color = isAllied ? 0x4488ff : 0xff4444;
      
      graphic.moveTo(0, -size);
      graphic.lineTo(-size * 0.6, size * 0.6);
      graphic.lineTo(size * 0.6, size * 0.6);
      graphic.closePath();
      graphic.fill({ color, alpha: 0.5 });
      
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
        type: 'ship',
        data: { 
          moveTimer: Math.random() * 10,
          moveSpeed: 30 + Math.random() * 40,
          isAllied,
        },
      });
    }
  }
  
  private createSpeedStreaks(layer: ParallaxLayer): void {
    for (let i = 0; i < 20; i++) {
      const graphic = new Graphics();
      const x = Math.random() * this.gameWidth;
      const y = Math.random() * this.gameHeight;
      const length = 100 + Math.random() * 200;
      const width = 0.5 + Math.random() * 1.5;
      
      graphic.moveTo(0, -length / 2);
      graphic.lineTo(0, length / 2);
      graphic.stroke({ color: 0xffffff, alpha: 0.15 + Math.random() * 0.15, width });
      graphic.x = x;
      graphic.y = y;
      
      layer.container.addChild(graphic);
      layer.elements.push({
        graphic,
        x,
        y,
        width: width,
        height: length,
        type: 'streak',
      });
    }
  }
  
  private createBackgroundShips(): void {
    const ships: Array<Omit<BackgroundShip, 'time'>> = [
      { x: 200, y: -150, width: 250, height: 70, type: 'carrier', health: 100, maxHealth: 100, fireTimer: 0, fireRate: 2.5, allied: true, speed: 25, destroyed: false, explosionTimer: 0, targetX: 200, targetY: -150 },
      { x: this.gameWidth - 250, y: -250, width: 250, height: 70, type: 'carrier', health: 100, maxHealth: 100, fireTimer: 0, fireRate: 2.5, allied: false, speed: 25, destroyed: false, explosionTimer: 0, targetX: this.gameWidth - 250, targetY: -250 },
      { x: 450, y: -80, width: 100, height: 35, type: 'destroyer', health: 50, maxHealth: 50, fireTimer: 0, fireRate: 1.8, allied: true, speed: 35, destroyed: false, explosionTimer: 0, targetX: 450, targetY: -80 },
      { x: this.gameWidth - 450, y: -120, width: 100, height: 35, type: 'destroyer', health: 50, maxHealth: 50, fireTimer: 0, fireRate: 1.8, allied: false, speed: 35, destroyed: false, explosionTimer: 0, targetX: this.gameWidth - 450, targetY: -120 },
      { x: 650, y: -180, width: 50, height: 25, type: 'fighter', health: 20, maxHealth: 20, fireTimer: 0, fireRate: 1, allied: true, speed: 50, destroyed: false, explosionTimer: 0, targetX: 650, targetY: -180 },
      { x: 850, y: -300, width: 50, height: 25, type: 'fighter', health: 20, maxHealth: 20, fireTimer: 0, fireRate: 1, allied: false, speed: 50, destroyed: false, explosionTimer: 0, targetX: 850, targetY: -300 },
    ];
    
    this.backgroundShips = ships.map(s => ({ ...s, time: 0 }));
  }

  setPlayerPosition(playerX: number, _playerY: number): void {
    this.prevPlayerX = playerX;
    // Y disabled
  }

  update(delta: number, _phase: number, playerX?: number, _playerY?: number): void {
    const playerDeltaX = playerX !== undefined ? playerX - this.prevPlayerX : 0;
    // Y parallax disabled
    
    if (playerX !== undefined) this.prevPlayerX = playerX;
    // Y tracking removed
    
    for (const layer of this.layers) {
      const factor = layer.parallaxFactor;
      const baseSpeed = layer.baseScrollSpeed;
      
      for (const element of layer.elements) {
        // Base scroll: always move down (simulating ship moving forward)
        element.y += baseSpeed * delta;
        
        // Parallax X: move in OPPOSITE direction to player's horizontal movement
        element.x -= playerDeltaX * factor * 0.15;
        
        // Parallax Y: move in OPPOSITE direction to player's vertical movement
        // This creates the depth effect - closer layers respond more
        // element.y parallax disabled
        
        if (element.data?.rotationSpeed) {
          element.graphic.rotation += element.data.rotationSpeed * delta;
        }
        
        if (element.type === 'star' && element.data?.twinkle !== undefined) {
          element.data.twinkle += delta * 2;
          const twinkleAlpha = 0.4 + Math.sin(element.data.twinkle) * 0.25;
          element.graphic.alpha = twinkleAlpha;
        }
        
        if (element.data?.moveTimer !== undefined) {
          element.data.moveTimer += delta;
          element.x += Math.sin(element.data.moveTimer) * element.data.moveSpeed * delta * 0.1;
        }
        
        if (element.y > this.gameHeight + 150) {
          element.y = -150;
          element.x = Math.random() * this.gameWidth;
        }
        
        if (element.y < -200) {
          element.y = this.gameHeight + 150;
          element.x = Math.random() * this.gameWidth;
        }
        
        if (element.x < -100) element.x = this.gameWidth + 100;
        if (element.x > this.gameWidth + 100) element.x = -100;
        
        element.graphic.x = element.x;
        element.graphic.y = element.y;
      }
    }
  }

  render(container: Graphics): void {
    container.clear();
    
    for (const ship of this.backgroundShips) {
      ship.time += 0.016;
      
      if (ship.destroyed) {
        ship.explosionTimer -= 0.016;
        if (ship.explosionTimer > 0) {
          container.circle(ship.x, ship.y, ship.width * (1 - ship.explosionTimer));
          container.fill({ color: 0xff6600, alpha: ship.explosionTimer * 0.5 });
        }
        continue;
      }
      
      this.drawBackgroundShip(container, ship);
      this.updateBackgroundShipAI(ship);
      this.handleBackgroundShipFiring(ship, container);
    }
    
    for (let i = this.backgroundBullets.length - 1; i >= 0; i--) {
      const bullet = this.backgroundBullets[i];
      bullet.x += bullet.vx * 0.016;
      bullet.y += bullet.vy * 0.016;
      
      bullet.graphic.clear();
      bullet.graphic.circle(bullet.x, bullet.y, 3);
      bullet.graphic.fill({ color: bullet.allied ? 0x4488ff : 0xff4444, alpha: 0.8 });
      
      if (bullet.x < 0 || bullet.x > this.gameWidth || bullet.y < 0 || bullet.y > this.gameHeight) {
        bullet.graphic.destroy();
        this.backgroundBullets.splice(i, 1);
      }
    }
  }
  
  private drawBackgroundShip(container: Graphics, ship: BackgroundShip): void {
    const color = ship.allied ? 0x4488ff : 0xff4444;
    const altColor = ship.allied ? 0x2244aa : 0xaa2222;
    
    switch (ship.type) {
      case 'carrier':
        container.rect(-ship.width/2, -ship.height/2, ship.width, ship.height);
        container.fill({ color: altColor, alpha: 0.5 });
        container.stroke({ color, alpha: 0.6, width: 2 });
        
        container.moveTo(-ship.width/2 + 20, -ship.height/2 - 15);
        container.lineTo(0, -ship.height/2 - 30);
        container.lineTo(ship.width/2 - 20, -ship.height/2 - 15);
        container.fill({ color: altColor, alpha: 0.4 });
        
        container.circle(0, 0, ship.height * 0.3);
        container.fill({ color, alpha: 0.7 });
        break;
        
      case 'destroyer':
        container.moveTo(0, -ship.height/2);
        container.lineTo(-ship.width/2, ship.height/2);
        container.lineTo(ship.width/2, ship.height/2);
        container.closePath();
        container.fill({ color: altColor, alpha: 0.5 });
        container.stroke({ color, alpha: 0.6, width: 1.5 });
        break;
        
      case 'fighter':
        container.moveTo(0, -ship.height/2);
        container.lineTo(-ship.width/2, ship.height/2);
        container.lineTo(ship.width/2, ship.height/2);
        container.closePath();
        container.fill({ color, alpha: 0.6 });
        break;
    }
    
    container.moveTo(ship.x, ship.y);
  }
  
  private updateBackgroundShipAI(ship: BackgroundShip): void {
    ship.targetX += (Math.random() - 0.5) * 20;
    ship.targetX = Math.max(50, Math.min(this.gameWidth - 50, ship.targetX));
    
    ship.x += (ship.targetX - ship.x) * 0.01;
    ship.y += ship.speed * 0.016;
    
    if (ship.y > this.gameHeight + 200) {
      ship.y = -200;
      ship.x = 100 + Math.random() * (this.gameWidth - 200);
    }
  }
  
  private handleBackgroundShipFiring(ship: BackgroundShip, container: Graphics): void {
    ship.fireTimer += 0.016;
    
    if (ship.fireTimer >= ship.fireRate) {
      ship.fireTimer = 0;
      
      const targets = this.backgroundShips.filter(s => s.allied !== ship.allied && !s.destroyed);
      if (targets.length > 0) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        const dx = target.x - ship.x;
        const dy = target.y - ship.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const bulletGraphic = new Graphics();
        container.addChild(bulletGraphic);
        this.backgroundBullets.push({
          x: ship.x,
          y: ship.y,
          vx: (dx / dist) * 200,
          vy: (dy / dist) * 200,
          allied: ship.allied,
          graphic: bulletGraphic,
        });
      }
    }
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
