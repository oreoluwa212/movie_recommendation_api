const express = require("express");
const User = require("../models/User");
// FIX: Destructure auth from the middleware object
const { auth } = require("../middleware/auth");
const router = express.Router();

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { username, email, avatar, preferences } = req.body;
    const user = req.user;

    // Check if username/email already exists (excluding current user)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        ...(username && { username }),
        ...(email && { email }),
        ...(avatar && { avatar }),
        ...(preferences && { preferences }),
      },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Add movie to favorites
router.post("/favorites", auth, async (req, res) => {
  try {
    const { movieId, title, poster } = req.body;
    const user = req.user;

    // Check if movie is already in favorites
    const existingFavorite = user.favoriteMovies.find(
      (movie) => movie.movieId === movieId
    );

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: "Movie already in favorites",
      });
    }

    // Add to favorites
    user.favoriteMovies.push({
      movieId,
      title,
      poster,
    });

    await user.save();

    res.json({
      success: true,
      message: "Movie added to favorites",
      favorites: user.favoriteMovies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Remove movie from favorites
router.delete("/favorites/:movieId", auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = req.user;

    user.favoriteMovies = user.favoriteMovies.filter(
      (movie) => movie.movieId !== parseInt(movieId)
    );

    await user.save();

    res.json({
      success: true,
      message: "Movie removed from favorites",
      favorites: user.favoriteMovies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get user's favorites
router.get("/favorites", auth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      data: user.favoriteMovies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Add movie to watched list
router.post("/watched", auth, async (req, res) => {
  try {
    const { movieId, title, poster, rating } = req.body;
    const user = req.user;

    // Remove if already exists
    user.watchedMovies = user.watchedMovies.filter(
      (movie) => movie.movieId !== movieId
    );

    // Add to watched
    user.watchedMovies.push({
      movieId,
      title,
      poster,
      rating,
    });

    await user.save();

    res.json({
      success: true,
      message: "Movie added to watched list",
      watched: user.watchedMovies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get user's watched movies
router.get("/watched", auth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      data: user.watchedMovies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;