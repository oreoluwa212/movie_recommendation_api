const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    movie: {
      movieId: {
        type: Number,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    review: {
      type: String,
      maxlength: 1000,
    },
    spoiler: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one review per user per movie
reviewSchema.index({ user: 1, "movie.movieId": 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
