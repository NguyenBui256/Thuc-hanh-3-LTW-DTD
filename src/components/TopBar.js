import React from 'react';
import { postModel } from '../lib/fetchModelData';
import './TopBar.css';

function TopBar({ user, onLogout }) {
  const handleLogout = async () => {
    try {
      await postModel('/admin/logout', {});
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      onLogout();
    }
  };

  return (
    <div className="top-bar">
      <div className="top-bar-content">
        <h1 className="app-title">Photo Sharing App</h1>
        
        <div className="user-section">
          {user ? (
            <div className="logged-in-section">
              <span className="welcome-message">
                Hi {user.first_name}
              </span>
              <button 
                className="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <span className="login-prompt">Please Login</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default TopBar; 