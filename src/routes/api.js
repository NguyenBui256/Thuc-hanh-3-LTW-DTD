const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const User = require("../db/userModel");
const Photo = require("../db/photoModel");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const imagesDir = path.join(__dirname, "../../images");
    // Ensure images directory exists
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// File filter to only accept image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

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
    const { login_name, password } = req.body;
    
    if (!login_name) {
      return res.status(400).json({ error: "Login name is required" });
    }
    
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }
    
    const user = await User.findOne({ login_name: login_name });
    
    if (!user) {
      return res.status(400).json({ error: "Invalid login name or password" });
    }
    
    // Check password
    if (user.password !== password) {
      return res.status(400).json({ error: "Invalid login name or password" });
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

/**
 * POST /photos/new - Upload a new photo for the current user
 */
router.post("/photos/new", requireAuth, upload.single('uploadedphoto'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Please select a photo to upload." });
    }
    
    // Create new photo document
    const newPhoto = new Photo({
      file_name: req.file.filename,
      date_time: new Date(),
      user_id: req.session.user_id,
      comments: []
    });
    
    // Save to database
    await newPhoto.save();
    
    // Return success response with photo info
    res.status(200).json({
      message: "Photo uploaded successfully",
      photo: {
        _id: newPhoto._id,
        file_name: newPhoto.file_name,
        date_time: newPhoto.date_time,
        user_id: newPhoto.user_id
      }
    });
    
  } catch (error) {
    console.error("Error uploading photo:", error);
    
    // If there was an error and a file was uploaded, try to clean it up
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error cleaning up uploaded file:", unlinkError);
      }
    }
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "File too large. Maximum size is 10MB." });
    }
    
    if (error.message === 'Only image files are allowed!') {
      return res.status(400).json({ error: "Only image files are allowed. Please upload a valid image file." });
    }
    
    res.status(500).json({ error: "Server error uploading photo" });
  }
});

/**
 * POST /user - Register a new user
 */
router.post("/user", async (req, res) => {
  try {
    const { login_name, password, first_name, last_name, location, description, occupation } = req.body;
    
    // Validate required fields
    if (!login_name || typeof login_name !== 'string' || login_name.trim().length === 0) {
      return res.status(400).json({ error: "Login name is required and cannot be empty" });
    }
    
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return res.status(400).json({ error: "Password is required and cannot be empty" });
    }
    
    if (!first_name || typeof first_name !== 'string' || first_name.trim().length === 0) {
      return res.status(400).json({ error: "First name is required and cannot be empty" });
    }
    
    if (!last_name || typeof last_name !== 'string' || last_name.trim().length === 0) {
      return res.status(400).json({ error: "Last name is required and cannot be empty" });
    }
    
    // Check if login_name already exists
    const existingUser = await User.findOne({ login_name: login_name.trim() });
    if (existingUser) {
      return res.status(400).json({ error: "Login name already exists. Please choose a different one." });
    }
    
    // Create new user
    const newUser = new User({
      login_name: login_name.trim(),
      password: password.trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      location: location ? location.trim() : '',
      description: description ? description.trim() : '',
      occupation: occupation ? occupation.trim() : ''
    });
    
    // Save to database
    await newUser.save();
    
    // Return success response (excluding password)
    res.status(200).json({
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        login_name: newUser.login_name,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        location: newUser.location,
        description: newUser.description,
        occupation: newUser.occupation
      }
    });
    
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ error: "Login name already exists. Please choose a different one." });
    }
    
    res.status(500).json({ error: "Server error during registration" });
  }
});

module.exports = router; 