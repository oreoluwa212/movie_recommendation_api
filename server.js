// Enable module aliasing (must be first)
require("module-alias/register");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import routes
const authRoutes = require("@/routes/auth");
const movieRoutes = require("@/routes/movies");
const userRoutes = require("@/routes/users");
const watchlistRoutes = require("@/routes/watchlists");
const reviewRoutes = require("@/routes/reviews");

// Import middleware
const errorHandler = require("@/middleware/errorHandler");
const notFound = require("@/middleware/notFound");

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://stream-vibe-ebon.vercel.app'],
  credentials: true
}));

// Enhanced Rate limiting configuration
const isDev = process.env.NODE_ENV === "development";

// General API rate limiter (more lenient)
const generalLimiter = rateLimit({
  windowMs: isDev ? 1 * 60 * 1000 : parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: isDev ? 2000 : parseInt(process.env.RATE_LIMIT_MAX) || 500, // Increased from 100 to 500
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests to allow more traffic
  skip: (req, res) => res.statusCode < 400,
});

// Movie discovery endpoints rate limiter (most restrictive)
const movieDiscoveryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: isDev ? 100 : 30, // 30 requests per minute in production
  message: {
    error: "Too many movie discovery requests. Please wait a moment before trying again.",
    retryAfter: 60000
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to allow more requests for authenticated users
  keyGenerator: (req) => {
    // If user is authenticated, use user ID, otherwise use IP
    const userId = req.user?.id || req.headers.authorization?.split(' ')[1];
    return userId || req.ip;
  }
});

// Search endpoints rate limiter (moderate)
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDev ? 200 : 50, // 50 searches per minute
  message: {
    error: "Too many search requests. Please wait a moment before searching again.",
    retryAfter: 60000
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints rate limiter (strict for security)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100 : 10, // 10 auth attempts per 15 minutes
  message: {
    error: "Too many authentication attempts. Please try again later.",
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// User action rate limiter (moderate)
const userActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDev ? 500 : 100, // 100 user actions per minute
  message: {
    error: "Too many user actions. Please wait a moment before trying again.",
    retryAfter: 60000
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
app.use("/api/", generalLimiter);

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes with specific rate limiting
app.use("/api/auth", authLimiter, authRoutes);

// Movie routes with granular rate limiting
app.use("/api/movies/discover", movieDiscoveryLimiter); // Most restrictive
app.use("/api/movies/search", searchLimiter); // Moderate
app.use("/api/movies", movieRoutes);

// User routes with moderate rate limiting
app.use("/api/users", userActionLimiter, userRoutes);
app.use("/api/watchlists", userActionLimiter, watchlistRoutes);
app.use("/api/reviews", userActionLimiter, reviewRoutes);

// Health check route (no rate limiting)
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Root route to avoid 404 on '/'
app.get("/", (req, res) => {
  res.send(
    "🎬 Welcome to the Movie Recommendation API! Visit /api/health to check API status."
  );
});

// Enhanced error handler for rate limiting
app.use((err, req, res, next) => {
  // Handle rate limit errors specifically
  if (err.status === 429) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: err.message,
      retryAfter: err.retryAfter,
      timestamp: new Date().toISOString()
    });
  }
  next(err);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed.");
    process.exit(0);
  });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`Rate limiting configuration:`);
  console.log(`- General API: ${isDev ? 2000 : 500} requests per ${isDev ? 1 : 15} minutes`);
  console.log(`- Movie Discovery: ${isDev ? 100 : 30} requests per minute`);
  console.log(`- Search: ${isDev ? 200 : 50} requests per minute`);
  console.log(`- Auth: ${isDev ? 100 : 10} requests per 15 minutes`);
  console.log(`- User Actions: ${isDev ? 500 : 100} requests per minute`);
});

module.exports = app;