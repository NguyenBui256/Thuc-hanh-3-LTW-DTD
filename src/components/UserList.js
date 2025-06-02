import React, { useState, useEffect } from 'react';
import { fetchModel } from '../lib/fetchModelData';
import './UserList.css';

function UserList({ onUserSelect, selectedUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const userList = await fetchModel('/user/list');
        setUsers(userList);
        setError('');
      } catch (error) {
        console.error('Error loading users:', error);
        setError('Failed to load users');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="user-list">
        <h3>Users</h3>
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-list">
        <h3>Users</h3>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="user-list">
      <h3>Users</h3>
      <div className="user-list-items">
        {users.map(user => (
          <div
            key={user._id}
            className={`user-item ${selectedUserId === user._id ? 'selected' : ''}`}
            onClick={() => onUserSelect(user._id)}
          >
            <span className="user-name">
              {user.first_name} {user.last_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserList; 