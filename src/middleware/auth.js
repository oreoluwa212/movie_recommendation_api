const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Basic authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

// Middleware to require email verification
const requireEmailVerification = async (req, res, next) => {
  try {
    // First check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if email is verified
    if (!req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address to access this feature",
        emailVerificationRequired: true,
        email: req.user.email,
      });
    }

    next();
  } catch (error) {
    console.error("Email verification middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Combined middleware: auth + email verification
const authWithEmailVerification = [auth, requireEmailVerification];

module.exports = {
  auth,
  requireEmailVerification,
  authWithEmailVerification,
};