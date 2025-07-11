const express = require("express");
const Review = require("../models/Review");
// FIX: Destructure auth from the middleware object
const { auth, authWithEmailVerification } = require("../middleware/auth");
const { validateReview } = require("../middleware/validation");
const router = express.Router();

// Create or update review
router.post("/", authWithEmailVerification, validateReview, async (req, res) => {
  try {
    const { movieId, title, rating, review, spoiler } = req.body;

    // Check if review already exists
    let existingReview = await Review.findOne({
      user: req.user._id,
      "movie.movieId": movieId,
    });

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.review = review;
      existingReview.spoiler = spoiler || false;
      await existingReview.save();

      res.json({
        success: true,
        message: "Review updated successfully",
        data: existingReview,
      });
    } else {
      // Create new review
      const newReview = new Review({
        user: req.user._id,
        movie: {
          movieId,
          title,
        },
        rating,
        review,
        spoiler: spoiler || false,
      });

      await newReview.save();

      res.status(201).json({
        success: true,
        message: "Review created successfully",
        data: newReview,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get reviews for a movie
router.get("/movie/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ "movie.movieId": movieId })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ "movie.movieId": movieId });

    // Calculate average rating
    const avgRating = await Review.aggregate([
      { $match: { "movie.movieId": parseInt(movieId) } },
      { $group: { _id: null, averageRating: { $avg: "$rating" } } },
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: avgRating[0]?.averageRating || 0,
        totalReviews: total,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get user's reviews
router.get("/user/me", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get specific review
router.get("/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate(
      "user",
      "username avatar"
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Delete review
router.delete("/:id", authWithEmailVerification, async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get user's review for a specific movie
router.get("/user/movie/:movieId", auth, async (req, res) => {
  try {
    const { movieId } = req.params;

    const review = await Review.findOne({
      user: req.user._id,
      "movie.movieId": movieId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;