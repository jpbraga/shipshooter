import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { api } from '../../api';
import { socket } from '../../api/socket';
import GameCanvas from '../components/GameCanvas';
import GameOverOverlay from '../components/GameOverOverlay';
import BossWarningOverlay from '../components/BossWarningOverlay';
import VictoryOverlay from '../components/VictoryOverlay';
import HUD from '../components/HUD';
import { GameState, GameResult } from '../../engine/types';

export default function Game() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showVictory, setShowVictory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    socket.on('leaderboard:update', () => {});
    return () => {
      socket.off('leaderboard:update');
    };
  }, []);

  const handleGameStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleBossWarning = useCallback(() => {
    setShowBossWarning(true);
    setTimeout(() => setShowBossWarning(false), 3000);
  }, []);

  const handleGameOver = useCallback((result: GameResult) => {
    setGameResult(result);
  }, []);

  const handleVictory = useCallback((result: GameResult) => {
    setGameResult(result);
    setShowVictory(true);
  }, []);

  const handleSubmitScore = async () => {
    if (!gameResult || submitting) return;
    
    setSubmitting(true);
    try {
      await api.runs.submit({
        score: gameResult.score,
        phase: gameResult.phase,
        time: gameResult.time,
        powerupsCollected: gameResult.powerupsCollected,
        hitsReceived: gameResult.hitsReceived,
        enemiesDestroyed: gameResult.enemiesDestroyed,
        bossDamageDealt: gameResult.bossDamageDealt,
      });
      
      navigate('/leaderboard');
    } catch (error) {
      console.error('Failed to submit score:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setGameResult(null);
    setGameState(null);
    setShowVictory(false);
  };

  const handleMainMenu = () => {
    navigate('/');
  };

  return (
    <div className="game-container">
      <div className="game-canvas-wrapper">
        <GameCanvas
          onGameStateChange={handleGameStateChange}
          onBossWarning={handleBossWarning}
          onGameOver={handleGameOver}
          onVictory={handleVictory}
        />
        
        {gameState && !gameResult && (
          <HUD 
            health={gameState.playerHealth}
            maxHealth={gameState.playerMaxHealth}
            score={gameState.score}
            phase={gameState.phase}
            weaponLevel={gameState.weaponLevel}
            bombs={gameState.bombs}
            boss={gameState.currentBoss}
          />
        )}

        {showBossWarning && <BossWarningOverlay />}

        {gameResult && !showVictory && (
          <GameOverOverlay
            result={gameResult}
            onSubmitScore={handleSubmitScore}
            onRestart={handleRestart}
            onMainMenu={handleMainMenu}
            submitting={submitting}
          />
        )}

        {showVictory && gameResult && (
          <VictoryOverlay
            result={gameResult}
            onSubmitScore={handleSubmitScore}
            onMainMenu={handleMainMenu}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}
