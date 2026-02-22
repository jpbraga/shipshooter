import { EnemyType } from './types';

export interface WaveConfig {
  enemies: Array<{
    type: EnemyType | 'subboss_light' | 'subboss_heavy';
    x: number;
    delay: number;
    health?: number;
  }>;
  delayAfter: number;
  requireClear?: boolean;
}

export interface SubBossConfig {
  type: 'subboss_light' | 'subboss_heavy';
  width: number;
  height: number;
  health: number;
  fireRate: number;
  movePattern: 'aggressive' | 'defensive' | 'erratic';
  points: number;
}

export interface BossMinionConfig {
  type: 'minion_fighter' | 'minion_bomber';
  health: number;
  count: number;
  spawnInterval: number;
}

export interface PhaseConfig {
  id: number;
  name: string;
  waves: WaveConfig[];
  subBoss?: SubBossConfig;
  subBossWaveIndex?: number;
  powerupInterval: number;
  bossConfig: {
    name: string;
    width: number;
    height: number;
    health: number;
    phases: number;
    mechanics: ('minions' | 'shield' | 'cannons')[];
    minionConfig?: BossMinionConfig;
    shieldHealth?: number;
    shieldRegenRate?: number;
  };
}

export const SUBBOSS_CONFIGS: Record<string, SubBossConfig> = {
  subboss_light: {
    type: 'subboss_light',
    width: 80,
    height: 80,
    health: 25,
    fireRate: 0.8,
    movePattern: 'aggressive',
    points: 1500,
  },
  subboss_heavy: {
    type: 'subboss_heavy',
    width: 100,
    height: 100,
    health: 50,
    fireRate: 1.2,
    movePattern: 'defensive',
    points: 3000,
  },
};

export const PHASE_CONFIGS: PhaseConfig[] = [
  {
    id: 1,
    name: 'SECTOR ALPHA - Outer Rim',
    waves: [
      {
        enemies: [
          { type: 'A', x: 200, delay: 0 },
          { type: 'A', x: 400, delay: 0.2 },
          { type: 'A', x: 600, delay: 0.4 },
        ],
        delayAfter: 2,
      },
      {
        enemies: [
          { type: 'A', x: 150, delay: 0 },
          { type: 'B', x: 400, delay: 0.3 },
          { type: 'A', x: 650, delay: 0.6 },
        ],
        delayAfter: 2.5,
      },
      {
        enemies: [
          { type: 'B', x: 200, delay: 0 },
          { type: 'A', x: 400, delay: 0.2 },
          { type: 'B', x: 600, delay: 0.4 },
          { type: 'A', x: 800, delay: 0.6 },
        ],
        delayAfter: 3,
      },
      {
        enemies: [
          { type: 'A', x: 100, delay: 0 },
          { type: 'A', x: 300, delay: 0.1 },
          { type: 'A', x: 500, delay: 0.2 },
          { type: 'A', x: 700, delay: 0.3 },
          { type: 'A', x: 850, delay: 0.4 },
        ],
        delayAfter: 4,
      },
      {
        enemies: [
          { type: 'B', x: 250, delay: 0 },
          { type: 'B', x: 500, delay: 0 },
          { type: 'B', x: 750, delay: 0 },
        ],
        delayAfter: 3,
        requireClear: true,
      },
    ],
    powerupInterval: 8,
    bossConfig: {
      name: 'CRUISER',
      width: 180,
      height: 120,
      health: 500,
      phases: 3,
      mechanics: ['cannons'],
    },
  },
  {
    id: 2,
    name: 'SECTOR BETA - Battle Zone',
    waves: [
      {
        enemies: [
          { type: 'B', x: 200, delay: 0 },
          { type: 'C', x: 480, delay: 0 },
          { type: 'B', x: 760, delay: 0 },
        ],
        delayAfter: 3,
      },
      {
        enemies: [
          { type: 'A', x: 150, delay: 0 },
          { type: 'A', x: 350, delay: 0.1 },
          { type: 'D', x: 480, delay: 0.3 },
          { type: 'A', x: 610, delay: 0.1 },
          { type: 'A', x: 810, delay: 0 },
        ],
        delayAfter: 3.5,
      },
      {
        enemies: [
          { type: 'subboss_light', x: 480, delay: 0 },
        ],
        delayAfter: 5,
        requireClear: true,
      },
      {
        enemies: [
          { type: 'B', x: 200, delay: 0 },
          { type: 'B', x: 400, delay: 0.15 },
          { type: 'C', x: 480, delay: 0.3 },
          { type: 'B', x: 560, delay: 0.15 },
          { type: 'B', x: 760, delay: 0 },
        ],
        delayAfter: 4,
      },
      {
        enemies: [
          { type: 'D', x: 250, delay: 0 },
          { type: 'D', x: 480, delay: 0.2 },
          { type: 'D', x: 710, delay: 0.4 },
        ],
        delayAfter: 4,
      },
      {
        enemies: [
          { type: 'C', x: 300, delay: 0 },
          { type: 'B', x: 480, delay: 0.2 },
          { type: 'C', x: 660, delay: 0.4 },
        ],
        delayAfter: 5,
        requireClear: true,
      },
    ],
    subBoss: SUBBOSS_CONFIGS.subboss_light,
    subBossWaveIndex: 2,
    powerupInterval: 7,
    bossConfig: {
      name: 'FORTRESS',
      width: 220,
      height: 150,
      health: 1200,
      phases: 3,
      mechanics: ['minions', 'cannons'],
      minionConfig: {
        type: 'minion_fighter',
        health: 5,
        count: 4,
        spawnInterval: 4,
      },
    },
  },
  {
    id: 3,
    name: 'SECTOR GAMMA - Enemy Core',
    waves: [
      {
        enemies: [
          { type: 'C', x: 200, delay: 0 },
          { type: 'D', x: 480, delay: 0 },
          { type: 'C', x: 760, delay: 0 },
        ],
        delayAfter: 3,
      },
      {
        enemies: [
          { type: 'E', x: 200, delay: 0 },
          { type: 'E', x: 400, delay: 0.1 },
          { type: 'E', x: 560, delay: 0.2 },
          { type: 'E', x: 760, delay: 0.3 },
        ],
        delayAfter: 3,
      },
      {
        enemies: [
          { type: 'A', x: 100, delay: 0 },
          { type: 'B', x: 250, delay: 0 },
          { type: 'C', x: 400, delay: 0 },
          { type: 'D', x: 480, delay: 0 },
          { type: 'C', x: 560, delay: 0 },
          { type: 'B', x: 710, delay: 0 },
          { type: 'A', x: 860, delay: 0 },
        ],
        delayAfter: 4,
      },
      {
        enemies: [
          { type: 'subboss_heavy', x: 480, delay: 0 },
        ],
        delayAfter: 6,
        requireClear: true,
      },
      {
        enemies: [
          { type: 'D', x: 200, delay: 0 },
          { type: 'D', x: 480, delay: 0.3 },
          { type: 'D', x: 760, delay: 0.6 },
        ],
        delayAfter: 4,
      },
      {
        enemies: [
          { type: 'E', x: 150, delay: 0 },
          { type: 'C', x: 350, delay: 0.2 },
          { type: 'E', x: 480, delay: 0.4 },
          { type: 'C', x: 610, delay: 0.6 },
          { type: 'E', x: 810, delay: 0.8 },
        ],
        delayAfter: 5,
      },
      {
        enemies: [
          { type: 'subboss_light', x: 300, delay: 0 },
          { type: 'subboss_light', x: 660, delay: 0.5 },
        ],
        delayAfter: 7,
        requireClear: true,
      },
      {
        enemies: [
          { type: 'B', x: 200, delay: 0 },
          { type: 'C', x: 400, delay: 0.1 },
          { type: 'D', x: 480, delay: 0.2 },
          { type: 'C', x: 560, delay: 0.3 },
          { type: 'B', x: 760, delay: 0.4 },
        ],
        delayAfter: 5,
        requireClear: true,
      },
    ],
    subBoss: SUBBOSS_CONFIGS.subboss_heavy,
    subBossWaveIndex: 3,
    powerupInterval: 6,
    bossConfig: {
      name: 'DREADNOUGHT',
      width: 280,
      height: 180,
      health: 3000,
      phases: 4,
      mechanics: ['minions', 'shield', 'cannons'],
      minionConfig: {
        type: 'minion_bomber',
        health: 8,
        count: 5,
        spawnInterval: 5,
      },
      shieldHealth: 500,
      shieldRegenRate: 50,
    },
  },
];
