import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// styles in main.scss

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!userId.trim()) {
          setError('Please enter your User ID');
          setIsLoading(false);
          return;
        }
        await login(userId);
        navigate('/town');
      } else {
        const response = await register();
        setRegisteredUserId(response.userId);
        // Don't navigate yet, show the user ID first
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAndContinue = () => {
    if (registeredUserId) {
      navigator.clipboard.writeText(registeredUserId);
      navigate('/town');
    }
  };

  // Show success screen after registration
  if (registeredUserId) {
    return (
      <div className="login-page">
        <div className="login-container">
          <h1>Registration Successful!</h1>
          <p className="subtitle">Save this User ID to login later</p>

          <div className="user-id-display">
            <label>Your User ID:</label>
            <div className="user-id-box">
              <code>{registeredUserId}</code>
            </div>
            <p className="hint">
              Copy this ID and save it somewhere safe. You'll need it to login.
            </p>
          </div>

          <button onClick={handleCopyAndContinue} className="submit-button">
            Copy ID & Continue to Town
          </button>

          <button
            onClick={() => setRegisteredUserId(null)}
            className="secondary-button"
            style={{ marginTop: '10px' }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Stealth Town</h1>
        <p className="subtitle">MVP Demo - Town Investment Loop</p>

        <div className="mode-toggle">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            Login
          </button>
          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'login' ? (
            <div className="form-group">
              <label htmlFor="userId">User ID</label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Paste your user ID here"
                disabled={isLoading}
              />
              <p className="hint">Don't have an ID? Register first to get one.</p>
            </div>
          ) : (
            <div className="form-group">
              <p className="hint">
                Click Register to create a new account. You'll get a User ID that you can use to login later.
              </p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Loading...' : mode === 'login' ? 'Login' : 'Create New Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
