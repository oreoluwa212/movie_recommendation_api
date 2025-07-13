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

// Get popular movies - using discover with specific constraints
router.get("/discover/popular", async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const filters = {
      page: parseInt(page),
      sort_by: 'popularity.desc',
      'vote_count.gte': 500, // Ensure movies have enough votes
      'release_date.gte': '2020-01-01' // Focus on recent popular movies
    };

    const movies = await tmdbService.discoverMovies(filters);

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

// Get top rated movies - using discover with strict rating criteria
router.get("/discover/top-rated", async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const filters = {
      page: parseInt(page),
      sort_by: 'vote_average.desc',
      'vote_count.gte': 2000, // Ensure movies have substantial votes
      'vote_average.gte': 7.0 // Only highly rated movies
    };

    const movies = await tmdbService.discoverMovies(filters);

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

// Get now playing movies - using discover with current date range
router.get("/discover/now-playing", async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));
    const twoWeeksFromNow = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));

    const filters = {
      page: parseInt(page),
      sort_by: 'release_date.desc',
      'release_date.gte': fourWeeksAgo.toISOString().split('T')[0],
      'release_date.lte': twoWeeksFromNow.toISOString().split('T')[0],
      'vote_count.gte': 10 // Some votes but not too restrictive
    };

    const movies = await tmdbService.discoverMovies(filters);

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

// Get upcoming movies - using discover with future date range
router.get("/discover/upcoming", async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const sixMonthsFromNow = new Date(now.getTime() + (180 * 24 * 60 * 60 * 1000));

    const filters = {
      page: parseInt(page),
      sort_by: 'release_date.asc',
      'release_date.gte': oneWeekFromNow.toISOString().split('T')[0],
      'release_date.lte': sixMonthsFromNow.toISOString().split('T')[0]
    };

    const movies = await tmdbService.discoverMovies(filters);

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

// Get trending movies - different from popular
router.get("/discover/trending", async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const filters = {
      page: parseInt(page),
      sort_by: 'popularity.desc',
      'release_date.gte': oneMonthAgo.toISOString().split('T')[0],
      'vote_count.gte': 100
    };

    const movies = await tmdbService.discoverMovies(filters);

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

// Get highest grossing movies
router.get("/discover/highest-grossing", async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const filters = {
      page: parseInt(page),
      sort_by: 'revenue.desc',
      'vote_count.gte': 1000
    };

    const movies = await tmdbService.discoverMovies(filters);

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
      // Get movies from user's preferred genres using discover API for consistency
      const randomGenre =
        user.preferences.genres[
        Math.floor(Math.random() * user.preferences.genres.length)
        ];

      const filters = {
        page: parseInt(page),
        sort_by: 'popularity.desc',
        with_genres: randomGenre
      };

      movies = await tmdbService.discoverMovies(filters);
    } else {
      // Default to popular movies
      const filters = {
        page: parseInt(page),
        sort_by: 'popularity.desc'
      };
      movies = await tmdbService.discoverMovies(filters);
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

// Get movies by genre - using discover API for consistency
router.get("/genre/:genreId", async (req, res) => {
  try {
    const { genreId } = req.params;
    const { page = 1 } = req.query;

    const filters = {
      page: parseInt(page),
      sort_by: 'popularity.desc',
      with_genres: genreId
    };

    const movies = await tmdbService.discoverMovies(filters);

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