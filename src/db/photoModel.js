const mongoose = require("mongoose");

/**
 * Define the Mongoose Schema for a Comment.
 */
const commentSchema = new mongoose.Schema({
  comment: String,
  date_time: { type: Date, default: Date.now },
  user_id: mongoose.Schema.Types.ObjectId,
  parent_id: { type: mongoose.Schema.Types.ObjectId, default: null }
});

/**
 * Define the Mongoose Schema for a Photo.
 */
const photoSchema = new mongoose.Schema({
  file_name: { type: String },
  date_time: { type: Date, default: Date.now },
  user_id: mongoose.Schema.Types.ObjectId,
  comments: [commentSchema],
});

/**
 * Create a Mongoose Model for a Photo using the photoSchema.
 */
// Check if the model already exists to avoid overwriting
const Photo = mongoose.models.Photos || mongoose.model("Photos", photoSchema);
module.exports = Photo;
