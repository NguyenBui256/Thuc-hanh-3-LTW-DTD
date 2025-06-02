import React, { useState } from 'react';
import { postModel } from '../lib/fetchModelData';
import './LoginRegister.css';

function LoginRegister({ onLogin }) {
  const [loginName, setLoginName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginName.trim()) {
      setError('Please enter a login name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await postModel('/admin/login', { login_name: loginName.trim() });
      onLogin(response);
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-register-container">
      <div className="login-register-card">
        <h2>Welcome to Photo Sharing App</h2>
        <p>Please log in to continue</p>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="loginName">Login Name:</label>
            <input
              type="text"
              id="loginName"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              placeholder="Enter your login name"
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-hints">
          <h4>Available login names:</h4>
          <ul>
            <li>aprilludgate</li>
            <li>ellenripley</li>
            <li>ianmalcolm</li>
            <li>johnousterhout</li>
            <li>peregrintook</li>
            <li>reykenobi</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LoginRegister; 