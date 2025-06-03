// Load environment variables first
const path = require("path");
const dotenv = require("dotenv");

// Configure dotenv to load the .env file from the root directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const dbConnect = require("./db/dbConnect");
const apiRoutes = require("./routes/api");

// Connect to MongoDB
dbConnect();

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static images from the images directory
app.use('/images', express.static(path.join(__dirname, '../images')));

// API routes
app.use('/', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
