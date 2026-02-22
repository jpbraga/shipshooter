import {
  Player,
  Bullet,
  Enemy,
  Boss,
  PowerUp,
  InputState,
  GameState,
  GameResult,
  EnemyType,
  BossPhase,
} from './types';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_SPEED,
  PLAYER_FIRE_RATE,
  PLAYER_HITBOX_RATIO,
  PLAYER_MAX_HEALTH,
  PLAYER_INVULNERABLE_TIME,
  PLAYER_STARTING_BOMBS,
  BULLET_SPEED_PLAYER,
  BULLET_SPEED_ENEMY,
  ENEMY_CONFIG,
  POWERUP_CONFIG,
  BOSS_CONFIG,
} from './constants';
import { v4 as uuidv4 } from 'uuid';

interface GameEngineCallbacks {
  onBossWarning: () => void;
  onGameOver: (result: GameResult) => void;
  onVictory: (result: GameResult) => void;
}

export class GameEngine {
  private player: Player;
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private powerups: PowerUp[] = [];
  private boss: Boss | null = null;
  
  private input: InputState = {
    up: false, down: false, left: false, right: false,
    bomb: false, pause: false,
  };
  
  private gameState: GameState;
  private callbacks: GameEngineCallbacks;
  
  private waveTimer: number = 0;
  private bossWarningTriggered: boolean = false;
  private bossSpawned: boolean = false;
  
  private gameTime: number = 0;
  private initialized: boolean = false;
  
  private bulletPool: Bullet[] = [];

  constructor(callbacks: GameEngineCallbacks) {
    this.callbacks = callbacks;
    
    this.player = this.createPlayer();
    this.gameState = this.createInitialState();
  }

  private createPlayer(): Player {
    return {
      id: 'player',
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 80,
      width: 30,
      height: 40,
      active: true,
      health: PLAYER_MAX_HEALTH,
      maxHealth: PLAYER_MAX_HEALTH,
      weaponLevel: 1,
      bombs: PLAYER_STARTING_BOMBS,
      invulnerable: false,
      invulnerableTimer: 0,
      fireTimer: 0,
    };
  }

  private createInitialState(): GameState {
    return {
      playerHealth: PLAYER_MAX_HEALTH,
      playerMaxHealth: PLAYER_MAX_HEALTH,
      score: 0,
      phase: 1,
      weaponLevel: 1,
      bombs: PLAYER_STARTING_BOMBS,
      currentBoss: null,
      isPaused: false,
      isGameOver: false,
      isVictory: false,
      time: 0,
      powerupsCollected: 0,
      hitsReceived: 0,
      enemiesDestroyed: 0,
      bossDamageDealt: 0,
    };
  }

  init(): void {
    if (this.initialized) return;
    
    this.createBulletPool();
    this.initialized = true;
  }

  private createBulletPool(): void {
    for (let i = 0; i < 500; i++) {
      this.bulletPool.push({
        id: uuidv4(),
        x: 0, y: 0,
        width: 8, height: 12,
        active: false,
        velocityX: 0, velocityY: 0,
        isPlayerBullet: false,
        damage: 1,
      });
    }
  }

  private getBulletFromPool(isPlayerBullet: boolean): Bullet | null {
    const existing = this.bulletPool.find(b => !b.active && b.isPlayerBullet === isPlayerBullet);
    if (existing) {
      existing.active = true;
      return existing;
    }
    
    const anyInactive = this.bulletPool.find(b => !b.active);
    if (anyInactive) {
      anyInactive.active = true;
      anyInactive.isPlayerBullet = isPlayerBullet;
      return anyInactive;
    }
    
    return null;
  }

  setInput(action: keyof InputState, value: boolean): void {
    this.input[action] = value;
    
    if (action === 'pause' && value) {
      this.gameState.isPaused = !this.gameState.isPaused;
    }
    
    if (action === 'bomb' && value && this.player.bombs > 0 && !this.gameState.isPaused) {
      this.useBomb();
    }
  }

  private useBomb(): void {
    this.player.bombs--;
    this.gameState.bombs = this.player.bombs;
    
    this.bullets = this.bullets.filter(b => b.isPlayerBullet || !b.active);
    this.bulletPool.forEach(b => {
      if (!b.isPlayerBullet) b.active = false;
    });
    
    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.health -= 5;
        if (enemy.health <= 0) {
          this.destroyEnemy(enemy);
        }
      }
    }
    
    if (this.boss && this.boss.active) {
      this.damageBoss(100);
    }
    
    this.gameState.score += 500;
  }

  update(delta: number): void {
    if (this.gameState.isPaused || this.gameState.isGameOver || this.gameState.isVictory) {
      return;
    }

    this.gameTime += delta;
    this.gameState.time = Math.floor(this.gameTime);

    this.updatePlayer(delta);
    this.updateBullets(delta);
    this.updateEnemies(delta);
    this.updateBoss(delta);
    this.updatePowerups(delta);
    this.checkCollisions();
    this.manageWaves(delta);
  }

  private updatePlayer(delta: number): void {
    if (!this.player.active) return;

    let dx = 0, dy = 0;
    if (this.input.up) dy -= 1;
    if (this.input.down) dy += 1;
    if (this.input.left) dx -= 1;
    if (this.input.right) dx += 1;

    const magnitude = Math.sqrt(dx * dx + dy * dy);
    if (magnitude > 0) {
      dx /= magnitude;
      dy /= magnitude;
    }

    this.player.x += dx * PLAYER_SPEED * delta;
    this.player.y += dy * PLAYER_SPEED * delta;

    const halfWidth = this.player.width / 2;
    const halfHeight = this.player.height / 2;
    this.player.x = Math.max(halfWidth, Math.min(GAME_WIDTH - halfWidth, this.player.x));
    this.player.y = Math.max(halfHeight, Math.min(GAME_HEIGHT - halfHeight, this.player.y));

    if (this.player.invulnerable) {
      this.player.invulnerableTimer -= delta;
      if (this.player.invulnerableTimer <= 0) {
        this.player.invulnerable = false;
      }
    }

    this.player.fireTimer -= delta;
    if (this.player.fireTimer <= 0) {
      this.firePlayerBullets();
      this.player.fireTimer = PLAYER_FIRE_RATE;
    }

    this.gameState.playerHealth = this.player.health;
    this.gameState.weaponLevel = this.player.weaponLevel;
    this.gameState.bombs = this.player.bombs;
  }

  private firePlayerBullets(): void {
    const level = this.player.weaponLevel;
    
    switch (level) {
      case 1:
        this.createPlayerBullet(this.player.x, this.player.y - 20, 0, -BULLET_SPEED_PLAYER);
        break;
      case 2:
        this.createPlayerBullet(this.player.x - 10, this.player.y - 15, 0, -BULLET_SPEED_PLAYER);
        this.createPlayerBullet(this.player.x + 10, this.player.y - 15, 0, -BULLET_SPEED_PLAYER);
        break;
      case 3:
        this.createPlayerBullet(this.player.x, this.player.y - 20, 0, -BULLET_SPEED_PLAYER);
        this.createPlayerBullet(this.player.x - 15, this.player.y - 10, -50, -BULLET_SPEED_PLAYER * 0.9);
        this.createPlayerBullet(this.player.x + 15, this.player.y - 10, 50, -BULLET_SPEED_PLAYER * 0.9);
        break;
      case 4:
        this.createPlayerBullet(this.player.x, this.player.y - 20, 0, -BULLET_SPEED_PLAYER);
        this.createPlayerBullet(this.player.x - 12, this.player.y - 15, 0, -BULLET_SPEED_PLAYER);
        this.createPlayerBullet(this.player.x + 12, this.player.y - 15, 0, -BULLET_SPEED_PLAYER);
        this.createPlayerBullet(this.player.x - 25, this.player.y, -100, -BULLET_SPEED_PLAYER * 0.8);
        this.createPlayerBullet(this.player.x + 25, this.player.y, 100, -BULLET_SPEED_PLAYER * 0.8);
        break;
    }
  }

  private createPlayerBullet(x: number, y: number, vx: number, vy: number): void {
    const bullet = this.getBulletFromPool(true);
    if (!bullet) return;
    
    bullet.x = x;
    bullet.y = y;
    bullet.velocityX = vx;
    bullet.velocityY = vy;
    bullet.isPlayerBullet = true;
    bullet.damage = 1;
    
    if (!this.bullets.includes(bullet)) {
      this.bullets.push(bullet);
    }
  }

  private createEnemyBullet(x: number, y: number, vx: number, vy: number): void {
    const bullet = this.getBulletFromPool(false);
    if (!bullet) return;
    
    bullet.x = x;
    bullet.y = y;
    bullet.velocityX = vx;
    bullet.velocityY = vy;
    bullet.isPlayerBullet = false;
    bullet.damage = 1;
    
    if (!this.bullets.includes(bullet)) {
      this.bullets.push(bullet);
    }
  }

  private updateBullets(delta: number): void {
    for (const bullet of this.bulletPool) {
      if (!bullet.active) continue;
      
      bullet.x += bullet.velocityX * delta;
      bullet.y += bullet.velocityY * delta;
      
      if (bullet.x < -20 || bullet.x > GAME_WIDTH + 20 ||
          bullet.y < -20 || bullet.y > GAME_HEIGHT + 20) {
        bullet.active = false;
      }
    }
  }

  private updateEnemies(delta: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      
      enemy.moveTimer += delta;
      enemy.fireTimer += delta;
      
      switch (enemy.movePattern) {
        case 'straight':
          enemy.y += 80 * delta;
          break;
        case 'sine':
          enemy.y += 60 * delta;
          enemy.x = enemy.baseX + Math.sin(enemy.moveTimer * 3) * 50;
          break;
        case 'chase':
          const dx = this.player.x - enemy.x;
          const dy = this.player.y - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            enemy.x += (dx / dist) * 120 * delta;
            enemy.y += (dy / dist) * 120 * delta;
          }
          break;
        case 'stationary':
          enemy.y += 30 * delta;
          break;
      }

      if (enemy.fireRate > 0 && enemy.fireTimer >= enemy.fireRate) {
        this.enemyFire(enemy);
        enemy.fireTimer = 0;
      }

      if (enemy.y > GAME_HEIGHT + 50) {
        enemy.active = false;
      }
    }
  }

  private enemyFire(enemy: Enemy): void {
    const dx = this.player.x - enemy.x;
    const dy = this.player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;

    switch (enemy.type) {
      case 'A':
        this.createEnemyBullet(enemy.x, enemy.y + 20, 0, BULLET_SPEED_ENEMY);
        break;
      case 'B':
        this.createEnemyBullet(enemy.x, enemy.y + 20, dx/dist * BULLET_SPEED_ENEMY * 0.5, BULLET_SPEED_ENEMY);
        this.createEnemyBullet(enemy.x, enemy.y + 20, -dx/dist * BULLET_SPEED_ENEMY * 0.5, BULLET_SPEED_ENEMY);
        break;
      case 'C':
        for (let i = -1; i <= 1; i++) {
          this.createEnemyBullet(enemy.x + i * 20, enemy.y + 30, i * 30, BULLET_SPEED_ENEMY);
        }
        break;
      case 'D':
        this.fireRadialPattern(enemy.x, enemy.y, 8, BULLET_SPEED_ENEMY * 0.7);
        break;
      case 'E':
        break;
    }
  }

  private updateBoss(delta: number): void {
    if (!this.boss || !this.boss.active) return;

    this.boss.attackTimer += delta;
    this.boss.moveTimer += delta;

    this.boss.x += Math.sin(this.boss.moveTimer * 1.5) * 100 * delta * this.boss.moveDirection;
    
    this.boss.x = Math.max(this.boss.width / 2, Math.min(GAME_WIDTH - this.boss.width / 2, this.boss.x));

    const attackInterval = this.boss.phase === 1 ? 1.5 : this.boss.phase === 2 ? 1.0 : 0.7;
    
    if (this.boss.attackTimer >= attackInterval) {
      this.bossAttack();
      this.boss.attackTimer = 0;
    }

    const healthPercent = this.boss.health / this.boss.maxHealth;
    const newPhase: BossPhase = healthPercent > 0.66 ? 1 : healthPercent > 0.33 ? 2 : 3;
    
    if (newPhase !== this.boss.phase) {
      this.boss.phase = newPhase;
    }

    this.gameState.currentBoss = { ...this.boss };
  }

  private bossAttack(): void {
    if (!this.boss) return;

    switch (this.boss.phase) {
      case 1:
        this.fireAimedShot(this.boss.x, this.boss.y + this.boss.height / 2);
        this.fireAimedShot(this.boss.x - 40, this.boss.y + this.boss.height / 2);
        this.fireAimedShot(this.boss.x + 40, this.boss.y + this.boss.height / 2);
        break;
      case 2:
        this.fireSpiralPattern(this.boss.x, this.boss.y + this.boss.height / 2);
        break;
      case 3:
        this.fireRadialPattern(this.boss.x, this.boss.y + this.boss.height / 2, 16, BULLET_SPEED_ENEMY * 0.6);
        this.fireWavePattern(this.boss.x, this.boss.y + this.boss.height / 2);
        break;
    }
  }

  private fireAimedShot(x: number, y: number): void {
    const dx = this.player.x - x;
    const dy = this.player.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;
    
    this.createEnemyBullet(x, y, (dx/dist) * BULLET_SPEED_ENEMY, (dy/dist) * BULLET_SPEED_ENEMY);
  }

  private fireRadialPattern(x: number, y: number, count: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      this.createEnemyBullet(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
    }
  }

  private fireSpiralPattern(x: number, y: number): void {
    const time = performance.now() / 1000;
    for (let i = 0; i < 8; i++) {
      const angle = time * 2 + (Math.PI * 2 * i) / 8;
      this.createEnemyBullet(
        x, y,
        Math.cos(angle) * BULLET_SPEED_ENEMY * 0.5,
        Math.sin(angle) * BULLET_SPEED_ENEMY * 0.5
      );
    }
  }

  private fireWavePattern(x: number, y: number): void {
    for (let i = -3; i <= 3; i++) {
      this.createEnemyBullet(x + i * 30, y, i * 20, BULLET_SPEED_ENEMY * 0.8);
    }
  }

  private updatePowerups(delta: number): void {
    for (const powerup of this.powerups) {
      if (!powerup.active) continue;
      
      powerup.y += powerup.velocityY * delta;
      
      if (powerup.y > GAME_HEIGHT + 30) {
        powerup.active = false;
      }
    }
  }

  private checkCollisions(): void {
    this.checkPlayerEnemyCollisions();
    this.checkPlayerBulletCollisions();
    this.checkEnemyBulletCollisions();
    this.checkPowerupCollisions();
  }

  private checkPlayerEnemyCollisions(): void {
    if (this.player.invulnerable) return;
    
    const px = this.player.x;
    const py = this.player.y;
    const pr = this.player.width * PLAYER_HITBOX_RATIO / 2;
    
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      
      const dist = Math.sqrt((px - enemy.x) ** 2 + (py - enemy.y) ** 2);
      if (dist < pr + enemy.width / 2) {
        this.damagePlayer();
        enemy.health -= 2;
        if (enemy.health <= 0) {
          this.destroyEnemy(enemy);
        }
        break;
      }
    }
  }

  private checkPlayerBulletCollisions(): void {
    for (const bullet of this.bulletPool) {
      if (!bullet.active || !bullet.isPlayerBullet) continue;
      
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        
        const dist = Math.sqrt(
          (bullet.x - enemy.x) ** 2 + (bullet.y - enemy.y) ** 2
        );
        
        if (dist < enemy.width / 2) {
          enemy.health -= bullet.damage;
          bullet.active = false;
          
          if (enemy.health <= 0) {
            this.destroyEnemy(enemy);
          }
          break;
        }
      }
      
      if (this.boss && this.boss.active && bullet.active) {
        const dist = Math.sqrt(
          (bullet.x - this.boss.x) ** 2 + (bullet.y - this.boss.y) ** 2
        );
        
        if (dist < this.boss.width / 2) {
          this.damageBoss(bullet.damage);
          bullet.active = false;
        }
      }
    }
  }

  private checkEnemyBulletCollisions(): void {
    if (this.player.invulnerable) return;
    
    const px = this.player.x;
    const py = this.player.y;
    const pr = this.player.width * PLAYER_HITBOX_RATIO / 2;
    
    for (const bullet of this.bulletPool) {
      if (!bullet.active || bullet.isPlayerBullet) continue;
      
      const dist = Math.sqrt((px - bullet.x) ** 2 + (py - bullet.y) ** 2);
      
      if (dist < pr + bullet.width / 2) {
        bullet.active = false;
        this.damagePlayer();
        break;
      }
    }
  }

  private checkPowerupCollisions(): void {
    const px = this.player.x;
    const py = this.player.y;
    const pr = this.player.width / 2;
    
    for (const powerup of this.powerups) {
      if (!powerup.active) continue;
      
      const dist = Math.sqrt((px - powerup.x) ** 2 + (py - powerup.y) ** 2);
      
      if (dist < pr + powerup.width / 2) {
        this.collectPowerup(powerup);
        powerup.active = false;
      }
    }
  }

  private damagePlayer(): void {
    this.player.health--;
    this.player.invulnerable = true;
    this.player.invulnerableTimer = PLAYER_INVULNERABLE_TIME;
    this.gameState.hitsReceived++;
    
    if (this.player.health <= 0) {
      this.gameOver();
    }
  }

  private damageBoss(damage: number): void {
    if (!this.boss) return;
    
    this.boss.health -= damage;
    this.gameState.bossDamageDealt += damage;
    this.gameState.score += damage;
    
    if (this.boss.health <= 0) {
      this.defeatBoss();
    }
  }

  private destroyEnemy(enemy: Enemy): void {
    enemy.active = false;
    this.gameState.enemiesDestroyed++;
    this.gameState.score += enemy.points;
    
    if (Math.random() < 0.15) {
      this.spawnPowerup(enemy.x, enemy.y);
    }
  }

  private spawnPowerup(x: number, y: number): void {
    const types: Array<'weapon' | 'shield' | 'bomb' | 'heal' | 'score'> = 
      ['weapon', 'shield', 'bomb', 'heal', 'score'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const config = POWERUP_CONFIG[type];
    const powerup: PowerUp = {
      id: uuidv4(),
      x, y,
      width: config.width,
      height: config.height,
      active: true,
      type,
      velocityY: config.velocityY,
    };
    
    this.powerups.push(powerup);
  }

  private collectPowerup(powerup: PowerUp): void {
    switch (powerup.type) {
      case 'weapon':
        this.player.weaponLevel = Math.min(4, this.player.weaponLevel + 1);
        break;
      case 'shield':
        this.player.invulnerable = true;
        this.player.invulnerableTimer = 5;
        break;
      case 'bomb':
        this.player.bombs++;
        break;
      case 'heal':
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 1);
        break;
      case 'score':
        this.gameState.score += 1000;
        break;
    }
    
    this.gameState.powerupsCollected++;
  }

  private manageWaves(delta: number): void {
    this.waveTimer += delta;
    
    const phase = this.gameState.phase;
    const enemiesForBoss = 15 + phase * 5;
    const totalEnemiesDestroyed = this.gameState.enemiesDestroyed;
    
    if (!this.bossSpawned && totalEnemiesDestroyed >= enemiesForBoss) {
      if (!this.bossWarningTriggered) {
        this.callbacks.onBossWarning();
        this.bossWarningTriggered = true;
        this.waveTimer = 0;
      } else if (this.waveTimer >= 3) {
        this.spawnBoss();
      }
    } else if (!this.bossSpawned && this.waveTimer >= 2 - phase * 0.3) {
      this.spawnWave();
      this.waveTimer = 0;
    }
  }

  private spawnWave(): void {
    const phase = this.gameState.phase;
    const enemyCount = 3 + Math.floor(Math.random() * (2 + phase));
    
    for (let i = 0; i < enemyCount; i++) {
      const type = this.getRandomEnemyType(phase);
      this.spawnEnemy(type);
    }
  }

  private getRandomEnemyType(phase: number): EnemyType {
    const types: EnemyType[] = phase === 1 
      ? ['A', 'A', 'B']
      : phase === 2 
      ? ['A', 'B', 'B', 'C', 'D']
      : ['A', 'B', 'C', 'D', 'E'];
    
    return types[Math.floor(Math.random() * types.length)];
  }

  private spawnEnemy(type: EnemyType): void {
    const config = ENEMY_CONFIG[type];
    const enemy: Enemy = {
      id: uuidv4(),
      x: 50 + Math.random() * (GAME_WIDTH - 100),
      y: -50,
      width: config.width,
      height: config.height,
      active: true,
      type,
      health: config.health + this.gameState.phase,
      maxHealth: config.health + this.gameState.phase,
      fireRate: config.fireRate,
      fireTimer: Math.random() * config.fireRate,
      movePattern: config.movePattern,
      moveTimer: 0,
      baseX: 50 + Math.random() * (GAME_WIDTH - 100),
      points: config.points,
    };
    
    enemy.baseX = enemy.x;
    this.enemies.push(enemy);
  }

  private spawnBoss(): void {
    const phase = this.gameState.phase;
    const config = BOSS_CONFIG[phase as 1 | 2 | 3];
    
    this.boss = {
      id: 'boss',
      x: GAME_WIDTH / 2,
      y: -100,
      width: config.width,
      height: config.height,
      active: true,
      name: config.name,
      health: config.health,
      maxHealth: config.health,
      phase: 1,
      attackTimer: 0,
      attackPattern: 0,
      moveTimer: 0,
      moveDirection: 1,
    };
    
    this.bossSpawned = true;
    
    const moveIn = () => {
      if (this.boss && this.boss.y < 120) {
        this.boss.y += 2;
        requestAnimationFrame(moveIn);
      }
    };
    moveIn();
  }

  private defeatBoss(): void {
    if (!this.boss) return;
    
    this.boss.active = false;
    this.gameState.score += 10000 * this.gameState.phase;
    
    if (this.gameState.phase >= 3) {
      this.victory();
    } else {
      this.gameState.phase++;
      this.boss = null;
      this.bossWarningTriggered = false;
      this.bossSpawned = false;
      this.gameState.currentBoss = null;
      
      this.player.weaponLevel = Math.min(4, this.player.weaponLevel + 1);
      this.player.bombs = Math.min(5, this.player.bombs + 1);
    }
  }

  private gameOver(): void {
    this.player.active = false;
    this.gameState.isGameOver = true;
    
    const result: GameResult = {
      score: this.gameState.score,
      phase: this.gameState.phase,
      time: this.gameState.time,
      powerupsCollected: this.gameState.powerupsCollected,
      hitsReceived: this.gameState.hitsReceived,
      enemiesDestroyed: this.gameState.enemiesDestroyed,
      bossDamageDealt: this.gameState.bossDamageDealt,
    };
    
    this.callbacks.onGameOver(result);
  }

  private victory(): void {
    this.gameState.isVictory = true;
    
    const result: GameResult = {
      score: this.gameState.score,
      phase: this.gameState.phase,
      time: this.gameState.time,
      powerupsCollected: this.gameState.powerupsCollected,
      hitsReceived: this.gameState.hitsReceived,
      enemiesDestroyed: this.gameState.enemiesDestroyed,
      bossDamageDealt: this.gameState.bossDamageDealt,
    };
    
    this.callbacks.onVictory(result);
  }

  getPlayer(): Player {
    return this.player;
  }

  getEnemies(): Enemy[] {
    return this.enemies;
  }

  getBullets(): Bullet[] {
    return this.bulletPool.filter(b => b.active);
  }

  getBoss(): Boss | null {
    return this.boss;
  }

  getPowerups(): PowerUp[] {
    return this.powerups;
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  restart(): void {
    this.player = this.createPlayer();
    this.bullets = [];
    this.enemies = [];
    this.powerups = [];
    this.boss = null;
    this.gameState = this.createInitialState();
    this.waveTimer = 0;
    this.bossWarningTriggered = false;
    this.bossSpawned = false;
    this.gameTime = 0;
    
    this.bulletPool.forEach(b => b.active = false);
  }
}
