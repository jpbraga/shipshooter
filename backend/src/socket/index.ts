import { Server } from 'socket.io';
import { verifyToken } from '../utils/index.js';
import { readJSONL } from '../utils/index.js';
import { Run } from '../types/index.js';

let io: Server | null = null;

export function setupSocket(socketIo: Server): void {
  io = socketIo;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('authenticate', async (token: string) => {
      const userId = verifyToken(token);
      if (userId) {
        socket.data.userId = userId;
        socket.emit('authenticated');
      } else {
        socket.emit('auth_error', { error: 'Invalid token' });
      }
    });

    socket.on('request_leaderboard', async (phase?: number) => {
      try {
        let runs = await readJSONL<Run>('runs.jsonl');
        
        if (phase !== undefined) {
          runs = runs.filter(r => r.phase === phase);
        }
        
        const leaderboard = runs.sort((a, b) => b.score - a.score).slice(0, 20);
        socket.emit('leaderboard:update', leaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

export function getSocketIO(): Server | null {
  return io;
}
