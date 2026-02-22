import { useEffect, useRef, useState } from 'react';
import GameCanvas from '../../engine/GameCanvas';
import { GameState, GameResult } from '../../engine/types';

interface GameCanvasWrapperProps {
  onGameStateChange: (state: GameState) => void;
  onBossWarning: () => void;
  onGameOver: (result: GameResult) => void;
  onVictory: (result: GameResult) => void;
}

export default function GameCanvasWrapper({
  onGameStateChange,
  onBossWarning,
  onGameOver,
  onVictory,
}: GameCanvasWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameCanvas | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current || gameRef.current) return;

    const container = containerRef.current;
    let cancelled = false;

    const initGame = async () => {
      if (cancelled || !container) return;
      
      const game = new GameCanvas(container, {
        onGameStateChange,
        onBossWarning,
        onGameOver,
        onVictory,
      });

      try {
        await game.init();
        if (!cancelled) {
          gameRef.current = game;
        } else {
          game.destroy();
        }
      } catch (error) {
        console.error('Failed to initialize game:', error);
      }
    };

    initGame();

    return () => {
      cancelled = true;
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
    };
  }, [isReady, onGameStateChange, onBossWarning, onGameOver, onVictory]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%'
      }}
    />
  );
}
