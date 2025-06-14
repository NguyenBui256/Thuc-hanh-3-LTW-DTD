const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  first_name: { type: String },
  last_name: { type: String },
  location: { type: String },
  description: { type: String },
  occupation: { type: String },
  login_name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Check if the model already exists to avoid overwriting
module.exports = mongoose.models.Users || mongoose.model("Users", userSchema);
