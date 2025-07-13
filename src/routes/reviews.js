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

    // Validate required fields
    if (!movieId || !title || !rating) {
      return res.status(400).json({
        success: false,
        message: "MovieId, title, and rating are required"
      });
    }

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
          movieId: parseInt(movieId), // Ensure it's a number
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
    console.error('Error creating/updating review:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Review already exists for this movie"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get reviews for a movie
router.get("/movie/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Validate movieId
    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: "Valid movieId is required"
      });
    }

    const reviews = await Review.find({ "movie.movieId": parseInt(movieId) })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ "movie.movieId": parseInt(movieId) });

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
    console.error('Error getting movie reviews:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get review statistics for a movie
router.get('/movie/:movieId/stats', async (req, res) => {
  try {
    const { movieId } = req.params;

    // Validate movieId
    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: "Valid movieId is required"
      });
    }

    // Get all reviews for the movie
    const reviews = await Review.find({ "movie.movieId": parseInt(movieId) });
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return res.json({
        success: true,
        data: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0
          }
        }
      });
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;

    // Calculate rating distribution (1-10 scale)
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    res.json({
      success: true,
      data: {
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(1)),
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Error getting review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    console.error('Error getting user reviews:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's review for a specific movie
router.get("/user/movie/:movieId", auth, async (req, res) => {
  try {
    const { movieId } = req.params;

    // Validate movieId
    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: "Valid movieId is required"
      });
    }

    const review = await Review.findOne({
      user: req.user._id,
      "movie.movieId": parseInt(movieId),
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
    console.error('Error getting user movie review:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get specific review
router.get("/:id", async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID format"
      });
    }

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
    console.error('Error getting review:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Like/Unlike review
router.post('/:id/like', auth, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    // Validate ObjectId format
    if (!reviewId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID format"
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Initialize likes array if it doesn't exist
    if (!review.likes) {
      review.likes = [];
    }

    // Check if user already liked the review
    const likedIndex = review.likes.findIndex(id => id.toString() === userId.toString());
    let liked = false;

    if (likedIndex > -1) {
      // Remove like
      review.likes.splice(likedIndex, 1);
      liked = false;
    } else {
      // Add like
      review.likes.push(userId);
      liked = true;
    }

    await review.save();

    res.json({
      success: true,
      message: liked ? 'Review liked successfully' : 'Review unliked successfully',
      liked,
      likesCount: review.likes.length
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Report review
router.post('/:id/report', auth, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    // DEBUG: Log the request body
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);

    const { reason } = req.body;

    // Validate ObjectId format
    if (!reviewId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID format"
      });
    }

    // Check if body exists
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing or invalid'
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Report reason is required'
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already reported this review
    const existingReport = review.reports?.find(report =>
      report.user.toString() === userId.toString()
    );

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this review'
      });
    }

    // Initialize reports array if it doesn't exist
    if (!review.reports) {
      review.reports = [];
    }

    // Add report
    review.reports.push({
      user: userId,
      reason: reason.trim(),
      createdAt: new Date()
    });

    await review.save();

    res.json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    console.error('Error reporting review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete review
router.delete("/:id", authWithEmailVerification, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID format"
      });
    }

    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to delete it",
      });
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;