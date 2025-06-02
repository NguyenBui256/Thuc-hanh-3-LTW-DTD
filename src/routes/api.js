const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../db/userModel");
const Photo = require("../db/photoModel");

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).json({ error: "Unauthorized - Please login" });
  }
  next();
};

/**
 * POST /admin/login - Login a user
 */
router.post("/admin/login", async (req, res) => {
  try {
    const { login_name } = req.body;
    
    if (!login_name) {
      return res.status(400).json({ error: "Login name is required" });
    }
    
    const user = await User.findOne({ login_name: login_name });
    
    if (!user) {
      return res.status(400).json({ error: "Invalid login name" });
    }
    
    // Store user info in session
    req.session.user_id = user._id;
    req.session.login_name = user.login_name;
    
    // Return user info (excluding sensitive data)
    res.status(200).json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      login_name: user.login_name
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

/**
 * POST /admin/logout - Logout a user
 */
router.post("/admin/logout", (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).json({ error: "No user currently logged in" });
  }
  
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Server error during logout" });
    }
    res.status(200).json({ message: "Logout successful" });
  });
});

/**
 * GET /admin/session - Check current session status
 */
router.get("/admin/session", (req, res) => {
  if (req.session.user_id) {
    res.status(200).json({
      user_id: req.session.user_id,
      login_name: req.session.login_name,
      logged_in: true
    });
  } else {
    res.status(200).json({ logged_in: false });
  }
});

/**
 * POST /commentsOfPhoto/:photo_id - Add a comment to a photo
 */
router.post("/commentsOfPhoto/:photo_id", requireAuth, async (req, res) => {
  try {
    const photoId = req.params.photo_id;
    const { comment } = req.body;
    
    // Validate photo ID format
    if (!mongoose.Types.ObjectId.isValid(photoId)) {
      return res.status(400).json({ error: "Invalid photo ID format" });
    }
    
    // Validate comment content
    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({ error: "Comment text is required and cannot be empty" });
    }
    
    // Find the photo
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(400).json({ error: "Photo not found" });
    }
    
    // Create new comment object
    const newComment = {
      comment: comment.trim(),
      date_time: new Date(),
      user_id: req.session.user_id
    };
    
    // Add comment to photo
    photo.comments.push(newComment);
    await photo.save();
    
    // Get the newly added comment with user info for response
    const addedComment = photo.comments[photo.comments.length - 1];
    const commentUser = await User.findById(req.session.user_id, "_id first_name last_name");
    
    const responseComment = {
      _id: addedComment._id,
      comment: addedComment.comment,
      date_time: addedComment.date_time,
      user: commentUser
    };
    
    res.status(200).json(responseComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Server error adding comment" });
  }
});

/**
 * Get list of users for the navigation sidebar
 * Returns only _id, first_name, last_name
 */
router.get("/user/list", requireAuth, async (req, res) => {
  try {
    const users = await User.find({}, "_id first_name last_name").sort({ _id: 1 });
    
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching user list:", error);
    res.status(500).json({ error: "Server error fetching user list" });
  }
});

/**
 * Get detailed information for a specific user
 * Returns _id, first_name, last_name, location, description, occupation
 */
router.get("/user/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Validate if the provided id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    
    const user = await User.findById(userId, "_id first_name last_name location description occupation");
    
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Server error fetching user details" });
  }
});

/**
 * Get photos of a specific user with comments
 * Returns array of photos with their comments and minimal user info for each comment
 */
router.get("/photosOfUser/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Validate if the provided id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    
    // Find all photos for the user
    const photos = await Photo.find({ user_id: userId });
    
    // Process photos to include user information in comments
    const processedPhotos = await Promise.all(photos.map(async (photo) => {
      // Create a new object with only the fields we want
      const photoObj = {
        _id: photo._id,
        user_id: photo.user_id,
        file_name: photo.file_name,
        date_time: photo.date_time,
        comments: []
      };
      
      // Process comments to include minimal user info
      if (photo.comments && photo.comments.length > 0) {
        photoObj.comments = await Promise.all(photo.comments.map(async (comment) => {
          const commentUser = await User.findById(comment.user_id, "_id first_name last_name");
          
          return {
            _id: comment._id,
            comment: comment.comment,
            date_time: comment.date_time,
            user: commentUser || { _id: comment.user_id, first_name: "Unknown", last_name: "User" }
          };
        }));
      }
      
      return photoObj;
    }));
    
    res.status(200).json(processedPhotos);
  } catch (error) {
    console.error("Error fetching user photos:", error);
    res.status(500).json({ error: "Server error fetching user photos" });
  }
});

module.exports = router; 