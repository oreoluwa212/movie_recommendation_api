const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const User = require("../models/User");
const { auth, authWithEmailVerification } = require("../middleware/auth");
const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create upload directory path for local development fallback
const getUploadDir = () => {
  const uploadPath = path.join(process.cwd(), "uploads/avatars");
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};

// Configure storage based on environment
const storage = process.env.NODE_ENV === 'production' || process.env.USE_CLOUDINARY === 'true'
  ? new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'movie-app/avatars',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      public_id: (req, file) => `avatar-${req.user.id}-${Date.now()}`,
    },
  })
  : multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, getUploadDir());
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Helper function to delete old avatar from Cloudinary
const deleteOldAvatar = async (avatarUrl) => {
  try {
    if (avatarUrl && avatarUrl.includes('cloudinary.com')) {
      // Extract public_id from Cloudinary URL
      const publicId = avatarUrl.split('/').pop().split('.')[0];
      const fullPublicId = `movie-app/avatars/${publicId}`;
      await cloudinary.uploader.destroy(fullPublicId);
      console.log(`Old avatar deleted: ${fullPublicId}`);
    }
  } catch (error) {
    console.error('Error deleting old avatar:', error);
  }
};

// Update user profile with file upload
router.put("/profile", auth, upload.single('avatar'), async (req, res) => {
  try {
    const { username, email, preferences } = req.body;
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

    // Handle avatar upload
    let avatarUrl = user.avatar; // Keep existing avatar by default
    if (req.file) {
      // Delete old avatar if it exists
      if (user.avatar) {
        await deleteOldAvatar(user.avatar);
      }

      // Set new avatar URL
      if (process.env.NODE_ENV === 'production' || process.env.USE_CLOUDINARY === 'true') {
        avatarUrl = req.file.path; // Cloudinary URL
      } else {
        avatarUrl = `/src/uploads/avatars/${req.file.filename}`; // Local URL
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        ...(username && { username }),
        ...(email && { email }),
        ...(avatarUrl && { avatar: avatarUrl }),
        ...(preferences && { preferences: JSON.parse(preferences) }), // Parse JSON string
      },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});

// Alternative: Upload avatar separately
router.post("/avatar", auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const user = req.user;

    // Delete old avatar if it exists
    if (user.avatar) {
      await deleteOldAvatar(user.avatar);
    }

    // Set new avatar URL
    let avatarUrl;
    if (process.env.NODE_ENV === 'production' || process.env.USE_CLOUDINARY === 'true') {
      avatarUrl = req.file.path; // Cloudinary URL
    } else {
      avatarUrl = `/src/uploads/avatars/${req.file.filename}`; // Local URL
    }

    // Update user's avatar
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Avatar uploaded successfully",
      avatar: avatarUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});

// Delete avatar
router.delete("/avatar", auth, async (req, res) => {
  try {
    const user = req.user;

    // Delete avatar from Cloudinary if it exists
    if (user.avatar) {
      await deleteOldAvatar(user.avatar);
    }

    // Remove avatar from user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { avatar: 1 } },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Avatar deleted successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Avatar deletion error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});

// Get user profile details
router.get("/profile", auth, async (req, res) => {
  try {
    const user = req.user;

    // Return user profile without sensitive information
    const userProfile = {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      preferences: user.preferences,
      favoriteMovies: user.favoriteMovies,
      watchedMovies: user.watchedMovies,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Add some computed fields that might be useful
      stats: {
        totalFavorites: user.favoriteMovies.length,
        totalWatched: user.watchedMovies.length,
        averageRating: user.watchedMovies.length > 0
          ? (user.watchedMovies.reduce((sum, movie) => sum + (movie.rating || 0), 0) / user.watchedMovies.length).toFixed(1)
          : 0
      }
    };

    res.json({
      success: true,
      message: "Profile retrieved successfully",
      user: userProfile,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Alternative: Get minimal profile info (for header/navbar)
router.get("/profile/minimal", auth, async (req, res) => {
  try {
    const user = req.user;

    const minimalProfile = {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      preferences: {
        theme: user.preferences?.theme || 'light'
      }
    };

    res.json({
      success: true,
      user: minimalProfile,
    });
  } catch (error) {
    console.error("Get minimal profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Add movie to favorites
router.post("/favorites", authWithEmailVerification, async (req, res) => {
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
router.delete("/favorites/:movieId", authWithEmailVerification, async (req, res) => {
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
router.post("/watched", authWithEmailVerification, async (req, res) => {
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

// Remove movie from watched list
router.delete("/watched/:movieId", authWithEmailVerification, async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = req.user;

    // Remove movie from watched list
    user.watchedMovies = user.watchedMovies.filter(
      (movie) => movie.movieId !== parseInt(movieId)
    );

    await user.save();

    res.json({
      success: true,
      message: "Movie removed from watched list",
      watched: user.watchedMovies,
    });
  } catch (error) {
    console.error("Remove from watched error:", error);
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