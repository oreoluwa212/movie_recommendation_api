const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { auth, requireEmailVerification } = require("../middleware/auth");
const { validateRegister, validateLogin } = require("../middleware/validation");
const emailService = require("../services/emailService");
const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register
router.post("/register", validateRegister, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create user
    const user = new User({ username, email, password });
    
    // Generate email verification code (6 digits)
    const verificationCode = generateVerificationCode();
    user.emailVerificationToken = verificationCode;
    user.emailVerificationExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    
    await user.save();

    // Send verification email with code
    try {
      await emailService.sendVerificationCode(email, verificationCode, username);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Continue registration even if email fails
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User created successfully. Please check your email for the verification code.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
      },
      emailVerificationRequired: true,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Login
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address before logging in. Check your inbox for the verification code.",
        emailVerificationRequired: true,
        email: user.email,
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
      },
      emailVerificationRequired: false,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Verify email with code
router.post("/verify-email", async (req, res) => {
  try {
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json({
        success: false,
        message: "Verification code and email are required",
      });
    }

    // Find user with valid code
    const user = await User.findOne({
      email: email,
      emailVerificationToken: code,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Verify the user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.username);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError);
    }

    res.json({
      success: true,
      message: "Email verified successfully! Welcome to StreamVibe.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Resend verification code (for unverified users)
router.post("/resend-verification-code", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    user.emailVerificationToken = verificationCode;
    user.emailVerificationExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send verification code
    try {
      await emailService.sendVerificationCode(user.email, verificationCode, user.username);
      
      res.json({
        success: true,
        message: "Verification code sent successfully",
      });
    } catch (emailError) {
      console.error("Resend verification failed:", emailError);
      res.status(500).json({
        success: false,
        message: "Failed to send verification code",
      });
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Resend verification code (for authenticated users)
router.post("/resend-verification", auth, async (req, res) => {
  try {
    const user = req.user;

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    user.emailVerificationToken = verificationCode;
    user.emailVerificationExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationCode(user.email, verificationCode, user.username);
      
      res.json({
        success: true,
        message: "Verification code sent successfully",
      });
    } catch (emailError) {
      console.error("Resend verification failed:", emailError);
      res.status(500).json({
        success: false,
        message: "Failed to send verification code",
      });
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      isEmailVerified: req.user.isEmailVerified,
      preferences: req.user.preferences,
      avatar: req.user.avatar,
    },
  });
});

// Get email verification status
router.get("/verification-status", auth, async (req, res) => {
  res.json({
    success: true,
    isEmailVerified: req.user.isEmailVerified,
    email: req.user.email,
  });
});

// Password reset request
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: "If an account with that email exists, a password reset code has been sent.",
      });
    }

    // Generate 6-digit password reset code
    const resetCode = generateVerificationCode();
    user.passwordResetToken = resetCode;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetCode(user.email, resetCode, user.username);
      
      res.json({
        success: true,
        message: "Password reset code sent successfully",
      });
    } catch (emailError) {
      console.error("Password reset email failed:", emailError);
      res.status(500).json({
        success: false,
        message: "Failed to send password reset code",
      });
    }
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Reset password with code
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, code, and new password are required",
      });
    }

    // Find user with valid reset code
    const user = await User.findOne({
      email: email,
      passwordResetToken: code,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;