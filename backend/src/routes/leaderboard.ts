import { Router } from 'express';
import { readJSONL } from '../utils/index.js';
import { Run } from '../types/index.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { phase } = req.query;

    let allRuns = await readJSONL<Run>('runs.jsonl');

    if (phase) {
      const phaseNum = parseInt(phase as string, 10);
      if (!isNaN(phaseNum) && phaseNum >= 1 && phaseNum <= 3) {
        allRuns = allRuns.filter(r => r.phase === phaseNum);
      }
    }

    const sorted = allRuns.sort((a, b) => b.score - a.score).slice(0, 20);

    res.json(sorted);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
