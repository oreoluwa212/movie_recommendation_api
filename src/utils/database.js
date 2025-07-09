// config/database.js (Updated - Remove deprecated options)
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Remove deprecated options
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected Successfully");

    // Connection event listeners
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
