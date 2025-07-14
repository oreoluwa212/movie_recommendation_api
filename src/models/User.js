const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    // Email verification fields
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    // Password reset fields
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    preferences: {
      genres: [String],
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
    },
    favoriteMovies: [
      {
        movieId: Number,
        title: String,
        poster: String,
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    watchedMovies: [
      {
        movieId: Number,
        title: String,
        poster: String,
        watchedAt: {
          type: Date,
          default: Date.now,
        },
        rating: {
          type: Number,
          min: 1,
          max: 10,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const crypto = require("crypto"); // Built-in Node.js module
  const token = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = token;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return token;
};

module.exports = mongoose.model("User", userSchema);