import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readJSON, readJSONL, appendJSONL, verifyToken } from '../utils/index.js';
import { Run } from '../types/index.js';
import { getSocketIO } from '../socket/index.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const userId = verifyToken(token);
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const {
      score,
      phase,
      time,
      powerupsCollected,
      hitsReceived,
      enemiesDestroyed,
      bossDamageDealt,
    } = req.body;

    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    const users = await readJSON<{ id: string; username: string }[]>('users.json', []);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const run: Run = {
      id: uuidv4(),
      userId,
      username: user.username,
      score,
      phase,
      time,
      powerupsCollected,
      hitsReceived,
      enemiesDestroyed,
      bossDamageDealt,
      createdAt: new Date().toISOString(),
    };

    await appendJSONL('runs.jsonl', run);

    const io = getSocketIO();
    if (io) {
      const allRuns = await readJSONL<Run>('runs.jsonl');
      const sorted = allRuns.sort((a, b) => b.score - a.score).slice(0, 20);
      io.emit('leaderboard:update', sorted);
    }

    res.status(201).json({ runId: run.id, score: run.score });
  } catch (error) {
    console.error('Submit run error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const userId = verifyToken(token);
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const allRuns = await readJSONL<Run>('runs.jsonl');
    const userRuns = allRuns.filter(r => r.userId === userId);

    res.json(userRuns);
  } catch (error) {
    console.error('Get runs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
