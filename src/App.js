import React, { useState, useEffect } from 'react';
import { fetchModel } from './lib/fetchModelData';
import TopBar from './components/TopBar';
import LoginRegister from './components/LoginRegister';
import UserList from './components/UserList';
import UserDetail from './components/UserDetail';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = await fetchModel('/admin/session');
        if (sessionData.logged_in) {
          // Get full user data
          const userData = await fetchModel(`/user/${sessionData.user_id}`);
          setUser(userData);
        }
      } catch (error) {
        console.log('No active session');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setSelectedUserId(userData._id); // Show logged-in user's details by default
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedUserId(null);
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <TopBar user={user} onLogout={handleLogout} />
      
      {user ? (
        <div className="app-content">
          <UserList 
            onUserSelect={handleUserSelect} 
            selectedUserId={selectedUserId}
          />
          <UserDetail userId={selectedUserId} />
        </div>
      ) : (
        <LoginRegister onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
