export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface Run {
  id: string;
  userId: string;
  username: string;
  score: number;
  phase: number;
  time: number;
  powerupsCollected: number;
  hitsReceived: number;
  enemiesDestroyed: number;
  bossDamageDealt: number;
  createdAt: string;
}
