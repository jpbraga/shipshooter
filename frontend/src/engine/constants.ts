export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 720;
export const PLAYER_SPEED = 280;
export const PLAYER_FIRE_RATE = 0.12;
export const PLAYER_HITBOX_RATIO = 0.3;
export const PLAYER_MAX_HEALTH = 3;
export const PLAYER_INVULNERABLE_TIME = 2.0;
export const PLAYER_STARTING_BOMBS = 3;

export const BULLET_SPEED_PLAYER = 600;
export const BULLET_SPEED_ENEMY = 250;
export const BULLET_POOL_SIZE = 500;

export const ENEMY_CONFIG = {
  A: {
    width: 40,
    height: 40,
    health: 1,
    fireRate: 2.0,
    movePattern: 'straight' as const,
    points: 100,
  },
  B: {
    width: 45,
    height: 45,
    health: 2,
    fireRate: 1.5,
    movePattern: 'sine' as const,
    points: 150,
  },
  C: {
    width: 60,
    height: 60,
    health: 5,
    fireRate: 2.5,
    movePattern: 'straight' as const,
    points: 300,
  },
  D: {
    width: 50,
    height: 50,
    health: 3,
    fireRate: 1.0,
    movePattern: 'stationary' as const,
    points: 200,
  },
  E: {
    width: 35,
    height: 35,
    health: 1,
    fireRate: 0,
    movePattern: 'chase' as const,
    points: 250,
  },
  subboss_light: {
    width: 80,
    height: 80,
    health: 25,
    fireRate: 0.8,
    movePattern: 'aggressive' as const,
    points: 1500,
  },
  subboss_heavy: {
    width: 100,
    height: 100,
    health: 50,
    fireRate: 1.2,
    movePattern: 'defensive' as const,
    points: 3000,
  },
  minion_fighter: {
    width: 35,
    height: 35,
    health: 8,
    fireRate: 1.0,
    movePattern: 'sine' as const,
    points: 200,
  },
  minion_bomber: {
    width: 40,
    height: 40,
    health: 10,
    fireRate: 1.5,
    movePattern: 'straight' as const,
    points: 250,
  },
};

export const POWERUP_CONFIG = {
  weapon: { width: 30, height: 30, velocityY: 100 },
  shield: { width: 30, height: 30, velocityY: 100 },
  bomb: { width: 30, height: 30, velocityY: 100 },
  heal: { width: 30, height: 30, velocityY: 100 },
  score: { width: 30, height: 30, velocityY: 100 },
};

export const BOSS_CONFIG = {
  1: {
    name: 'CRUISER',
    width: 180,
    height: 120,
    health: 500,
  },
  2: {
    name: 'FORTRESS',
    width: 220,
    height: 150,
    health: 1200,
  },
  3: {
    name: 'DREADNOUGHT',
    width: 280,
    height: 180,
    health: 3000,
  },
};

export const PHASE_SCORING = {
  enemyBase: 100,
  bossBonus: 10000,
  phaseBonus: 5000,
  noHitBonus: 2000,
  timeBonus: 100,
};

export const COLORS = {
  player: 0x00ffff,
  playerBullet: 0x00ff00,
  enemyBullet: 0xff4444,
  enemyA: 0xff6600,
  enemyB: 0xff00ff,
  enemyC: 0x884400,
  enemyD: 0x4444ff,
  enemyE: 0xffff00,
  boss: 0xff0000,
  powerupWeapon: 0x00ff00,
  powerupShield: 0x0088ff,
  powerupBomb: 0xff8800,
  powerupHeal: 0xff44ff,
  powerupScore: 0xffff00,
  background: 0x0a0a1a,
  stars: 0xffffff,
};
