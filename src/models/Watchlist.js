const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    movieId: {
      type: Number,
      required: [true, "Movie ID is required"],
      min: [1, "Movie ID must be a positive number"],
    },
    title: {
      type: String,
      required: [true, "Movie title is required"],
      trim: true,
      maxlength: [200, "Movie title cannot exceed 200 characters"],
    },
    poster: {
      type: String,
      trim: true,
      default: null,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
); // Disable _id for subdocuments

const watchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true, // Index for faster queries
    },
    name: {
      type: String,
      required: [true, "Watchlist name is required"],
      trim: true,
      minlength: [1, "Watchlist name cannot be empty"],
      maxlength: [100, "Watchlist name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    movies: {
      type: [movieSchema],
      default: [],
      validate: {
        validator: function (movies) {
          return movies.length <= 1000; // Limit to 1000 movies per watchlist
        },
        message: "Watchlist cannot contain more than 1000 movies",
      },
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true, // Index for faster queries on public watchlists
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for better query performance
watchlistSchema.index({ user: 1, createdAt: -1 });
watchlistSchema.index({ isPublic: 1, createdAt: -1 });

// Virtual for movie count
watchlistSchema.virtual("movieCount").get(function () {
  return this.movies.length;
});

// Method to add a movie to the watchlist
watchlistSchema.methods.addMovie = function (movieData) {
  // Check if movie already exists
  const existingMovie = this.movies.find(
    (movie) => movie.movieId === movieData.movieId
  );
  if (existingMovie) {
    throw new Error("Movie already exists in this watchlist");
  }

  // Add the movie
  this.movies.push(movieData);
  return this;
};

// Method to remove a movie from the watchlist
watchlistSchema.methods.removeMovie = function (movieId) {
  const initialLength = this.movies.length;
  this.movies = this.movies.filter((movie) => movie.movieId !== movieId);

  if (this.movies.length === initialLength) {
    throw new Error("Movie not found in this watchlist");
  }

  return this;
};

// Method to check if a movie exists in the watchlist
watchlistSchema.methods.hasMovie = function (movieId) {
  return this.movies.some((movie) => movie.movieId === movieId);
};

// Static method to find watchlists by user
watchlistSchema.statics.findByUser = function (userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

// Static method to find public watchlists
watchlistSchema.statics.findPublic = function (page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ isPublic: true })
    .populate("user", "username")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Pre-save middleware to validate movie uniqueness
watchlistSchema.pre("save", function (next) {
  // Check for duplicate movies in the same watchlist
  const movieIds = this.movies.map((movie) => movie.movieId);
  const uniqueMovieIds = [...new Set(movieIds)];

  if (movieIds.length !== uniqueMovieIds.length) {
    return next(
      new Error("Duplicate movies are not allowed in the same watchlist")
    );
  }

  next();
});

// Transform output to include virtual fields
watchlistSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Watchlist", watchlistSchema);
