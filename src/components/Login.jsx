import React, { useState } from 'react';
import { loginUser } from '../api/mockApi';

const Login = ({ onLoginSuccess, addToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password', 'error');
      return;
    }

    setIsLoggingIn(true);
    try {
      await loginUser(email, password);
      onLoginSuccess();
    } catch (error) {
      addToast('Login failed. Please try again.', 'error');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-box">
        <div className="login-content">
          <div className="login-avatar-container">
            <div className="login-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2>Sign In to Drafts</h2>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <input 
                type="email" 
                className="login-input" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoggingIn}
              />
            </div>
            <div className="input-group">
              <input 
                type="password" 
                className="login-input" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoggingIn}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn login-btn"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <span className="loader"></span> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
