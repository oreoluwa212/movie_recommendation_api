const express = require("express");
const tmdbService = require("../services/tmdbService");
const { authWithEmailVerification } = require("../middleware/auth");
const router = express.Router();

// Search movies
router.get("/search", async (req, res) => {
  try {
    const { query, page = 1 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const results = await tmdbService.searchMovies(query, page);
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get popular movies
router.get("/discover/popular", async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const movies = await tmdbService.getPopularMovies(page);

    res.json({
      success: true,
      data: movies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get top rated movies
router.get("/discover/top-rated", async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const movies = await tmdbService.getTopRatedMovies(page);

    res.json({
      success: true,
      data: movies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get now playing movies
router.get("/discover/now-playing", async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const movies = await tmdbService.getNowPlayingMovies(page);

    res.json({
      success: true,
      data: movies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get upcoming movies
router.get("/discover/upcoming", async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const movies = await tmdbService.getUpcomingMovies(page);

    res.json({
      success: true,
      data: movies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get genres
router.get("/data/genres", async (req, res) => {
  try {
    const genres = await tmdbService.getGenres();

    res.json({
      success: true,
      data: genres,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Filter movies - MOVED BEFORE /:id route to avoid conflicts
router.get("/filter", async (req, res) => {
  try {
    const {
      page = 1,
      minRating,
      maxRating,
      releaseYear,
      genres,
      sortBy = 'popularity.desc'
    } = req.query;

    console.log('Filter request received:', req.query);

    // Build filters object for TMDB discover API
    const filters = {
      page: parseInt(page),
      sort_by: sortBy
    };

    // Add rating filters
    if (minRating) {
      filters['vote_average.gte'] = parseFloat(minRating);
    }
    if (maxRating) {
      filters['vote_average.lte'] = parseFloat(maxRating);
    }

    // Add release year filter
    if (releaseYear) {
      filters.primary_release_year = parseInt(releaseYear);
    }

    // Add genre filter
    if (genres) {
      filters.with_genres = genres; // Can be comma-separated genre IDs
    }

    console.log('Filters being sent to TMDB:', filters);

    const movies = await tmdbService.discoverMovies(filters);

    console.log('Movies received from TMDB:', movies.results?.length || 0);

    res.json({
      success: true,
      data: movies,
    });
  } catch (error) {
    console.error("Movie filter error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get personalized recommendations
router.get("/recommendations/personalized", authWithEmailVerification, async (req, res) => {
  try {
    const user = req.user;
    const { page = 1 } = req.query;

    // Simple recommendation logic based on user's favorite genres
    let movies;
    if (user.preferences.genres && user.preferences.genres.length > 0) {
      // Get movies from user's preferred genres
      const randomGenre =
        user.preferences.genres[
        Math.floor(Math.random() * user.preferences.genres.length)
        ];
      movies = await tmdbService.getMoviesByGenre(randomGenre, page);
    } else {
      // Default to popular movies
      movies = await tmdbService.getPopularMovies(page);
    }

    res.json({
      success: true,
      data: movies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get movies by genre
router.get("/genre/:genreId", async (req, res) => {
  try {
    const { genreId } = req.params;
    const { page = 1 } = req.query;
    const movies = await tmdbService.getMoviesByGenre(genreId, page);

    res.json({
      success: true,
      data: movies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get similar movies
router.get("/:id/similar", async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1 } = req.query;
    const movies = await tmdbService.getSimilarMovies(id, page);

    res.json({
      success: true,
      data: movies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get movie recommendations (TMDB recommendations)
router.get("/:id/recommendations", async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1 } = req.query;
    const movies = await tmdbService.getMovieRecommendations(id, page);

    res.json({
      success: true,
      data: movies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get movie details - MOVED TO END to avoid catching other routes
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is a number
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID. ID must be a number.",
      });
    }

    const movie = await tmdbService.getMovieDetails(id);

    res.json({
      success: true,
      data: movie,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;