export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

export interface Player extends Entity {
  health: number;
  maxHealth: number;
  weaponLevel: number;
  bombs: number;
  invulnerable: boolean;
  invulnerableTimer: number;
  fireTimer: number;
}

export interface Bullet extends Entity {
  velocityX: number;
  velocityY: number;
  isPlayerBullet: boolean;
  damage: number;
}

export type EnemyType = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Enemy extends Entity {
  type: EnemyType;
  health: number;
  maxHealth: number;
  fireTimer: number;
  fireRate: number;
  movePattern: 'straight' | 'zigzag' | 'sine' | 'chase' | 'stationary';
  moveTimer: number;
  baseX: number;
  points: number;
}

export type BossPhase = 1 | 2 | 3;

export interface Boss extends Entity {
  name: string;
  health: number;
  maxHealth: number;
  phase: BossPhase;
  attackTimer: number;
  attackPattern: number;
  moveTimer: number;
  moveDirection: number;
}

export type PowerUpType = 'weapon' | 'shield' | 'bomb' | 'heal' | 'score';

export interface PowerUp extends Entity {
  type: PowerUpType;
  velocityY: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  bomb: boolean;
  pause: boolean;
}

export interface GameState {
  playerHealth: number;
  playerMaxHealth: number;
  score: number;
  phase: number;
  weaponLevel: number;
  bombs: number;
  currentBoss: Boss | null;
  isPaused: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  time: number;
  powerupsCollected: number;
  hitsReceived: number;
  enemiesDestroyed: number;
  bossDamageDealt: number;
}

export interface GameResult {
  score: number;
  phase: number;
  time: number;
  powerupsCollected: number;
  hitsReceived: number;
  enemiesDestroyed: number;
  bossDamageDealt: number;
}

export type BulletPattern = 'radial' | 'spiral' | 'aimed' | 'wave' | 'rotating';

export interface Wave {
  enemies: Array<{
    type: EnemyType;
    x: number;
    delay: number;
  }>;
  delay: number;
}

export interface PhaseConfig {
  waves: Wave[];
  backgroundSpeed: number;
  enemyFrequency: number;
  bossName: string;
  bossConfig: Partial<Boss>;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  score: number;
  phase: number;
  time: number;
  createdAt: string;
}
