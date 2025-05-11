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
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use("/", apiRoutes);

app.get("/test", (req, res) => {
  res.json({ message: "API is working correctly" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
