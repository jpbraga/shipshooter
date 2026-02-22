import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { connectSocket } from '../../api/socket';

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleStartGame = () => {
    connectSocket();
    navigate('/game');
  };

  return (
    <div className="screen-container">
      <h1 className="game-title">SPACE SHOOTER</h1>
      <h2 style={{ color: '#888', marginBottom: 40 }}>Bullet Hell</h2>
      
      <p style={{ color: '#00ffff', marginBottom: 30 }}>
        Welcome, <strong>{user?.username}</strong>!
      </p>

      <button className="btn btn-primary" onClick={handleStartGame}>
        START GAME
      </button>
      
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate('/leaderboard')}
        style={{ marginTop: 10 }}
      >
        LEADERBOARD
      </button>

      <button 
        className="btn btn-secondary" 
        onClick={logout}
        style={{ marginTop: 10 }}
      >
        LOGOUT
      </button>

      <div style={{ marginTop: 50, color: '#666', textAlign: 'center' }}>
        <p>Controls:</p>
        <p>WASD / Arrow Keys - Move</p>
        <p>Space - Bomb (when available)</p>
        <p>P - Pause</p>
      </div>
    </div>
  );
}
