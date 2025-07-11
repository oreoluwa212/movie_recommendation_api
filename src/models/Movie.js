const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    overview: String,
    poster: String,
    backdrop: String,
    releaseDate: {
      type: Date,
      index: true // Add index for filtering
    },
    genres: {
      type: [String],
      index: true // Add index for filtering
    },
    rating: {
      type: Number,
      index: true // Add index for filtering
    },
    runtime: Number,
    cast: [String],
    director: String,
    trailer: String,
    averageRating: {
      type: Number,
      default: 0,
    },
    ratingsCount: {
      type: Number,
      default: 0,
      index: true // Add index for popularity sorting
    },
    // Add popularity field if you want to store TMDB popularity score
    popularity: {
      type: Number,
      default: 0,
      index: true
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better filtering performance
movieSchema.index({ rating: -1, releaseDate: -1 });
movieSchema.index({ genres: 1, rating: -1 });
movieSchema.index({ releaseDate: -1, popularity: -1 });

// Text index for search
movieSchema.index({ title: "text", overview: "text" });

module.exports = mongoose.model("Movie", movieSchema);