import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../App';
import { api } from '../../api';
import { connectSocket } from '../../api/socket';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.auth.login(username, password);
      login(result.token, result.user);
      connectSocket();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-container">
      <h1 className="game-title">LOGIN</h1>
      
      <form onSubmit={handleSubmit} style={{ width: 300, marginTop: 30 }}>
        {error && (
          <p style={{ color: '#ff4444', marginBottom: 15 }}>{error}</p>
        )}

        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: 10 }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'LOGIN'}
        </button>
      </form>

      <p style={{ marginTop: 20, color: '#888' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: '#00ffff' }}>
          Register
        </Link>
      </p>
    </div>
  );
}
