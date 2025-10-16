import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: '#1a1a1a',
      borderBottom: '2px solid #333',
    }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#fff' }}>Stealth Town</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            to="/town"
            style={{
              padding: '0.5rem 1rem',
              textDecoration: 'none',
              color: isActive('/town') ? '#4CAF50' : '#fff',
              fontWeight: isActive('/town') ? 'bold' : 'normal',
              borderBottom: isActive('/town') ? '2px solid #4CAF50' : 'none',
            }}
          >
            Town
          </Link>
          <Link
            to="/character"
            style={{
              padding: '0.5rem 1rem',
              textDecoration: 'none',
              color: isActive('/character') ? '#4CAF50' : '#fff',
              fontWeight: isActive('/character') ? 'bold' : 'normal',
              borderBottom: isActive('/character') ? '2px solid #4CAF50' : 'none',
            }}
          >
            Character
          </Link>
          <Link
            to="/dungeon"
            style={{
              padding: '0.5rem 1rem',
              textDecoration: 'none',
              color: isActive('/dungeon') ? '#4CAF50' : '#fff',
              fontWeight: isActive('/dungeon') ? 'bold' : 'normal',
              borderBottom: isActive('/dungeon') ? '2px solid #4CAF50' : 'none',
            }}
          >
            Dungeon
          </Link>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {user && (
          <span style={{ color: '#fff' }}>@{user.username}</span>
        )}
        <button
          onClick={logout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f44336',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
