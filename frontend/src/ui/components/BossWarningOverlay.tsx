export default function BossWarningOverlay() {
  return (
    <div className="game-overlay" style={{ background: 'rgba(50, 0, 0, 0.9)' }}>
      <div className="warning-text">⚠️ WARNING ⚠️</div>
      <div style={{ fontSize: 24, color: '#ff6600', marginTop: 20 }}>
        BOSS INCOMING
      </div>
      <div style={{ fontSize: 16, color: '#888', marginTop: 20 }}>
        PREPARE YOURSELF
      </div>
    </div>
  );
}
