import { Boss } from '../../engine/types';

interface HUDProps {
  health: number;
  maxHealth: number;
  score: number;
  phase: number;
  weaponLevel: number;
  bombs: number;
  boss: Boss | null;
}

export default function HUD({ health, maxHealth, score, phase, weaponLevel, bombs, boss }: HUDProps) {
  const healthPercent = (health / maxHealth) * 100;

  return (
    <>
      <div className="hud">
        <div className="hud-left">
          <div className="hud-item">
            <span className="hud-icon">❤️</span>
            <div className="health-bar">
              <div 
                className="health-fill" 
                style={{ width: `${healthPercent}%` }}
              />
            </div>
            <span>{health}/{maxHealth}</span>
          </div>
          
          <div className="hud-item">
            <span className="hud-icon">🔫</span>
            <div className="weapon-indicator">
              {[1, 2, 3, 4].map(level => (
                <div 
                  key={level}
                  className={`weapon-level ${level <= weaponLevel ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>

          <div className="hud-item">
            <span className="hud-icon">💣</span>
            <span>{bombs}</span>
          </div>
        </div>

        <div className="hud-center">
          <div className="hud-item" style={{ fontSize: 24 }}>
            PHASE {phase}
          </div>
        </div>

        <div className="hud-right">
          <div className="hud-item" style={{ fontSize: 24, color: '#ffff00' }}>
            SCORE: {score.toLocaleString()}
          </div>
        </div>
      </div>

      {boss && (
        <div className="boss-health-bar">
          <div className="boss-name">⚠️ {boss.name} ⚠️</div>
          <div className="boss-health-bar-inner">
            <div 
              className="boss-health-fill"
              style={{ width: `${(boss.health / boss.maxHealth) * 100}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
}
