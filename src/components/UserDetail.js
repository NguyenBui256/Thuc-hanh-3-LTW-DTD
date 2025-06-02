import React, { useState, useEffect } from 'react';
import { fetchModel, postModel } from '../lib/fetchModelData';
import './UserDetail.css';

function UserDetail({ userId, refreshKey }) {
  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState({});

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setPhotos([]);
      setLoading(false);
      return;
    }

    const loadUserData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Load user details and photos in parallel
        const [userData, photosData] = await Promise.all([
          fetchModel(`/user/${userId}`),
          fetchModel(`/photosOfUser/${userId}`)
        ]);
        
        setUser(userData);
        setPhotos(photosData);
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user details');
        setUser(null);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId, refreshKey]);

  const handleAddComment = async (photoId) => {
    const comment = newComment[photoId];
    if (!comment || !comment.trim()) {
      return;
    }

    try {
      const response = await postModel(`/commentsOfPhoto/${photoId}`, {
        comment: comment.trim()
      });

      // Update the photos state with the new comment
      setPhotos(prevPhotos => 
        prevPhotos.map(photo => 
          photo._id === photoId 
            ? { ...photo, comments: [...photo.comments, response] }
            : photo
        )
      );

      // Clear the comment input
      setNewComment(prev => ({ ...prev, [photoId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleCommentChange = (photoId, value) => {
    setNewComment(prev => ({ ...prev, [photoId]: value }));
  };

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

      <div className="photos-section">
        <h3>Photos ({photos.length})</h3>
        
        {photos.length === 0 ? (
          <div className="no-photos">
            <p>No photos uploaded yet.</p>
          </div>
        ) : (
          <div className="photos-grid">
            {photos.map(photo => (
              <div key={photo._id} className="photo-card">
                <div className="photo-container">
                  <img 
                    src={`/images/${photo.file_name}`} 
                    alt="User photo"
                    className="photo-image"
                  />
                  <div className="photo-date">
                    {new Date(photo.date_time).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="comments-section">
                  <h4>Comments ({photo.comments.length})</h4>
                  
                  {photo.comments.length > 0 && (
                    <div className="comments-list">
                      {photo.comments.map(comment => (
                        <div key={comment._id} className="comment">
                          <div className="comment-header">
                            <strong>{comment.user.first_name} {comment.user.last_name}</strong>
                            <span className="comment-date">
                              {new Date(comment.date_time).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="comment-text">{comment.comment}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="add-comment">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment[photo._id] || ''}
                      onChange={(e) => handleCommentChange(photo._id, e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddComment(photo._id);
                        }
                      }}
                      className="comment-input"
                    />
                    <button 
                      onClick={() => handleAddComment(photo._id)}
                      disabled={!newComment[photo._id] || !newComment[photo._id].trim()}
                      className="comment-button"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDetail; 