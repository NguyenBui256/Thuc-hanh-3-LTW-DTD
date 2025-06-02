// Load environment variables first
const path = require("path");
const dotenv = require("dotenv");

// Configure dotenv to load the .env file from the root directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const dbConnect = require("./db/dbConnect");
const apiRoutes = require("./routes/api");

// Connect to MongoDB
dbConnect();

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// API routes
app.use("/", apiRoutes);

app.get("/test", (req, res) => {
  res.json({ message: "API is working correctly" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
