// Load environment variables first
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const dbConnect = require("./db/dbConnect");
const apiRoutes = require("./routes/api.js");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static images from the images directory
app.use('/images', express.static(path.join(__dirname, '../images')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here', // Use environment variable for production
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Connect to MongoDB
dbConnect();

// API routes
app.use("/", apiRoutes);

// Simple test route
app.get("/test", (req, res) => {
  res.status(200).json({ message: "API is working correctly" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 