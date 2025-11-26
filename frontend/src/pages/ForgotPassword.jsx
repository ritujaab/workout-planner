import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuthContext } from '../hooks/useAuthContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { dispatch } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (password !== confirmPassword) {
      setIsSubmitting(false);
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/user/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to reset password');
      }

      //localStorage.setItem('user', JSON.stringify(data));
      //dispatch({ type: 'LOGIN', payload: data });
      toast.success('Password updated! Redirecting…');
      navigate('/login');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <h2>Reset your password</h2>
      <p className="muted">Enter your email and choose a new password.</p>

      <label htmlFor="forgot-email">Email address</label>
      <input
        id="forgot-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <label htmlFor="new-password">New password</label>
      <input
        id="new-password"
        type="password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <label htmlFor="confirm-password">Confirm new password</label>
      <input
        id="confirm-password"
        type="password"
        required
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />

      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? 'Updating…' : 'Update password'}
      </button>

      {error && <div className="error">{error}</div>}

      <p className="muted">
        Remember your password? <Link to="/login">Back to login</Link>
      </p>

    </form>
  );
};

export default ForgotPassword;

