import { GameResult } from '../../engine/types';

interface VictoryOverlayProps {
  result: GameResult;
  onSubmitScore: () => void;
  onMainMenu: () => void;
  submitting: boolean;
}

export default function VictoryOverlay({ 
  result, 
  onSubmitScore, 
  onMainMenu, 
  submitting 
}: VictoryOverlayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-overlay" style={{ background: 'rgba(0, 30, 0, 0.9)' }}>
      <div className="victory-title">🏆 VICTORY! 🏆</div>
      
      <div style={{ fontSize: 24, color: '#00ff00', marginTop: 20 }}>
        YOU DEFEATED THE DREADNOUGHT!
      </div>
      
      <div style={{ marginTop: 30, textAlign: 'center' }}>
        <p style={{ fontSize: 32, color: '#ffff00', marginBottom: 20 }}>
          FINAL SCORE: {result.score.toLocaleString()}
        </p>
        
        <div style={{ color: '#888', fontSize: 14 }}>
          <p>Time: {formatTime(result.time)}</p>
          <p>Enemies Destroyed: {result.enemiesDestroyed}</p>
          <p>Power-ups Collected: {result.powerupsCollected}</p>
          <p>Hits Received: {result.hitsReceived}</p>
          <p>Boss Damage Dealt: {result.bossDamageDealt.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <button 
          className="btn btn-primary" 
          onClick={onSubmitScore}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Score'}
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <button className="btn btn-secondary" onClick={onMainMenu}>
          Main Menu
        </button>
      </div>
    </div>
  );
}
