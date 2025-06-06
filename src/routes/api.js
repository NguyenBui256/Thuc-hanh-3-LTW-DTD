const express = require("express");
const router = express.Router(); // router chia module ~ (controller) de co the tai su dung
const mongoose = require("mongoose");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const User = require("../db/userModel");
const Photo = require("../db/photoModel");

// JWT secret key - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

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

// JWT Authentication middleware
const requireAuth = (req, res, next) => {
  // optional chaining
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Lấy thông tin từ token gán lại cho req Object để sử dụng trong các routes tiếp theo.
    req.user_id = decoded.user_id;
    req.login_name = decoded.login_name;
    // Chuyển sang middleware/route handler tiếp theo
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

/**
 * POST /admin/login - Login a user
 */
// middleware body-parser đã được define ở server.js
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
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: user._id,
        login_name: user.login_name 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user info and token
    res.status(200).json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      login_name: user.login_name,
      token: token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

/**
 * POST /admin/logout - Logout a user (with JWT, logout is handled client-side)
 */
router.post("/admin/logout", requireAuth, (req, res) => {
  res.status(200).json({ message: "Logout successful" });
});

/**
 * GET /admin/session - Check current token validity and return user info
 */
router.get("/admin/session", requireAuth, async (req, res) => {
  try {
    // If we reach here, the token is valid (verified by requireAuth middleware)
    const user = await User.findById(req.user_id, "_id first_name last_name login_name");
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    res.status(200).json({
      user_id: user._id,
      login_name: user.login_name,
      first_name: user.first_name,
      last_name: user.last_name,
      logged_in: true
    });
  } catch (error) {
    console.error("Session check error:", error);
    res.status(500).json({ error: "Server error checking session" });
  }
});

/**
 * POST /commentsOfPhoto/:photo_id - Add a comment to a photo
 */
router.post("/commentsOfPhoto/:photo_id", requireAuth, async (req, res) => {
  try {
    const photoId = req.params.photo_id;
    const { comment, parent_id } = req.body;
    
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

    // If this is a reply, validate parent comment exists
    if (parent_id) {
      if (!mongoose.Types.ObjectId.isValid(parent_id)) {
        return res.status(400).json({ error: "Invalid parent comment ID format" });
      }
      
      const parentComment = photo.comments.id(parent_id);
      if (!parentComment) {
        return res.status(400).json({ error: "Parent comment not found" });
      }
    }

    // Create new comment object
    const newComment = {
      comment: comment.trim(),
      date_time: new Date(),
      user_id: req.user_id,
      parent_id: parent_id || null
    };

    // Add comment to photo
    photo.comments.push(newComment);
    await photo.save();

    // Get the newly added comment with user info for response
    const addedComment = photo.comments[photo.comments.length - 1];
    const commentUser = await User.findById(req.user_id, "_id first_name last_name");

    const responseComment = {
      _id: addedComment._id,
      comment: addedComment.comment,
      date_time: addedComment.date_time,
      user: commentUser,
      parent_id: addedComment.parent_id
    };

    res.status(200).json(responseComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Server error adding comment" });
  }
});

// /**
//  * GET /commentsOfPhoto/:photo_id - Get all comments for a photo including nested replies
//  */
// router.get("/commentsOfPhoto/:photo_id", requireAuth, async (req, res) => {
//   try {
//     const photoId = req.params.photo_id;
    
//     // Validate photo ID format
//     if (!mongoose.Types.ObjectId.isValid(photoId)) {
//       return res.status(400).json({ error: "Invalid photo ID format" });
//     }
    
//     // Find the photo and populate comments with user info
//     const photo = await Photo.findById(photoId);
//     if (!photo) {
//       return res.status(400).json({ error: "Photo not found" });
//     }
    
//     // Process comments to include user information and organize replies
//     const processedComments = await Promise.all(photo.comments.map(async (comment) => {
//       const commentUser = await User.findById(comment.user_id, "_id first_name last_name");
      
//       // Process replies to include user info
//       const processedReplies = await Promise.all(comment.replies.map(async (reply) => {
//         const replyUser = await User.findById(reply.user_id, "_id first_name last_name");
//         return {
//           _id: reply._id,
//           comment: reply.comment,
//           date_time: reply.date_time,
//           user: replyUser,
//           parent_id: comment._id
//         };
//       }));
      
//       return {
//         _id: comment._id,
//         comment: comment.comment,
//         date_time: comment.date_time,
//         user: commentUser,
//         parent_id: null,
//         replies: processedReplies
//       };
//     }));
    
//     res.status(200).json(processedComments);
//   } catch (error) {
//     console.error("Error fetching comments:", error);
//     res.status(500).json({ error: "Server error fetching comments" });
//   }
// });

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
        // First, get all comments that are not replies (parent comments)
        const parentComments = photo.comments.filter(comment => !comment.parent_id);
        
        photoObj.comments = await Promise.all(parentComments.map(async (comment) => {
          const commentUser = await User.findById(comment.user_id, "_id first_name last_name");
          
          // Get all replies for this comment
          const replies = photo.comments.filter(reply => reply.parent_id && reply.parent_id.toString() === comment._id.toString());
          
          // Process replies to include user info
          const processedReplies = await Promise.all(replies.map(async (reply) => {
            const replyUser = await User.findById(reply.user_id, "_id first_name last_name");
            return {
              _id: reply._id,
              comment: reply.comment,
              date_time: reply.date_time,
              user: replyUser || { _id: reply.user_id, first_name: "Unknown", last_name: "User" },
              parent_id: reply.parent_id
            };
          }));

          return {
            _id: comment._id,
            comment: comment.comment,
            date_time: comment.date_time,
            user: commentUser || { _id: comment.user_id, first_name: "Unknown", last_name: "User" },
            replies: processedReplies
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
      user_id: req.user_id,
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

router.put("/user/:id", requireAuth, async (req,res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    const user = await User.findById(userId);
    if(req.user_id != user._id) {
      return res.status(403).json({error: "You are not authorized to update this user"})
    }
    const { login_name, password, first_name, last_name, location, description, occupation } = req.body;
    if(!login_name || !first_name || !last_name || !location || !description || !occupation) {
      return res.status(400).json({error: "All fields are required"})
    }
    
    // Check if new login_name is different from current one
    if(login_name !== user.login_name) {
      const existingUser = await User.findOne({login_name: login_name});
      if(existingUser) {
        return res.status(400).json({error: "Login name already exists. Please choose a different one."})
      }
      user.login_name = login_name;
    }
    
    // Update password if provided
    if(password) {
      user.password = password;
    }
    
    // Update other fields
    user.first_name = first_name;
    user.last_name = last_name;
    user.location = location;
    user.description = description;
    user.occupation = occupation;
    
    await user.save();
    return res.status(200).json({
      message: "User updated successfully",
      user: {
        _id: user._id,
        login_name: user.login_name,
        first_name: user.first_name,
        last_name: user.last_name,
        location: user.location,
        description: user.description,
        occupation: user.occupation
      }
    });
  } catch(error) {
    console.error("Update user error:", error);
    return res.status(500).json({error: "Server error during user update"})
  }
})

module.exports = router; 

