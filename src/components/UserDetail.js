import React, { useState, useEffect } from 'react';
import { fetchModel } from '../lib/fetchModelData';
import './UserDetail.css';

function UserDetail({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        setLoading(true);
        const userData = await fetchModel(`/user/${userId}`);
        setUser(userData);
        setError('');
      } catch (error) {
        console.error('Error loading user:', error);
        setError('Failed to load user details');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId]);

  if (!userId) {
    return (
      <div className="user-detail">
        <div className="no-selection">
          <h2>Welcome to Photo Sharing App</h2>
          <p>Select a user from the list to view their details and photos.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="user-detail">
        <div className="loading">Loading user details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-detail">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-detail">
        <div className="error">User not found</div>
      </div>
    );
  }

  return (
    <div className="user-detail">
      <div className="user-detail-card">
        <h2>{user.first_name} {user.last_name}</h2>
        
        <div className="user-info">
          {user.location && (
            <div className="info-item">
              <strong>Location:</strong> {user.location}
            </div>
          )}
          
          {user.occupation && (
            <div className="info-item">
              <strong>Occupation:</strong> {user.occupation}
            </div>
          )}
          
          {user.description && (
            <div className="info-item">
              <strong>Description:</strong> {user.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDetail; 