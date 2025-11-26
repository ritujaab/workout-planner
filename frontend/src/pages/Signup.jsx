import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useSignup } from '../hooks/useSignup';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup, isLoading, error } = useSignup();

  const handleSubmit = async (event) => {
    event.preventDefault();
    await signup(email, password);
  };

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <h2>Create your account</h2>
      <p className="muted">Set up Workout Planner in just a few seconds.</p>

      <label htmlFor="signup-email">Email address</label>
      <input
        id="signup-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <label htmlFor="signup-password">Password</label>
      <input
        id="signup-password"
        type="password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <p className="hint">Use at least 8 characters with a mix of letters, numbers, and symbols.</p>

      <button type="submit" className="primary-button" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Sign up'}
      </button>

      {error && <div className="error">{error}</div>}

      <p className="muted">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
};

export default Signup;
