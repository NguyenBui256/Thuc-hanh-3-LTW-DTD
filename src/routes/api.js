const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../db/userModel");
const Photo = require("../db/photoModel");

/**
 * Get list of users for the navigation sidebar
 * Returns only _id, first_name, last_name
 */
router.get("/user/list", async (req, res) => {
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
router.get("/user/:id", async (req, res) => {
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
router.get("/photosOfUser/:id", async (req, res) => {
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