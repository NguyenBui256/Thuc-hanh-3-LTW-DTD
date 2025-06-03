import React, { useState, useEffect } from 'react';
import { fetchModel } from './lib/fetchModelData';
import { getToken, setToken, removeToken } from './lib/fetchModelData';
import TopBar from './components/TopBar';
import LoginRegister from './components/LoginRegister';
import UserList from './components/UserList';
import UserDetail from './components/UserDetail';
import PhotoUpload from './components/PhotoUpload';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [refreshPhotos, setRefreshPhotos] = useState(0);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = getToken();
        if (token) {
          // Try to get session info using existing token
          const sessionData = await fetchModel('/admin/session');
          if (sessionData.logged_in) {
            // Get full user data
            const userData = await fetchModel(`/user/${sessionData.user_id}`);
            setUser(userData);
            setSelectedUserId(userData._id);
          }
        }
      } catch (error) {
        console.log('No active session or invalid token');
        // Clear invalid token
        removeToken();
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = (userData) => {
    // Store JWT token
    if (userData.token) {
      setToken(userData.token);
    }
    setUser(userData);
    setSelectedUserId(userData._id); // Show logged-in user's details by default
  };

  const handleLogout = () => {
    // Clear JWT token
    removeToken();
    setUser(null);
    setSelectedUserId(null);
    setShowPhotoUpload(false);
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
  };

  const handleAddPhotoClick = () => {
    setShowPhotoUpload(true);
  };

  const handlePhotoUploaded = (photo) => {
    setShowPhotoUpload(false);
    // If the uploaded photo is for the currently selected user, refresh the photos
    if (photo.user_id === selectedUserId) {
      setRefreshPhotos(prev => prev + 1);
    }
    // If no user is selected or different user, switch to the uploader's photos
    if (!selectedUserId || photo.user_id !== selectedUserId) {
      setSelectedUserId(photo.user_id);
    }
  };

  const handleCancelUpload = () => {
    setShowPhotoUpload(false);
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
      <TopBar 
        user={user} 
        onLogout={handleLogout} 
        onAddPhotoClick={handleAddPhotoClick}
      />
      
      {user ? (
        <div className="app-content">
          <UserList 
            onUserSelect={handleUserSelect} 
            selectedUserId={selectedUserId}
          />
          <UserDetail 
            userId={selectedUserId} 
            refreshKey={refreshPhotos}
          />
        </div>
      ) : (
        <LoginRegister onLogin={handleLogin} />
      )}

      {showPhotoUpload && (
        <PhotoUpload 
          onPhotoUploaded={handlePhotoUploaded}
          onCancel={handleCancelUpload}
        />
      )}
    </div>
  );
}

export default App;
