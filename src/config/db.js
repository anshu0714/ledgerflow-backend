const mongoose = require("mongoose");
const logger = require("../utils/logger.utils");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("Database connected");
  } catch (error) {
    logger.error("Database connection failed", {
      error: error.message,
    });
    throw error;
  }
};

module.exports = connectDB;
