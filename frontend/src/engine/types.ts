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
  missileFireTimer: number;
  tiltAngle: number;
  isCharging: boolean;
  chargeTimer: number;
  chargeTargetX: number;
  chargeTargetY: number;
  targetTilt: number;
}

export interface Bullet extends Entity {
  velocityX: number;
  velocityY: number;
  isPlayerBullet: boolean;
  damage: number;
  isHoming?: boolean;
  targetId?: string;
  trail?: Array<{x: number; y: number; alpha: number}>;
}

export type EnemyType = 'A' | 'B' | 'C' | 'D' | 'E' | 'subboss_light' | 'subboss_heavy' | 'minion_fighter' | 'minion_bomber';

export interface Enemy extends Entity {
  type: EnemyType;
  health: number;
  maxHealth: number;
  fireTimer: number;
  fireRate: number;
  movePattern: 'straight' | 'zigzag' | 'sine' | 'chase' | 'stationary' | 'aggressive' | 'defensive' | 'erratic';
  moveTimer: number;
  baseX: number;
  points: number;
  tiltAngle: number;
  isCharging: boolean;
  chargeTimer: number;
  chargeTargetX: number;
  chargeTargetY: number;
  targetTilt: number;
  isSubBoss?: boolean;
  isMinion?: boolean;
  parentBossId?: string;
}

export type BossPhase = 1 | 2 | 3 | 4;

export interface Boss extends Entity {
  name: string;
  health: number;
  maxHealth: number;
  phase: BossPhase;
  attackTimer: number;
  attackPattern: number;
  moveTimer: number;
  moveDirection: number;
  mechanics: ('minions' | 'shield' | 'cannons')[];
  minionsActive: boolean;
  shieldActive: boolean;
  shieldHealth: number;
  shieldMaxHealth: number;
  vulnerabilityTimer: number;
  shieldCooldownTimer: number;
  minionSpawnTimer: number;
  tiltAngle: number;
  isCharging: boolean;
  chargeTimer: number;
  chargeTargetX: number;
  chargeTargetY: number;
  targetTilt: number;
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
  currentWave: number;
  waitingForClear: boolean;
  bombFlashActive: boolean;
  bombFlashTimer: number;
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
