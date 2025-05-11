const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Configure dotenv to load the .env file from the root directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function dbConnect() {
  try {
    await mongoose.connect(process.env.DB_URL || "mongodb+srv://btvn256:oRUhIYE18pqvIj7h@cluster0.g3da2yh.mongodb.net/photo_sharing?retryWrites=true&w=majority&appName=Cluster0");
    console.log("Successfully connected to MongoDB Atlas!");
  } catch (error) {
    console.log("Unable to connect to MongoDB Atlas!");
    console.error(error);
  }
}

module.exports = dbConnect;
