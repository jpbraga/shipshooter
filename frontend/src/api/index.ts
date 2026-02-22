const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export interface LoginResponse {
  token: string;
  user: { id: string; username: string; createdAt: string };
}

export interface RegisterResponse extends LoginResponse {}

export interface RunData {
  score: number;
  phase: number;
  time: number;
  powerupsCollected: number;
  hitsReceived: number;
  enemiesDestroyed: number;
  bossDamageDealt: number;
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

export const api = {
  auth: {
    register: (username: string, password: string) =>
      fetchApi<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    login: (username: string, password: string) =>
      fetchApi<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
  },
  runs: {
    submit: (data: RunData) =>
      fetchApi<{ runId: string; score: number }>('/runs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMyRuns: () =>
      fetchApi<RunData[]>('/runs/me'),
  },
  leaderboard: {
    get: (phase?: number) =>
      fetchApi<LeaderboardEntry[]>(`/leaderboard${phase ? `?phase=${phase}` : ''}`),
  },
};
