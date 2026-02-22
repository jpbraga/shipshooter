import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, LeaderboardEntry } from '../../api';
import { socket } from '../../api/socket';
import { useAuth } from '../../App';

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [phaseFilter, setPhaseFilter] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadLeaderboard();

    const handleLeaderboardUpdate = (data: LeaderboardEntry[]) => {
      setEntries(data.slice(0, 20));
    };

    socket.on('leaderboard:update', handleLeaderboardUpdate);

    return () => {
      socket.off('leaderboard:update', handleLeaderboardUpdate);
    };
  }, [phaseFilter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await api.leaderboard.get(phaseFilter || undefined);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  return (
    <div className="screen-container">
      <h1 className="game-title" style={{ fontSize: 36 }}>LEADERBOARD</h1>

      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <button 
          className={`btn ${phaseFilter === null ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setPhaseFilter(null)}
          style={{ padding: '8px 20px', fontSize: 14 }}
        >
          All Phases
        </button>
        {[1, 2, 3].map(phase => (
          <button
            key={phase}
            className={`btn ${phaseFilter === phase ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPhaseFilter(phase)}
            style={{ padding: '8px 20px', fontSize: 14, marginLeft: 5 }}
          >
            Phase {phase}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Loading...</p>
      ) : entries.length === 0 ? (
        <p style={{ color: '#888' }}>No scores yet. Be the first!</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Score</th>
              <th>Phase</th>
              <th>Time</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={entry.id}>
                <td>{index + 1}</td>
                <td style={{ 
                  color: entry.username === user?.username ? '#00ffff' : undefined 
                }}>
                  {entry.username}
                </td>
                <td>{entry.score.toLocaleString()}</td>
                <td>{entry.phase}</td>
                <td>{formatTime(entry.time)}</td>
                <td>{formatDate(entry.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 40 }}>
        {user ? (
          <Link to="/" className="btn btn-secondary">
            Back to Menu
          </Link>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/login" className="btn btn-primary">
              Login to Play
            </Link>
            <Link to="/" className="btn btn-secondary">
              Back
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
