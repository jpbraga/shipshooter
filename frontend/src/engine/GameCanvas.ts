import { Application, Container, Graphics } from 'pixi.js';
import { GameEngine } from './GameEngine';
import { ParticleSystem } from './ParticleSystem';
import { ParallaxBackground } from './ParallaxBackground';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

interface GameCanvasProps {
  onGameStateChange: (state: import('./types').GameState) => void;
  onBossWarning: () => void;
  onGameOver: (result: import('./types').GameResult) => void;
  onVictory: (result: import('./types').GameResult) => void;
}

export default class GameCanvas {
  private app: Application | null = null;
  private engine: GameEngine | null = null;
  private container: HTMLDivElement;
  private onGameStateChange: GameCanvasProps['onGameStateChange'];
  private onBossWarning: GameCanvasProps['onBossWarning'];
  private onGameOver: GameCanvasProps['onGameOver'];
  private onVictory: GameCanvasProps['onVictory'];
  
  private gameContainer: Container | null = null;
  private backgroundContainer: Container | null = null;
  private entityContainer: Container | null = null;
  private particleContainer: Container | null = null;
  
  private playerGraphic: Graphics | null = null;
  private enemyGraphics: Map<string, Graphics> = new Map();
  private bulletGraphics: Map<string, Graphics> = new Map();
  private powerupGraphics: Map<string, Graphics> = new Map();
  private bossGraphic: Graphics | null = null;
  
  private particleSystem: ParticleSystem | null = null;
  private parallaxBackground: ParallaxBackground | null = null;
  private backgroundShipsGraphic: Graphics | null = null;
  
  private lastFrameTime: number = 0;
  private initialized: boolean = false;
  
  private playerTime: number = 0;
  private bossTime: number = 0;
  private enemyTimes: Map<string, number> = new Map();
  private powerupTimes: Map<string, number> = new Map();

  constructor(
    container: HTMLDivElement,
    callbacks: GameCanvasProps
  ) {
    this.container = container;
    this.onGameStateChange = callbacks.onGameStateChange;
    this.onBossWarning = callbacks.onBossWarning;
    this.onGameOver = callbacks.onGameOver;
    this.onVictory = callbacks.onVictory;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    const fallbackWidth = 1200;
    const fallbackHeight = 900;
    const rect = this.container.getBoundingClientRect();
    const width = Math.max(rect.width, this.container.clientWidth, fallbackWidth);
    const height = Math.max(rect.height, this.container.clientHeight, fallbackHeight);

    this.app = new Application();
    
    await this.app.init({
      background: 0x0a0a1a,
      width,
      height,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.container.appendChild(this.app.canvas);

    this.gameContainer = new Container();
    this.app.stage.addChild(this.gameContainer);

    const scaleX = this.app.screen.width / GAME_WIDTH;
    const scaleY = this.app.screen.height / GAME_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    
    this.gameContainer.scale.set(scale);
    this.gameContainer.x = (this.app.screen.width - GAME_WIDTH * scale) / 2;
    this.gameContainer.y = (this.app.screen.height - GAME_HEIGHT * scale) / 2;

    this.backgroundContainer = new Container();
    this.entityContainer = new Container();
    this.particleContainer = new Container();
    this.gameContainer.addChild(this.backgroundContainer);
    this.gameContainer.addChild(this.entityContainer);
    this.gameContainer.addChild(this.particleContainer);

    this.parallaxBackground = new ParallaxBackground(
      this.backgroundContainer,
      GAME_WIDTH,
      GAME_HEIGHT
    );
    
    this.backgroundShipsGraphic = new Graphics();
    this.backgroundContainer.addChild(this.backgroundShipsGraphic);

    this.particleSystem = new ParticleSystem(this.particleContainer);

    this.engine = new GameEngine({
      onBossWarning: this.onBossWarning,
      onGameOver: this.onGameOver,
      onVictory: this.onVictory,
    });

    this.engine.init();
    
    this.lastFrameTime = performance.now();
    this.app.ticker.add(this.gameLoop);
    
    this.setupInput();
    this.initialized = true;
  }

  private gameLoop = (): void => {
    const now = performance.now();
    const delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    if (!this.engine) return;

    this.engine.update(delta);
    
    const phase = this.engine.getGameState().phase;
    
    if (this.parallaxBackground) {
      this.parallaxBackground.update(delta, phase);
      this.parallaxBackground.render(this.backgroundShipsGraphic!);
    }
    
    if (this.particleSystem) {
      this.particleSystem.update(delta);
    }
    
    this.render();
    
    const state = this.engine.getGameState();
    this.onGameStateChange(state);
  };

  private render(): void {
    if (!this.engine || !this.entityContainer) return;

    this.renderPlayer();
    this.renderEnemies();
    this.renderBullets();
    this.renderBoss();
    this.renderPowerups();
  }

  private renderPlayer(): void {
    if (!this.entityContainer || !this.engine) return;
    
    const player = this.engine.getPlayer();
    
    if (!player.active) {
      if (this.playerGraphic) {
        this.playerGraphic.visible = false;
      }
      return;
    }

    this.playerTime += 0.016;

    if (!this.playerGraphic) {
      this.playerGraphic = new Graphics();
      this.entityContainer.addChild(this.playerGraphic);
    }

    this.playerGraphic.visible = true;
    this.playerGraphic.clear();
    
    if (player.invulnerable && Math.floor(performance.now() / 100) % 2 === 0) {
      this.playerGraphic.alpha = 0.3;
    } else {
      this.playerGraphic.alpha = 1;
    }

    this.drawPlayerShip(this.playerGraphic, player.x, player.y, player.weaponLevel);
    
    if (this.particleSystem && Math.random() > 0.5) {
      this.particleSystem.createEngineTrail(
        player.x + (Math.random() - 0.5) * 8,
        player.y + 25,
        player.weaponLevel >= 3 ? 0x00ffaa : 0x00aaff
      );
    }
  }
  
  private drawPlayerShip(graphic: Graphics, x: number, y: number, weaponLevel: number): void {
    const tremble = Math.sin(this.playerTime * 30) * 0.5;
    
    graphic.x = x;
    graphic.y = y + tremble;
    
    // Glow externo
    graphic.circle(0, 0, 40);
    graphic.fill({ color: 0x00aaff, alpha: 0.05 });
    graphic.circle(0, 0, 32);
    graphic.fill({ color: 0x00ccff, alpha: 0.1 });
    
    // Asas principais com efeito metalico
    graphic.moveTo(0, -28);
    graphic.lineTo(-8, -18);
    graphic.lineTo(-12, -5);
    graphic.lineTo(-25, 8);
    graphic.lineTo(-28, 20);
    graphic.lineTo(-15, 15);
    graphic.lineTo(-8, 22);
    graphic.lineTo(-5, 18);
    graphic.lineTo(0, 25);
    graphic.lineTo(5, 18);
    graphic.lineTo(8, 22);
    graphic.lineTo(15, 15);
    graphic.lineTo(28, 20);
    graphic.lineTo(25, 8);
    graphic.lineTo(12, -5);
    graphic.lineTo(8, -18);
    graphic.closePath();
    
    // Base da nave - metal escuro
    graphic.fill({ color: 0x00aaff });
    graphic.stroke({ color: 0xffffff, width: 1.5 });
    
    // Reflexo metalico superior
    graphic.moveTo(-20, 5);
    graphic.lineTo(-10, -10);
    graphic.lineTo(0, -20);
    graphic.lineTo(10, -10);
    graphic.lineTo(20, 5);
    graphic.lineTo(10, 8);
    graphic.lineTo(0, 0);
    graphic.lineTo(-10, 8);
    graphic.closePath();
    graphic.fill({ color: 0x44ccff, alpha: 0.4 });
    
    // Cockpit central
    graphic.moveTo(0, -28);
    graphic.lineTo(-3, -15);
    graphic.lineTo(3, -15);
    graphic.closePath();
    graphic.fill({ color: 0x00ffff });
    
    // Corpo central metálico
    graphic.rect(-10, -8, 20, 16);
    graphic.fill({ color: 0x004466 });
    graphic.stroke({ color: 0x00aaff, width: 1 });
    
    // Reflexo lateral
    graphic.rect(-8, -6, 6, 12);
    graphic.fill({ color: 0x0088aa, alpha: 0.5 });
    
    // Torres de armas
    graphic.moveTo(-12, -18);
    graphic.lineTo(-18, -35);
    graphic.lineTo(-8, -18);
    graphic.closePath();
    graphic.fill({ color: 0x0066aa });
    graphic.stroke({ color: 0x00aaff, width: 0.5 });
    
    graphic.moveTo(12, -18);
    graphic.lineTo(18, -35);
    graphic.lineTo(8, -18);
    graphic.closePath();
    graphic.fill({ color: 0x0066aa });
    graphic.stroke({ color: 0x00aaff, width: 0.5 });
    
    // Motores laterais com brilho
    graphic.ellipse(-22, 18, 6, 10);
    graphic.ellipse(22, 18, 6, 10);
    graphic.fill({ color: 0x006688 });
    
    // Cockpit lights
    graphic.circle(-5, 2, 3);
    graphic.circle(5, 2, 3);
    graphic.fill({ color: 0x00ffff, alpha: 0.8 });
    
    // Motor principal glow
    const glowSize = 8 + Math.sin(this.playerTime * 10) * 2;
    graphic.circle(0, 25, glowSize * 0.5);
    graphic.fill({ color: 0x00aaff, alpha: 0.6 });
    graphic.circle(0, 25, glowSize * 0.3);
    graphic.fill({ color: 0x00ffff, alpha: 0.8 });
    
    // Canhões baseados no nível
    switch (weaponLevel) {
      case 1:
        graphic.rect(-3, 12, 6, 8);
        graphic.fill({ color: 0x00ff00 });
        graphic.stroke({ color: 0x88ff88, width: 1 });
        break;
      case 2:
        graphic.rect(-8, 12, 5, 8);
        graphic.rect(3, 12, 5, 8);
        graphic.fill({ color: 0x00ff00 });
        graphic.stroke({ color: 0x88ff88, width: 1 });
        break;
      case 3:
        graphic.rect(-3, 12, 6, 10);
        graphic.rect(-20, 5, 4, 8);
        graphic.rect(16, 5, 4, 8);
        graphic.fill({ color: 0xaaff00 });
        graphic.stroke({ color: 0xddff44, width: 1 });
        break;
      case 4:
        graphic.rect(-8, 12, 5, 10);
        graphic.rect(3, 12, 5, 10);
        graphic.rect(-25, 3, 4, 10);
        graphic.rect(21, 3, 4, 10);
        graphic.fill({ color: 0xffaa00 });
        graphic.stroke({ color: 0xffdd44, width: 1 });
        break;
    }
  }

  private renderEnemies(): void {
    if (!this.entityContainer || !this.engine) return;
    
    const enemies = this.engine.getEnemies();
    const activeIds = new Set(enemies.filter(e => e.active).map(e => e.id));

    for (const [id, graphic] of this.enemyGraphics) {
      if (!activeIds.has(id)) {
        graphic.visible = false;
        this.entityContainer.removeChild(graphic);
        this.enemyGraphics.delete(id);
        this.enemyTimes.delete(id);
        graphic.destroy();
      }
    }

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      
      let time = this.enemyTimes.get(enemy.id) || 0;
      time += 0.016;
      this.enemyTimes.set(enemy.id, time);

      let graphic = this.enemyGraphics.get(enemy.id);
      
      if (!graphic) {
        graphic = new Graphics();
        this.entityContainer.addChild(graphic);
        this.enemyGraphics.set(enemy.id, graphic);
      }

      graphic.clear();
      graphic.x = enemy.x;
      graphic.y = enemy.y;
      graphic.visible = true;

      this.drawEnemyShip(graphic, enemy.type, time, enemy.health);
    }
  }
  
  private drawEnemyShip(graphic: Graphics, type: string, time: number, _health: number): void {
    const pulse = Math.sin(time * 5) * 0.1 + 1;
    
    switch (type) {
      case 'A':
        // Glow externo
        graphic.circle(0, 0, 30);
        graphic.fill({ color: 0xff6600, alpha: 0.08 });
        
        // Drone - chassi metálico
        graphic.moveTo(0, -20);
        graphic.lineTo(-15, -5);
        graphic.lineTo(-18, 15);
        graphic.lineTo(-8, 20);
        graphic.lineTo(0, 12);
        graphic.lineTo(8, 20);
        graphic.lineTo(18, 15);
        graphic.lineTo(15, -5);
        graphic.closePath();
        graphic.fill({ color: 0xcc5500 });
        graphic.stroke({ color: 0xffaa00, width: 1.5 });
        
        // Reflexo metálico
        graphic.moveTo(0, -15);
        graphic.lineTo(-10, -2);
        graphic.lineTo(-5, 5);
        graphic.lineTo(5, 5);
        graphic.lineTo(10, -2);
        graphic.closePath();
        graphic.fill({ color: 0xff8844, alpha: 0.5 });
        
        // Core
        graphic.circle(0, 0, 6);
        graphic.fill({ color: 0xffcc00, alpha: 0.8 * pulse });
        break;
        
      case 'B':
        // Glow
        graphic.circle(0, 0, 35);
        graphic.fill({ color: 0xff00ff, alpha: 0.06 });
        
        // Spinning energy lines
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6 + time * 0.5;
          graphic.moveTo(0, 0);
          graphic.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
        }
        graphic.stroke({ color: 0xff00ff, width: 3 });
        
        // Zigzag body
        graphic.moveTo(0, -22);
        graphic.lineTo(-19, 10);
        graphic.lineTo(-10, 22);
        graphic.lineTo(10, 22);
        graphic.lineTo(19, 10);
        graphic.closePath();
        graphic.fill({ color: 0x660066 });
        graphic.stroke({ color: 0xff00ff, width: 2 });
        
        // Reflexo metalico
        graphic.moveTo(0, -18);
        graphic.lineTo(-12, 5);
        graphic.lineTo(-6, 12);
        graphic.lineTo(6, 12);
        graphic.lineTo(12, 5);
        graphic.closePath();
        graphic.fill({ color: 0x992299, alpha: 0.6 });
        
        graphic.circle(0, 5, 8 * pulse);
        graphic.fill({ color: 0xff44ff, alpha: 0.7 });
        break;
        
      case 'C':
        // Tank - armored metal
        graphic.circle(0, 0, 45);
        graphic.fill({ color: 0x553300, alpha: 0.1 });
        
        // Main hull
        graphic.rect(-28, -28, 56, 56);
        graphic.fill({ color: 0x442200 });
        graphic.stroke({ color: 0x774400, width: 3 });
        
        // Armor plates
        graphic.rect(-24, -24, 48, 48);
        graphic.fill({ color: 0x553300 });
        
        // Reflexo metalico
        graphic.rect(-20, -20, 15, 48);
        graphic.fill({ color: 0x664422, alpha: 0.4 });
        
        // Rivets
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 4; j++) {
            graphic.circle(-18 + i * 12, -18 + j * 12, 2);
            graphic.fill({ color: 0x885533 });
          }
        }
        
        // Central cannon mount
        graphic.rect(-25, -8, 50, 16);
        graphic.fill({ color: 0x664400 });
        graphic.stroke({ color: 0x886644, width: 1 });
        
        // Cannons
        for (let i = -1; i <= 1; i++) {
          graphic.circle(i * 15, 0, 5);
          graphic.fill({ color: 0xff4400, alpha: pulse });
          graphic.circle(i * 15, 0, 2);
          graphic.fill({ color: 0xffffff, alpha: 0.8 });
        }
        
        graphic.rect(-8, 25, 16, 8);
        graphic.fill({ color: 0xff6600, alpha: 0.8 });
        break;
        
      case 'D':
        // Turret glow
        graphic.circle(0, 0, 40);
        graphic.fill({ color: 0x4444ff, alpha: 0.06 });
        
        // Base
        graphic.circle(0, 0, 25);
        graphic.fill({ color: 0x222244 });
        
        // Rotating beams
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8 + time * 2;
          graphic.moveTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
          graphic.lineTo(Math.cos(angle) * 25, Math.sin(angle) * 25);
        }
        graphic.stroke({ color: 0x6666ff, width: 3 });
        
        // Reflexo metalico
        graphic.circle(0, -5, 15);
        graphic.fill({ color: 0x333366, alpha: 0.6 });
        
        graphic.circle(0, 0, 10);
        graphic.fill({ color: 0x4444ff, alpha: pulse });
        
        graphic.circle(0, 0, 5);
        graphic.fill({ color: 0xaaaaff });
        break;
        
      case 'E':
        // Kamikaze glow
        graphic.circle(0, 0, 35);
        graphic.fill({ color: 0xffff00, alpha: 0.08 });
        
        // Body
        graphic.moveTo(-8, -15);
        graphic.lineTo(-18, 0);
        graphic.lineTo(-10, 18);
        graphic.lineTo(10, 18);
        graphic.lineTo(18, 0);
        graphic.lineTo(8, -15);
        graphic.lineTo(0, -8);
        graphic.closePath();
        graphic.fill({ color: 0x999900 });
        graphic.stroke({ color: 0xffff00, width: 2 });
        
        // Reflexo
        graphic.moveTo(-5, -10);
        graphic.lineTo(-12, 2);
        graphic.lineTo(-6, 10);
        graphic.lineTo(6, 10);
        graphic.lineTo(12, 2);
        graphic.lineTo(5, -10);
        graphic.closePath();
        graphic.fill({ color: 0xcccc00, alpha: 0.4 });
        
        graphic.circle(0, 0, 6 * pulse);
        graphic.fill({ color: 0xffff88, alpha: 0.9 });
        
        // Engine trail
        graphic.moveTo(-5, 18);
        graphic.lineTo(-3, 25 + Math.sin(time * 15) * 5);
        graphic.moveTo(5, 18);
        graphic.lineTo(3, 25 + Math.sin(time * 15) * 5);
        graphic.stroke({ color: 0xffaa00, width: 2 });
        break;
    }
  }

  private renderBullets(): void {
    if (!this.entityContainer || !this.engine) return;
    
    const bullets = this.engine.getBullets();
    const activeIds = new Set(bullets.filter(b => b.active).map(b => b.id));

    for (const [id, graphic] of this.bulletGraphics) {
      if (!activeIds.has(id)) {
        graphic.visible = false;
        this.entityContainer.removeChild(graphic);
        this.bulletGraphics.delete(id);
        graphic.destroy();
      }
    }

    for (const bullet of bullets) {
      if (!bullet.active) continue;

      let graphic = this.bulletGraphics.get(bullet.id);
      
      if (!graphic) {
        graphic = new Graphics();
        this.entityContainer.addChild(graphic);
        this.bulletGraphics.set(bullet.id, graphic);
      }

      graphic.clear();
      graphic.x = bullet.x;
      graphic.y = bullet.y;
      graphic.visible = true;

      if (bullet.isPlayerBullet) {
        // Glow externo - energia verde cyan (multiple layers)
        graphic.circle(0, 0, 16);
        graphic.fill({ color: 0x00ff88, alpha: 0.08 });
        graphic.circle(0, 0, 12);
        graphic.fill({ color: 0x00ffaa, alpha: 0.15 });
        graphic.circle(0, 0, 8);
        graphic.fill({ color: 0x00ffcc, alpha: 0.25 });
        
        // Corpo do projétil
        graphic.moveTo(0, -10);
        graphic.lineTo(-3, 5);
        graphic.lineTo(0, 3);
        graphic.lineTo(3, 5);
        graphic.closePath();
        graphic.fill({ color: 0x00ff88 });
        
        // Nucleo brilhante
        graphic.circle(0, 0, 3);
        graphic.fill({ color: 0xccffee, alpha: 0.9 });
      } else {
        // Glow externo - energia vermelha/laranja (multiple layers)
        graphic.circle(0, 0, 18);
        graphic.fill({ color: 0xff2222, alpha: 0.06 });
        graphic.circle(0, 0, 14);
        graphic.fill({ color: 0xff3300, alpha: 0.12 });
        graphic.circle(0, 0, 10);
        graphic.fill({ color: 0xff4400, alpha: 0.2 });
        graphic.circle(0, 0, 7);
        graphic.fill({ color: 0xff6600, alpha: 0.4 });
        graphic.circle(0, 0, 5);
        graphic.fill({ color: 0xff8800, alpha: 0.6 });
        
        // Corpo principal
        graphic.circle(0, 0, 6);
        graphic.fill({ color: 0xffaa44, alpha: 0.85 });
        
        // Nucleo quente
        graphic.circle(0, 0, 2);
        graphic.fill({ color: 0xffddaa, alpha: 0.95 });
        
        // Centro branco
        graphic.circle(0, 0, 1.5);
        graphic.fill({ color: 0xffffff });
      }
    }
  }

  private renderBoss(): void {
    if (!this.entityContainer || !this.engine) return;
    
    const boss = this.engine.getBoss();

    if (!boss || !boss.active) {
      if (this.bossGraphic) {
        if (this.bossGraphic.visible && this.particleSystem && boss) {
          this.particleSystem.createExplosion({
            x: boss.x,
            y: boss.y,
            radius: 30,
            color: 0xff0000,
            particleCount: 50,
            type: 'boss',
          });
        }
        this.bossGraphic.visible = false;
      }
      return;
    }

    this.bossTime += 0.016;

    if (!this.bossGraphic) {
      this.bossGraphic = new Graphics();
      this.entityContainer.addChild(this.bossGraphic);
    }

    this.bossGraphic.clear();
    this.bossGraphic.x = boss.x;
    this.bossGraphic.y = boss.y;
    this.bossGraphic.visible = true;

    this.drawBoss(this.bossGraphic, boss, this.bossTime);
    
    if (this.particleSystem && Math.random() > 0.7) {
      const offsetX = (Math.random() - 0.5) * boss.width * 0.8;
      this.particleSystem.createSmoke(boss.x + offsetX, boss.y + boss.height / 2, 1);
    }
  }
  
  private drawBoss(graphic: Graphics, boss: any, time: number): void {
    const phaseColors = [
      { main: 0x660000, accent: 0xff0000, glow: 0xff0000 },
      { main: 0x664400, accent: 0xff4400, glow: 0xff6600 },
      { main: 0x666600, accent: 0xffff00, glow: 0xffff00 },
    ];
    
    const colors = phaseColors[boss.phase - 1];
    const hw = boss.width / 2;
    const hh = boss.height / 2;
    const tremble = Math.sin(time * 20) * (4 - boss.phase);
    
    graphic.x += tremble;
    
    // Glow externo
    graphic.circle(0, 0, hw * 1.3);
    graphic.fill({ color: colors.glow, alpha: 0.03 });
    graphic.circle(0, 0, hw * 1.1);
    graphic.fill({ color: colors.glow, alpha: 0.06 });
    
    // Main hull
    graphic.moveTo(0, -hh);
    graphic.lineTo(-hw * 0.3, -hh * 0.8);
    graphic.lineTo(-hw * 0.8, -hh * 0.3);
    graphic.lineTo(-hw, 0);
    graphic.lineTo(-hw * 0.7, hh * 0.5);
    graphic.lineTo(-hw * 0.4, hh);
    graphic.lineTo(0, hh * 0.7);
    graphic.lineTo(hw * 0.4, hh);
    graphic.lineTo(hw * 0.7, hh * 0.5);
    graphic.lineTo(hw, 0);
    graphic.lineTo(hw * 0.8, -hh * 0.3);
    graphic.lineTo(hw * 0.3, -hh * 0.8);
    graphic.closePath();
    graphic.fill({ color: colors.main });
    graphic.stroke({ color: colors.accent, width: 3 });
    
    // Reflexo metalico superior
    graphic.moveTo(0, -hh * 0.9);
    graphic.lineTo(-hw * 0.5, 0);
    graphic.lineTo(-hw * 0.3, hh * 0.3);
    graphic.lineTo(hw * 0.3, hh * 0.3);
    graphic.lineTo(hw * 0.5, 0);
    graphic.closePath();
    graphic.fill({ color: 0x442222, alpha: 0.4 });
    
    // Side wings
    graphic.moveTo(-hw * 0.8, 0);
    graphic.lineTo(-hw * 1.3, -20);
    graphic.lineTo(-hw * 1.1, 20);
    graphic.lineTo(-hw * 0.8, 10);
    graphic.closePath();
    graphic.fill({ color: colors.main });
    graphic.stroke({ color: colors.accent, width: 1 });
    
    graphic.moveTo(hw * 0.8, 0);
    graphic.lineTo(hw * 1.3, -20);
    graphic.lineTo(hw * 1.1, 20);
    graphic.lineTo(hw * 0.8, 10);
    graphic.closePath();
    graphic.fill({ color: colors.main });
    graphic.stroke({ color: colors.accent, width: 1 });
    
    // Central area
    graphic.rect(-hw * 0.5, -hh * 0.4, hw, hh * 0.8);
    graphic.fill({ color: 0x220000 });
    graphic.stroke({ color: colors.accent, width: 1 });
    
    // Reflexo central
    graphic.rect(-hw * 0.4, -hh * 0.3, hw * 0.3, hh * 0.6);
    graphic.fill({ color: 0x331111, alpha: 0.5 });
    
    // Core
    const corePulse = Math.sin(time * 8) * 0.3 + 0.7;
    graphic.circle(0, 0, 20 * corePulse);
    graphic.fill({ color: colors.accent, alpha: 0.8 });
    graphic.circle(0, 0, 10);
    graphic.fill({ color: 0xffffff, alpha: 0.9 });
    
    // Weapon mounts
    for (let i = -1; i <= 1; i++) {
      const angle = time * 3 + i * 0.3;
      graphic.circle(i * hw * 0.5, hh * 0.6, 12 + Math.sin(angle) * 2);
      graphic.fill({ color: 0xff0000, alpha: 0.8 });
      graphic.circle(i * hw * 0.5, hh * 0.6, 6);
      graphic.fill({ color: 0xffffff, alpha: 0.6 });
    }
    
    // Top antenna
    graphic.moveTo(-hw * 0.2, -hh * 0.6);
    graphic.lineTo(0, -hh - 15);
    graphic.lineTo(hw * 0.2, -hh * 0.6);
    graphic.closePath();
    graphic.fill({ color: colors.main });
    
    // Rotating energy points
    for (let i = 0; i < 5; i++) {
      const angle = time * 2 + (Math.PI * 2 * i) / 5;
      const radius = 35;
      graphic.circle(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius - 10,
        3
      );
      graphic.fill({ color: colors.accent, alpha: 0.6 });
    }
  }

  private renderPowerups(): void {
    if (!this.entityContainer || !this.engine) return;
    
    const powerups = this.engine.getPowerups();
    const activeIds = new Set(powerups.filter(p => p.active).map(p => p.id));

    for (const [id, graphic] of this.powerupGraphics) {
      if (!activeIds.has(id)) {
        graphic.visible = false;
        this.entityContainer.removeChild(graphic);
        this.powerupGraphics.delete(id);
        this.powerupTimes.delete(id);
        graphic.destroy();
      }
    }

    for (const powerup of powerups) {
      if (!powerup.active) continue;
      
      let time = this.powerupTimes.get(powerup.id) || 0;
      time += 0.016;
      this.powerupTimes.set(powerup.id, time);

      let graphic = this.powerupGraphics.get(powerup.id);
      
      if (!graphic) {
        graphic = new Graphics();
        this.entityContainer.addChild(graphic);
        this.powerupGraphics.set(powerup.id, graphic);
      }

      graphic.clear();
      graphic.x = powerup.x;
      graphic.y = powerup.y;
      graphic.visible = true;

      this.drawPowerup(graphic, powerup.type, time);
    }
  }
  
  private drawPowerup(graphic: Graphics, type: string, time: number): void {
    const pulse = Math.sin(time * 5) * 0.3 + 0.7;
    const rotation = time * 2;
    
    const colors: Record<string, { main: number; glow: number }> = {
      weapon: { main: 0x00ff00, glow: 0x88ff88 },
      shield: { main: 0x0088ff, glow: 0x88ccff },
      bomb: { main: 0xff8800, glow: 0xffaa66 },
      heal: { main: 0xff44ff, glow: 0xffaaff },
      score: { main: 0xffff00, glow: 0xffff88 },
    };

    const color = colors[type] || { main: 0xffffff, glow: 0xffffff };
    
    // Glow externo
    graphic.circle(0, 0, 25 * pulse);
    graphic.fill({ color: color.glow, alpha: 0.1 });
    graphic.circle(0, 0, 20 * pulse);
    graphic.fill({ color: color.glow, alpha: 0.15 });
    
    // Inner glow
    graphic.circle(0, 0, 18 * pulse);
    graphic.fill({ color: color.glow, alpha: 0.2 * pulse });
    
    // Star shape
    graphic.moveTo(0, 0);
    for (let i = 0; i < 6; i++) {
      const angle = rotation + (Math.PI * 2 * i) / 6;
      const r = i % 2 === 0 ? 15 : 8;
      graphic.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    graphic.closePath();
    graphic.fill({ color: color.main, alpha: 0.6 * pulse });
    graphic.stroke({ color: color.glow, width: 2 });
    
    // Center glow
    graphic.circle(0, 0, 6);
    graphic.fill({ color: color.glow, alpha: pulse });
    
    // Checkmark
    graphic.moveTo(-4, 0);
    graphic.lineTo(-1, 3);
    graphic.lineTo(4, -3);
    graphic.stroke({ color: 0xffffff, width: 2 });
  }

  createExplosion(x: number, y: number, size: 'small' | 'medium' | 'large' | 'boss', color: number = 0xff6600): void {
    if (!this.particleSystem) return;
    
    this.particleSystem.createExplosion({
      x,
      y,
      radius: size === 'small' ? 15 : size === 'medium' ? 30 : size === 'large' ? 50 : 80,
      color,
      particleCount: 0,
      type: size,
    });
  }
  
  createSmoke(x: number, y: number): void {
    if (!this.particleSystem) return;
    this.particleSystem.createSmoke(x, y, 3);
  }

  private setupInput(): void {
    const keyMap: Record<string, keyof import('./types').InputState> = {
      'KeyW': 'up', 'ArrowUp': 'up',
      'KeyS': 'down', 'ArrowDown': 'down',
      'KeyA': 'left', 'ArrowLeft': 'left',
      'KeyD': 'right', 'ArrowRight': 'right',
      'Space': 'bomb',
      'KeyP': 'pause',
    };

    window.addEventListener('keydown', (e) => {
      if (!this.engine) return;
      const action = keyMap[e.code];
      if (action) {
        e.preventDefault();
        this.engine.setInput(action, true);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!this.engine) return;
      const action = keyMap[e.code];
      if (action) {
        this.engine.setInput(action, false);
      }
    });
  }

  destroy(): void {
    if (this.app) {
      this.app.ticker.remove(this.gameLoop);
      this.app.destroy(true);
      this.app = null;
    }

    this.enemyGraphics.forEach(g => g.destroy());
    this.bulletGraphics.forEach(g => g.destroy());
    this.powerupGraphics.forEach(g => g.destroy());
    
    this.enemyGraphics.clear();
    this.bulletGraphics.clear();
    this.powerupGraphics.clear();
    
    if (this.particleSystem) {
      this.particleSystem.destroy();
      this.particleSystem = null;
    }
    
    if (this.parallaxBackground) {
      this.parallaxBackground.destroy();
      this.parallaxBackground = null;
    }
    
    this.engine = null;
    this.initialized = false;
  }
}
