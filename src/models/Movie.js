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
    releaseDate: Date,
    genres: [String],
    rating: Number,
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
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Movie", movieSchema);
