import { GameResult } from '../../engine/types';

interface GameOverOverlayProps {
  result: GameResult;
  onSubmitScore: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  submitting: boolean;
}

export default function GameOverOverlay({ 
  result, 
  onSubmitScore, 
  onRestart, 
  onMainMenu, 
  submitting 
}: GameOverOverlayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-overlay">
      <div className="game-over-title">GAME OVER</div>
      
      <div style={{ marginTop: 30, textAlign: 'center' }}>
        <p style={{ fontSize: 24, color: '#ffff00', marginBottom: 20 }}>
          FINAL SCORE: {result.score.toLocaleString()}
        </p>
        
        <div style={{ color: '#888', fontSize: 14 }}>
          <p>Phase Reached: {result.phase}</p>
          <p>Time Survived: {formatTime(result.time)}</p>
          <p>Enemies Destroyed: {result.enemiesDestroyed}</p>
          <p>Power-ups Collected: {result.powerupsCollected}</p>
          <p>Hits Received: {result.hitsReceived}</p>
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
        <button className="btn btn-secondary" onClick={onRestart}>
          Try Again
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
