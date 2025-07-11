const express = require("express");
const Watchlist = require("../models/Watchlist");
const { auth } = require("../middleware/auth");
const router = express.Router();

// Create watchlist
router.post("/", auth, async (req, res) => {
  try {
    console.log("Creating watchlist for user:", req.user._id);
    console.log("Request body:", req.body);

    const { name, description, isPublic } = req.body;

    // Validate required fields
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Watchlist name is required",
      });
    }

    const watchlist = new Watchlist({
      user: req.user._id,
      name: name.trim(),
      description: description ? description.trim() : "",
      isPublic: Boolean(isPublic),
    });

    const savedWatchlist = await watchlist.save();
    console.log("Watchlist created successfully:", savedWatchlist._id);

    res.status(201).json({
      success: true,
      message: "Watchlist created successfully",
      data: savedWatchlist,
    });
  } catch (error) {
    console.error("Error creating watchlist:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating watchlist",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get user's watchlists
router.get("/", auth, async (req, res) => {
  try {
    console.log("Fetching watchlists for user:", req.user._id);

    const watchlists = await Watchlist.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    console.log(`Found ${watchlists.length} watchlists for user`);

    res.json({
      success: true,
      data: watchlists,
    });
  } catch (error) {
    console.error("Error fetching user watchlists:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching watchlists",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get specific watchlist
router.get("/:id", auth, async (req, res) => {
  try {
    console.log(
      "Fetching watchlist:",
      req.params.id,
      "for user:",
      req.user._id
    );

    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid watchlist ID format",
      });
    }

    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      $or: [{ user: req.user._id }, { isPublic: true }],
    }).lean();

    if (!watchlist) {
      console.log("Watchlist not found or not accessible");
      return res.status(404).json({
        success: false,
        message: "Watchlist not found or not accessible",
      });
    }

    console.log("Watchlist found:", watchlist._id);
    res.json({
      success: true,
      data: watchlist,
    });
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching watchlist",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Update watchlist
router.put("/:id", auth, async (req, res) => {
  try {
    console.log(
      "Updating watchlist:",
      req.params.id,
      "for user:",
      req.user._id
    );
    console.log("Update data:", req.body);

    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid watchlist ID format",
      });
    }

    const { name, description, isPublic } = req.body;

    // Validate required fields
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Watchlist name is required",
      });
    }

    const updateData = {
      name: name.trim(),
      description: description ? description.trim() : "",
      isPublic: Boolean(isPublic),
    };

    const watchlist = await Watchlist.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!watchlist) {
      console.log("Watchlist not found or not owned by user");
      return res.status(404).json({
        success: false,
        message:
          "Watchlist not found or you do not have permission to update it",
      });
    }

    console.log("Watchlist updated successfully:", watchlist._id);
    res.json({
      success: true,
      message: "Watchlist updated successfully",
      data: watchlist,
    });
  } catch (error) {
    console.error("Error updating watchlist:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating watchlist",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Delete watchlist
router.delete("/:id", auth, async (req, res) => {
  try {
    console.log(
      "Deleting watchlist:",
      req.params.id,
      "for user:",
      req.user._id
    );

    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid watchlist ID format",
      });
    }

    const watchlist = await Watchlist.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!watchlist) {
      console.log("Watchlist not found or not owned by user");
      return res.status(404).json({
        success: false,
        message:
          "Watchlist not found or you do not have permission to delete it",
      });
    }

    console.log("Watchlist deleted successfully:", watchlist._id);
    res.json({
      success: true,
      message: "Watchlist deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting watchlist:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting watchlist",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Add movie to watchlist
router.post("/:id/movies", auth, async (req, res) => {
  try {
    console.log(
      "Adding movie to watchlist:",
      req.params.id,
      "for user:",
      req.user._id
    );
    console.log("Movie data:", req.body);

    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid watchlist ID format",
      });
    }

    const { movieId, title, poster } = req.body;

    // Validate required fields
    if (!movieId || !title) {
      return res.status(400).json({
        success: false,
        message: "Movie ID and title are required",
      });
    }

    // Validate movieId is a number
    const numericMovieId = parseInt(movieId);
    if (isNaN(numericMovieId)) {
      return res.status(400).json({
        success: false,
        message: "Movie ID must be a valid number",
      });
    }

    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!watchlist) {
      console.log("Watchlist not found or not owned by user");
      return res.status(404).json({
        success: false,
        message:
          "Watchlist not found or you do not have permission to modify it",
      });
    }

    // Check if movie already exists in watchlist
    const existingMovie = watchlist.movies.find(
      (movie) => movie.movieId === numericMovieId
    );

    if (existingMovie) {
      console.log("Movie already exists in watchlist");
      return res.status(400).json({
        success: false,
        message: "Movie already exists in this watchlist",
      });
    }

    // Add movie to watchlist
    const movieData = {
      movieId: numericMovieId,
      title: title.trim(),
      poster: poster || null,
    };

    watchlist.movies.push(movieData);
    await watchlist.save();

    console.log("Movie added to watchlist successfully");
    res.json({
      success: true,
      message: "Movie added to watchlist successfully",
      data: watchlist,
    });
  } catch (error) {
    console.error("Error adding movie to watchlist:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while adding movie to watchlist",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Remove movie from watchlist
router.delete("/:id/movies/:movieId", auth, async (req, res) => {
  try {
    console.log(
      "Removing movie from watchlist:",
      req.params.id,
      "movieId:",
      req.params.movieId
    );

    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid watchlist ID format",
      });
    }

    // Validate movieId is a number
    const numericMovieId = parseInt(req.params.movieId);
    if (isNaN(numericMovieId)) {
      return res.status(400).json({
        success: false,
        message: "Movie ID must be a valid number",
      });
    }

    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!watchlist) {
      console.log("Watchlist not found or not owned by user");
      return res.status(404).json({
        success: false,
        message:
          "Watchlist not found or you do not have permission to modify it",
      });
    }

    // Check if movie exists in watchlist
    const movieExists = watchlist.movies.some(
      (movie) => movie.movieId === numericMovieId
    );

    if (!movieExists) {
      console.log("Movie not found in watchlist");
      return res.status(404).json({
        success: false,
        message: "Movie not found in this watchlist",
      });
    }

    // Remove movie from watchlist
    watchlist.movies = watchlist.movies.filter(
      (movie) => movie.movieId !== numericMovieId
    );

    await watchlist.save();

    console.log("Movie removed from watchlist successfully");
    res.json({
      success: true,
      message: "Movie removed from watchlist successfully",
      data: watchlist,
    });
  } catch (error) {
    console.error("Error removing movie from watchlist:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing movie from watchlist",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get public watchlists
router.get("/public/all", async (req, res) => {
  try {
    console.log("Fetching public watchlists");

    const { page = 1, limit = 10 } = req.query;
    const numericPage = parseInt(page);
    const numericLimit = parseInt(limit);

    // Validate pagination parameters
    if (isNaN(numericPage) || numericPage < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive number",
      });
    }

    if (isNaN(numericLimit) || numericLimit < 1 || numericLimit > 100) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 100",
      });
    }

    const skip = (numericPage - 1) * numericLimit;

    const [watchlists, total] = await Promise.all([
      Watchlist.find({ isPublic: true })
        .populate("user", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      Watchlist.countDocuments({ isPublic: true }),
    ]);

    console.log(`Found ${watchlists.length} public watchlists`);

    res.json({
      success: true,
      data: {
        watchlists,
        pagination: {
          page: numericPage,
          limit: numericLimit,
          total,
          pages: Math.ceil(total / numericLimit),
          hasNext: numericPage < Math.ceil(total / numericLimit),
          hasPrev: numericPage > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching public watchlists:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching public watchlists",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
