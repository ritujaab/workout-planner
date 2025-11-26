import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useLogin } from '../hooks/useLogin';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useLogin();

  const handleSubmit = async (event) => {
    event.preventDefault();
    await login(email, password);
  };

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <h2>Welcome back</h2>
      <p className="muted">Log in to manage your weekly training plan.</p>

      <label htmlFor="login-email">Email address</label>
      <input
        id="login-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <label htmlFor="login-password">Password</label>
      <input
        id="login-password"
        type="password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <div className="auth-card__actions">
        <Link to="/forgot-password" className="ghost-link">
          Forgot password?
        </Link>
      </div>

      <button type="submit" className="primary-button" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Login'}
      </button>

      {error && <div className="error">{error}</div>}

      <p className="muted">
        Need an account? <Link to="/signup">Create one</Link>
      </p>
    </form>
  );
};

export default Login;
